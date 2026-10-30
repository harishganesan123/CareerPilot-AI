"""Study tasks created by students in CareerPilot AI."""

from datetime import date, datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class StudyPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class StudyTaskStatus(str, Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


class StudyTask(SQLModel, table=True):
    __tablename__ = "study_tasks"

    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(
        foreign_key="users.id",
        nullable=False,
        index=True,
        ondelete="CASCADE",
    )

    title: str = Field(nullable=False, max_length=200)
    description: str = Field(default="", nullable=False, max_length=2000)
    subject: str = Field(nullable=False, max_length=120)
    due_date: Optional[date] = Field(default=None)
    estimated_minutes: int = Field(default=60, ge=5, le=1440)
    priority: StudyPriority = Field(
        default=StudyPriority.MEDIUM,
        nullable=False,
    )
    status: StudyTaskStatus = Field(
        default=StudyTaskStatus.PENDING,
        nullable=False,
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
