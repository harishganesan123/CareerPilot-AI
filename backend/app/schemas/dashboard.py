"""
Schemas for the consolidated dashboard endpoint.
"""
from datetime import datetime
from typing import List

from pydantic import BaseModel

from app.schemas.auth import UserPublic
from app.schemas.certification import CertificationRead
from app.schemas.project import ProjectRead
from app.schemas.skill import SkillRead
from app.schemas.target_role import TargetRoleRead


class CompletionFactor(BaseModel):
    key: str
    label: str
    weight: int
    complete: bool


class ProfileCompletion(BaseModel):
    percent: int
    factors: List[CompletionFactor]


class ActivityItem(BaseModel):
    type: str
    description: str
    timestamp: datetime


class DashboardStats(BaseModel):
    skills_count: int
    projects_count: int
    certifications_count: int
    target_roles_count: int


class DashboardResponse(BaseModel):
    user: UserPublic
    profile_completion: ProfileCompletion
    skills: List[SkillRead]
    projects: List[ProjectRead]
    certifications: List[CertificationRead]
    target_roles: List[TargetRoleRead]
    stats: DashboardStats
    recent_activity: List[ActivityItem]
