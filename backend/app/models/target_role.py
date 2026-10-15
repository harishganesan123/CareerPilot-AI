"""
TargetRole model — the career roles a student is aiming for.
"""
from datetime import date, datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class RolePriority(str, Enum):
    PRIMARY = "Primary"
    SECONDARY = "Secondary"


class TargetRole(SQLModel, table=True):
    __tablename__ = "target_roles"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        foreign_key="users.id",
        nullable=False,
        index=True,
        ondelete="CASCADE",
    )
    role_name: str = Field(nullable=False, max_length=200)
    priority: RolePriority = Field(default=RolePriority.PRIMARY, nullable=False)
    target_date: Optional[date] = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )
