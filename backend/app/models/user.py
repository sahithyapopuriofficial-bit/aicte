# backend/app/models/user.py
import datetime
import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


# -----------------------------------------------------------------------------
# Enums
# -----------------------------------------------------------------------------
class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"
    LOCKED = "LOCKED"


# -----------------------------------------------------------------------------
# Association Table: Role <-> Permission
# -----------------------------------------------------------------------------
class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = {"extend_existing": True}

    role_id = Column(Uuid, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(Uuid, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)


# -----------------------------------------------------------------------------
# Fine-Grained RBAC Permission Model
# -----------------------------------------------------------------------------
class Permission(Base):
    __tablename__ = "permissions"
    __table_args__ = {"extend_existing": True}

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    code = Column(String(64), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")


# -----------------------------------------------------------------------------
# System Role Model
# -----------------------------------------------------------------------------
class Role(Base):
    __tablename__ = "roles"
    __table_args__ = {"extend_existing": True}

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(64), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    permissions = relationship("Permission", secondary="role_permissions", back_populates="roles")
    users = relationship("User", back_populates="role")


# -----------------------------------------------------------------------------
# Jurisdictional Region Model (NRO, WRO, SRO, ERO, etc.)
# -----------------------------------------------------------------------------
class Region(Base):
    __tablename__ = "regions"
    __table_args__ = {"extend_existing": True}

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    code = Column(String(16), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)

    users = relationship("User", back_populates="region")
    institutions = relationship("Institution", back_populates="region")


# -----------------------------------------------------------------------------
# Core User Account Model
# -----------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email_status", "email", "account_status"),
        {"extend_existing": True},
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)

    role_id = Column(Uuid, ForeignKey("roles.id"), nullable=True, index=True)
    region_id = Column(Uuid, ForeignKey("regions.id"), nullable=True, index=True)
    institution_id = Column(Uuid, ForeignKey("institutions.id"), nullable=True, index=True)

    account_status = Column(
        SQLEnum(AccountStatus),
        default=AccountStatus.ACTIVE,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationships
    role = relationship("Role", back_populates="users")
    region = relationship("Region", back_populates="users")
    institution = relationship("Institution", back_populates="users")