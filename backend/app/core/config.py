# backend/app/core/config.py
import os
from pathlib import Path
from typing import List, Literal, Union
from pydantic import (
    AnyHttpUrl,
    EmailStr,
    Field,
    PostgresDsn,
    ValidationInfo,
    field_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # -------------------------------------------------------------------------
    # Application & Environment Identification
    # -------------------------------------------------------------------------
    PROJECT_NAME: str = "AICTE ComplianceFlow"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: Literal["development", "staging", "production", "test"] = "development"
    DEBUG: bool = False

    # -------------------------------------------------------------------------
    # Authentication, Session & Token Security
    # -------------------------------------------------------------------------
    # Secure random 256-bit key for JWT signing
    SECRET_KEY: str = Field(
        default="development-insecure-secret-key-change-in-production-min-32-chars",
        description="Cryptographic secret key for signing session tokens and credentials",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours standard work shift session

    # Cookie Security Parameters
    COOKIE_NAME: str = "complianceflow_session"
    COOKIE_DOMAIN: Union[str, None] = None
    COOKIE_SECURE: bool = False  # Enforced to True in production validator below
    COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"

    # -------------------------------------------------------------------------
    # Database (PostgreSQL Relational Storage)
    # -------------------------------------------------------------------------
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "compliance_user"
    POSTGRES_PASSWORD: str = "compliance_pass"
    POSTGRES_DB: str = "aicte_complianceflow"
    DATABASE_URL: Union[PostgresDsn, str, None] = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Union[str, None], info: ValidationInfo) -> str:
        if isinstance(v, str) and v.strip():
            return v
        data = info.data
        return (
            f"postgresql://{data.get('POSTGRES_USER')}:{data.get('POSTGRES_PASSWORD')}@"
            f"{data.get('POSTGRES_SERVER')}:{data.get('POSTGRES_PORT')}/{data.get('POSTGRES_DB')}"
        )

    # Database Pool Tuning
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT_SECONDS: int = 30

    # -------------------------------------------------------------------------
    # CORS (Cross-Origin Resource Sharing)
    # -------------------------------------------------------------------------
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # -------------------------------------------------------------------------
    # Local Document & Evidence Storage
    # -------------------------------------------------------------------------
    LOCAL_STORAGE_DIR: str = Field(
        default=str(Path(__file__).resolve().parents[2] / "storage_uploads"),
        description="Path on host/container filesystem for regulatory evidence files",
    )
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB per document

    # -------------------------------------------------------------------------
    # Notification & Mail Adapter (Local Outbox / Development SMTP)
    # -------------------------------------------------------------------------
    SMTP_ENABLED: bool = False
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025  # Standard MailHog / Mailpit local debugging port
    SMTP_USER: Union[str, None] = None
    SMTP_PASSWORD: Union[str, None] = None
    SMTP_TLS: bool = False
    EMAILS_FROM_EMAIL: EmailStr = "noreply-compliance@aicte-india.org"
    EMAILS_FROM_NAME: str = "AICTE ComplianceFlow Automation"

    # -------------------------------------------------------------------------
    # Regulatory Business Constants & Defaults
    # -------------------------------------------------------------------------
    DEFAULT_STAGE_SLA_DAYS: int = 15
    UPCOMING_DEADLINE_WARNING_HOURS: int = 48
    DOCUMENT_EXPIRY_WARNING_DAYS: int = 30
    DEFAULT_PAGE_SIZE: int = 15
    MAX_PAGE_SIZE: int = 100

    # -------------------------------------------------------------------------
    # Production Validation Guards
    # -------------------------------------------------------------------------
    @field_validator("COOKIE_SECURE", mode="after")
    @classmethod
    def enforce_secure_cookies_in_prod(cls, v: bool, info: ValidationInfo) -> bool:
        env = info.data.get("ENVIRONMENT")
        if env in ("production", "staging"):
            return True
        return v

    @field_validator("SECRET_KEY", mode="after")
    @classmethod
    def validate_secret_key_strength(cls, v: str, info: ValidationInfo) -> str:
        env = info.data.get("ENVIRONMENT")
        if env == "production" and (
            "insecure" in v or len(v) < 32 or v == "development-insecure-secret-key-change-in-production-min-32-chars"
        ):
            raise ValueError(
                "Insecure or default SECRET_KEY detected. Production mandates a cryptographically strong key (minimum 32 characters)."
            )
        return v


# Instantiate singleton settings object
settings = Settings()

# Ensure local document storage directory exists upon application startup
os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)