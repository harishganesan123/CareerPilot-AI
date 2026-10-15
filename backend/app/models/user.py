"""
User model.

Core identity + academic/profile fields. Extended in Phase 2 with optional
profile fields (phone, bio, career_goal) and an `updated_at` timestamp.
Schema changes are tracked via Alembic migrations rather than by dropping
and recreating the table.
"""
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(nullable=False, max_length=120)
    email: str = Field(nullable=False, unique=True, index=True, max_length=255)
    password_hash: str = Field(nullable=False)
    programme: Optional[str] = Field(default=None, max_length=120)
    university: Optional[str] = Field(default=None, max_length=200)
    semester: Optional[int] = Field(default=None, ge=1, le=12)
    phone: Optional[str] = Field(default=None, max_length=30)
    bio: Optional[str] = Field(default=None, max_length=1000)
    career_goal: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
