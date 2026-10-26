# backend/app/api/v1/auth.py
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import create_access_token, verify_password
from app.models.user import User, AccountStatus
from app.schemas.auth import LoginRequest, TokenResponse, UserProfileResponse, MessageResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication & Session"])


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and issue session",
)
def login(
    request: Request,
    response: Response,
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    audit = AuditService(db)
    client_ip = request.client.host if request.client else "unknown"
    correlation_id = request.headers.get("X-Correlation-ID")

    # Generic error message to prevent account enumeration
    invalid_credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = db.query(User).filter(User.email == login_data.email.strip().lower()).first()
    
    # Check credentials using constant-time comparison
    if not user or not user.password_hash or not verify_password(login_data.password, user.password_hash):
        audit.log(
            actor_id=user.id if user else None,
            action="LOGIN_FAILURE",
            resource_type="AUTH",
            resource_id=login_data.email,
            outcome="FAILURE",
            correlation_id=correlation_id,
            metadata={"ip": client_ip, "reason": "INVALID_CREDENTIALS"},
        )
        raise invalid_credentials_error

    # Enforce account lifecycle status
    if user.account_status != AccountStatus.ACTIVE:
        audit.log(
            actor_id=user.id,
            action="LOGIN_REJECTED",
            resource_type="AUTH",
            resource_id=str(user.id),
            outcome="DENIED",
            correlation_id=correlation_id,
            metadata={"ip": client_ip, "status": user.account_status.value},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is currently {user.account_status.value}. Contact system administration.",
        )

    # Issue access token
    token_lifetime = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_payload = {
        "sub": str(user.id),
        "role": user.role.name,
        "institution_id": str(user.institution_id) if user.institution_id else None,
        "region_id": str(user.region_id) if user.region_id else None,
    }
    access_token = create_access_token(data=token_payload, expires_delta=token_lifetime)

    # Set secure, HttpOnly, SameSite session cookie
    response.set_cookie(
        key="complianceflow_session",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,  # True in staging/production over HTTPS
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    # Record login audit
    audit.log(
        actor_id=user.id,
        action="LOGIN_SUCCESS",
        resource_type="AUTH",
        resource_id=str(user.id),
        outcome="SUCCESS",
        correlation_id=correlation_id,
        metadata={"ip": client_ip, "role": user.role.name},
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Invalidate session and clear cookies",
)
def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    audit = AuditService(db)
    client_ip = request.client.host if request.client else "unknown"

    # Clear HttpOnly session cookie
    response.delete_cookie(
        key="complianceflow_session",
        path="/",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
    )

    audit.log(
        actor_id=current_user.id,
        action="LOGOUT",
        resource_type="AUTH",
        resource_id=str(current_user.id),
        outcome="SUCCESS",
        metadata={"ip": client_ip},
    )

    return MessageResponse(detail="Session successfully terminated.")


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get authenticated user profile and permissions scope",
)
def get_authenticated_profile(current_user: User = Depends(get_current_user)):
    return UserProfileResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role.name,
        institution_id=current_user.institution_id,
        region_id=current_user.region_id,
        account_status=current_user.account_status.value,
    )