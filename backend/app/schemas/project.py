"""
Schemas for the projects endpoints.

`technologies` is stored as a comma-separated string in the database but is
exposed to clients as a list of strings.
"""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.project import ProjectType


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    technologies: List[str] = Field(default_factory=list)
    project_type: ProjectType = ProjectType.PERSONAL
    role: Optional[str] = Field(default=None, max_length=120)
    github_url: Optional[str] = Field(default=None, max_length=500)
    demo_url: Optional[str] = Field(default=None, max_length=500)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    technologies: Optional[List[str]] = None
    project_type: Optional[ProjectType] = None
    role: Optional[str] = Field(default=None, max_length=120)
    github_url: Optional[str] = Field(default=None, max_length=500)
    demo_url: Optional[str] = Field(default=None, max_length=500)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectRead(BaseModel):
    id: int
    title: str
    description: Optional[str]
    technologies: List[str]
    project_type: ProjectType
    role: Optional[str]
    github_url: Optional[str]
    demo_url: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    created_at: datetime
    updated_at: datetime
