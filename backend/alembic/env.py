"""
Alembic migration environment.

The database URL is pulled from app.core.config.settings (i.e. from
DATABASE_URL / .env), never hard-coded in alembic.ini, so migrations run
against whatever database the app itself is configured for — local
PostgreSQL or Neon.
"""
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel

from alembic import context

# Ensure all models are imported so SQLModel.metadata is fully populated
# before autogenerate compares it against the database.
from app.core.config import settings
from app.models.user import User  # noqa: F401
from app.models.skill import StudentSkill  # noqa: F401
from app.models.project import StudentProject  # noqa: F401
from app.models.certification import Certification  # noqa: F401
from app.models.target_role import TargetRole  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
