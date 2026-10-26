# backend/app/main.py
import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import (
    applications,
    audit,
    auth,
    compliance,
    documents,
    escalations,
    evc,
    reports,
    workflow,
)
from app.core.config import settings
from app.core.database import check_db_connection, get_db_context
from app.services.escalation_service import EscalationEngineService

# -----------------------------------------------------------------------------
# Logging Configuration
# -----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s",
)
logger = logging.getLogger("complianceflow.main")

# -----------------------------------------------------------------------------
# Background Scheduler (Deadline Evaluation & Escalation Sweeps)
# -----------------------------------------------------------------------------
scheduler = BackgroundScheduler(timezone="UTC")


def scheduled_deadline_and_escalation_sweep():
    """
    Periodic job: Scans all active applications and compliance obligations,
    identifying SLA breaches and generating idempotent escalations.
    """
    try:
        with get_db_context() as db:
            engine = EscalationEngineService(db)
            checked, escalations_created, notifs = engine.run_deadline_evaluation()
            if escalations_created > 0 or notifs > 0:
                logger.info(
                    "Background SLA sweep complete: %d checked, %d escalations raised, %d notifications queued.",
                    checked,
                    escalations_created,
                    notifs,
                )
    except Exception as exc:
        logger.error("Error executing background SLA deadline sweep: %s", exc, exc_info=True)


# -----------------------------------------------------------------------------
# Application Lifespan Context Manager
# -----------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Lifecycle manager that safely starts and stops dependencies
    (database ping, scheduler, storage initialization).
    """
    logger.info("Initializing %s in [%s] environment...", settings.PROJECT_NAME, settings.ENVIRONMENT)

    # 1. Verify Database Connectivity
    if not check_db_connection():
        logger.critical("Database connectivity check failed on startup. Shutting down.")
        raise RuntimeError("Database unreachable at startup.")
    logger.info("Database connectivity established successfully.")

    # 2. Start Background APScheduler
    if not scheduler.running:
        scheduler.add_job(
            scheduled_deadline_and_escalation_sweep,
            trigger=IntervalTrigger(minutes=15),
            id="sla_deadline_evaluation_job",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )
        scheduler.start()
        logger.info("APScheduler initialized: Scheduled deadline sweep running every 15 minutes.")

    yield

    # Shutdown Lifecycle
    logger.info("Shutting down %s...", settings.PROJECT_NAME)
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler successfully stopped.")


# -----------------------------------------------------------------------------
# FastAPI App Construction
# -----------------------------------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Serious administrative workflow platform for technical institution approval applications, "
        "EVC scheduling, time-bound undertakings, institutional compliance, document validity, "
        "alerts, and escalations."
    ),
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)

# -----------------------------------------------------------------------------
# Middleware: CORS
# -----------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Correlation-ID"],
)


# -----------------------------------------------------------------------------
# Middleware: Correlation ID, Request Timing & Security Headers
# -----------------------------------------------------------------------------
@app.middleware("http")
async def process_request_security_and_metrics(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
    start_time = time.perf_counter()

    # Pass correlation ID downstream to endpoints
    request.state.correlation_id = correlation_id

    try:
        response: Response = await call_next(request)
    except Exception as exc:
        logger.critical(
            "Unhandled exception caught during request processing: %s | Correlation-ID: %s",
            exc,
            correlation_id,
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected system error occurred. Please quote the correlation ID.",
                "correlation_id": correlation_id,
            },
        )

    duration = time.perf_counter() - start_time
    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["X-Process-Time"] = f"{duration:.4f}s"

    # Enforce standard security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"

    if settings.COOKIE_SECURE:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    return response


# -----------------------------------------------------------------------------
# Exception Handlers (Standardized JSON Envelopes)
# -----------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    logger.warning("Validation error on %s: %s | Correlation-ID: %s", request.url.path, exc.errors(), correlation_id)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_ERROR",
            "message": "The submitted payload failed data structure or business constraint validation.",
            "details": exc.errors(),
            "correlation_id": correlation_id,
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "REQUEST_ERROR",
            "message": exc.detail,
            "correlation_id": correlation_id,
        },
        headers=exc.headers,
    )


# -----------------------------------------------------------------------------
# Health Check & Readiness Probes
# -----------------------------------------------------------------------------
@app.get("/health", tags=["System Health"], status_code=status.HTTP_200_OK)
def health_probe():
    """
    Subsystem readiness endpoint for container orchestration and uptime monitors.
    """
    is_db_ready = check_db_connection()
    is_scheduler_running = scheduler.running

    overall_status = "HEALTHY" if (is_db_ready and is_scheduler_running) else "DEGRADED"
    http_status = status.HTTP_200_OK if overall_status == "HEALTHY" else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=http_status,
        content={
            "status": overall_status,
            "subsystems": {
                "database": "UP" if is_db_ready else "DOWN",
                "scheduler": "RUNNING" if is_scheduler_running else "STOPPED",
            },
            "environment": settings.ENVIRONMENT,
            "version": "1.0.0",
        },
    )


# -----------------------------------------------------------------------------
# Register Modular API Routers
# -----------------------------------------------------------------------------
api_v1_prefix = settings.API_V1_STR

app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(applications.router, prefix=api_v1_prefix)
app.include_router(workflow.router, prefix=api_v1_prefix)
app.include_router(evc.router, prefix=api_v1_prefix)
app.include_router(compliance.router, prefix=api_v1_prefix)
app.include_router(documents.router, prefix=api_v1_prefix)
app.include_router(escalations.router, prefix=api_v1_prefix)
app.include_router(audit.router, prefix=api_v1_prefix)
app.include_router(reports.router, prefix=api_v1_prefix)


# -----------------------------------------------------------------------------
# Root Information Endpoint
# -----------------------------------------------------------------------------
@app.get("/", tags=["System Information"])
def root_service_info():
    return {
        "service": settings.PROJECT_NAME,
        "description": "Integrated Approval Workflow Automation, Compliance Monitoring and Alert Management System",
        "api_v1_base": settings.API_V1_STR,
        "documentation": f"{settings.API_V1_STR}/docs" if settings.ENVIRONMENT != "production" else "Disabled in production",
        "health_check": "/health",
    }