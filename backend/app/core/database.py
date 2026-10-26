# backend/app/core/database.py
import logging
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

logger = logging.getLogger("complianceflow.database")

# -----------------------------------------------------------------------------
# Database Engine Initialization (PostgreSQL or Zero-Setup SQLite Fallback)
# -----------------------------------------------------------------------------
db_url = "sqlite:///./complianceflow.db"

is_sqlite = db_url.startswith("sqlite")

engine_kwargs = {}
if is_sqlite:
    # check_same_thread=False is required for SQLite when accessed across multiple FastAPI worker threads
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Standard connection pooling for PostgreSQL
    engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
    engine_kwargs["pool_timeout"] = settings.DB_POOL_TIMEOUT_SECONDS
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(
    db_url,
    echo=settings.DEBUG,
    future=True,
    **engine_kwargs,
)

# Session factory for generating isolated database sessions
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# -----------------------------------------------------------------------------
# SQLAlchemy 2.0 Declarative Base
# -----------------------------------------------------------------------------
class Base(DeclarativeBase):
    """
    Base declarative class for all relational models in AICTE ComplianceFlow.
    Inherited by User, Application, EVCSchedule, ComplianceObligation, Document, and AuditEvent models.
    """
    pass


# -----------------------------------------------------------------------------
# Session Lifecycle Dependency (FastAPI Routes)
# -----------------------------------------------------------------------------
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding an isolated database session per HTTP request.
    Automatically handles rollback on uncaught exceptions and guarantees session closure.
    """
    db: Session = SessionLocal()
    try:
        yield db
    except Exception as exc:
        db.rollback()
        logger.error("Rolling back database transaction due to unhandled request exception: %s", exc)
        raise
    finally:
        db.close()


# -----------------------------------------------------------------------------
# Standalone Context Manager (Background Tasks / CLI Scripts)
# -----------------------------------------------------------------------------
@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """
    Context manager for background executions, including:
    - APScheduler cron deadline sweeps
    - Database migration verifications
    - Table seed scripts
    """
    db: Session = SessionLocal()
    try:
        yield db
    except Exception as exc:
        db.rollback()
        logger.error("Rolling back transaction during background operation: %s", exc)
        raise
    finally:
        db.close()


# -----------------------------------------------------------------------------
# Health Check / Connectivity Probe
# -----------------------------------------------------------------------------
def check_db_connection() -> bool:
    """
    Executes a fast probe query (SELECT 1) against the database engine.
    Used by /health endpoints and application startup checks.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError as exc:
        logger.critical("Database health probe check failed: %s", exc)
        return False