"""
StudentProject model — academic, personal, or professional projects a
student wants to showcase.
"""
from datetime import date, datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class ProjectType(str, Enum):
    ACADEMIC = "Academic"
    PERSONAL = "Personal"
    INTERNSHIP = "Internship"
    HACKATHON = "Hackathon"
    RESEARCH = "Research"


class StudentProject(SQLModel, table=True):
    __tablename__ = "student_projects"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        foreign_key="users.id",
        nullable=False,
        index=True,
        ondelete="CASCADE",
    )
    title: str = Field(nullable=False, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    # Stored as a comma-separated string for now; the API layer exposes it as
    # a list of strings so the frontend never has to parse it.
    technologies: Optional[str] = Field(default=None, max_length=500)
    project_type: ProjectType = Field(default=ProjectType.PERSONAL, nullable=False)
    role: Optional[str] = Field(default=None, max_length=120)
    github_url: Optional[str] = Field(default=None, max_length=500)
    demo_url: Optional[str] = Field(default=None, max_length=500)
    start_date: Optional[date] = Field(default=None)
    end_date: Optional[date] = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )
