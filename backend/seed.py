# backend/seed.py
import uuid
from passlib.context import CryptContext

# 1. Import all models first so SQLAlchemy's mapper knows all classes
import app.models.base  # noqa: F401

from app.core.database import get_db_context
from app.models.user import User, Role, Region, AccountStatus

# Password hashing configuration
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")


def seed_database():
    with get_db_context() as db:
        print("Checking existing records...")
        existing_role = db.query(Role).filter_by(name="SYSTEM_ADMIN").first()
        if existing_role:
            print("Database has already been seeded.")
            return

        print("1. Seeding system roles...")
        roles = [
            Role(name="SYSTEM_ADMIN", description="Central Administrative Superuser"),
            Role(name="BUREAU_OFFICER", description="AICTE Bureau Approval Officer"),
            Role(name="REGIONAL_OFFICER", description="Regional Jurisdiction Head"),
            Role(name="COMMITTEE_MEMBER", description="Expert Visiting Committee Panelist"),
            Role(name="INSTITUTIONAL_ADMIN", description="Technical Institute Representative"),
            Role(name="COMPLIANCE_VERIFICATION_OFFICER", description="Undertakings Curing Officer"),
        ]
        db.add_all(roles)
        db.flush()

        print("2. Seeding default regional office...")
        region = Region(code="NRO", name="Northern Regional Office (Delhi)")
        db.add(region)
        db.flush()

        print("3. Seeding central administrative account...")
        admin_role = next(r for r in roles if r.name == "SYSTEM_ADMIN")
        admin_user = User(
            email="admin@aicte-india.org",
            full_name="AICTE Central Administrator",
            password_hash=pwd_context.hash("Admin@12345"),
            role_id=admin_role.id,
            region_id=region.id,
            account_status=AccountStatus.ACTIVE,
        )
        db.add(admin_user)
        db.commit()

        print("\n--- Seed Completed Successfully! ---")
        print("Superadmin Email:    admin@aicte-india.org")
        print("Default Password:    Admin@12345")


if __name__ == "__main__":
    seed_database()