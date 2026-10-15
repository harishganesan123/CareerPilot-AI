"""
Database connection layer built on SQLModel.

Works with any Postgres-compatible URL supplied via DATABASE_URL, including
a local PostgreSQL instance or a managed Neon PostgreSQL instance.

Schema changes are managed via Alembic migrations (see /backend/alembic and
`alembic upgrade head`) rather than by calling `SQLModel.metadata.create_all`
on every startup — that approach doesn't track schema changes and risks
"just recreate the table" workflows that lose data.
"""
from typing import Generator

from sqlmodel import Session, create_engine

from app.core.config import settings

# Import models here so their tables are registered on SQLModel.metadata,
# which Alembic's env.py reads for autogenerate. New models must be
# imported here too.
from app.models.user import User  # noqa: F401
from app.models.skill import StudentSkill  # noqa: F401
from app.models.project import StudentProject  # noqa: F401
from app.models.certification import Certification  # noqa: F401
from app.models.target_role import TargetRole  # noqa: F401

# `pool_pre_ping` keeps the pool healthy against dropped connections, which
# matters for managed/serverless Postgres providers such as Neon.
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    pool_pre_ping=True,
)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session per request."""
    with Session(engine) as session:
        yield session
