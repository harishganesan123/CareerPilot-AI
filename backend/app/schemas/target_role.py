"""
Schemas for the career-goals (target roles) endpoints.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.target_role import RolePriority


class TargetRoleCreate(BaseModel):
    role_name: str = Field(min_length=1, max_length=200)
    priority: RolePriority = RolePriority.PRIMARY
    target_date: Optional[date] = None


class TargetRoleUpdate(BaseModel):
    role_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    priority: Optional[RolePriority] = None
    target_date: Optional[date] = None


class TargetRoleRead(BaseModel):
    # Allows constructing directly from a SQLModel ORM object.
    model_config = ConfigDict(from_attributes=True)

    id: int
    role_name: str
    priority: RolePriority
    target_date: Optional[date]
    created_at: datetime
