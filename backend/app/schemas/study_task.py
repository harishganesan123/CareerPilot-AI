"""Request and response schemas for study tasks."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.study_task import StudyPriority, StudyTaskStatus


class StudyTaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    subject: str = Field(min_length=1, max_length=120)
    due_date: Optional[date] = None
    estimated_minutes: int = Field(default=60, ge=5, le=1440)
    priority: StudyPriority = StudyPriority.MEDIUM


class StudyTaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    subject: Optional[str] = Field(default=None, min_length=1, max_length=120)
    due_date: Optional[date] = None
    estimated_minutes: Optional[int] = Field(default=None, ge=5, le=1440)
    priority: Optional[StudyPriority] = None
    status: Optional[StudyTaskStatus] = None


class StudyTaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    subject: str
    due_date: Optional[date]
    estimated_minutes: int
    priority: StudyPriority
    status: StudyTaskStatus
    created_at: datetime
    updated_at: datetime
