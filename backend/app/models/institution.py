# backend/app/models/institution.py
import datetime
import enum
import uuid

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.core.database import Base


class InstitutionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DEEMED = "DEEMED"
    UNDER_REVIEW = "UNDER_REVIEW"
    SUSPENDED = "SUSPENDED"
    WITHDRAWN = "WITHDRAWN"


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    code = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    region_id = Column(Uuid, ForeignKey("regions.id"), nullable=True, index=True)
    status = Column(SQLEnum(InstitutionStatus), default=InstitutionStatus.ACTIVE, nullable=False)

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
    region = relationship("Region", back_populates="institutions")
    users = relationship("User", back_populates="institution")
    applications = relationship("Application", back_populates="institution")