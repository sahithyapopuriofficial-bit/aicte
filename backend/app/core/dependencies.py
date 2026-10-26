# backend/app/core/dependencies.py
import uuid
from typing import Any, Dict, Generator, List, Optional, Union

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import AccountStatus, Role, User

# Support extraction of bearer tokens from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_token_from_request(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
) -> str:
    """
    Extracts the JWT access token from Authorization header or 'access_token' cookie.
    """
    if bearer_token:
        return bearer_token

    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        if cookie_token.startswith("Bearer "):
            return cookie_token[7:]
        return cookie_token

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication credentials not provided.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def decode_jwt_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a signed JWT access token.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    token: str = Depends(get_token_from_request),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolves the authenticated User record from the database.
    """
    payload = decode_jwt_token(token)
    user_id_str: Optional[str] = payload.get("sub")

    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token: subject identifier missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token: invalid subject UUID.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.account_status != AccountStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {user.account_status.value.lower()}.",
        )

    return user


class RequireRole:
    """
    Dependency to enforce Role-Based Access Control (RBAC).
    Supports single strings, multiple positional strings, or a list:
      RequireRole("SYSTEM_ADMIN")
      RequireRole("SYSTEM_ADMIN", "BUREAU_OFFICER")
      RequireRole(["SYSTEM_ADMIN", "BUREAU_OFFICER"])
    """

    def __init__(self, *roles: Union[str, List[str]]):
        if len(roles) == 1 and isinstance(roles[0], (list, tuple, set)):
            self.allowed_roles = [str(r) for r in roles[0]]
        else:
            self.allowed_roles = [str(r) for r in roles]

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        user_role_name = current_user.role.name if current_user.role else None

        if not user_role_name or user_role_name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not possess the necessary authorization permissions for this operation.",
            )
        return current_user


# Alias for compatibility across older modules
RoleChecker = RequireRole