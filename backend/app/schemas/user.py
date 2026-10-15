"""
Schemas for user profile endpoints (GET/PATCH /api/users/me).
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    id: int
    name: str
    email: str
    programme: Optional[str] = None
    university: Optional[str] = None
    semester: Optional[int] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    career_goal: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class UserUpdateRequest(BaseModel):
    """
    Fields a user is allowed to self-update.

    Deliberately excludes id, email, password_hash, created_at, updated_at —
    those are either immutable for this phase or managed by the server.
    """

    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    programme: Optional[str] = Field(default=None, max_length=120)
    university: Optional[str] = Field(default=None, max_length=200)
    semester: Optional[int] = Field(default=None, ge=1, le=12)
    phone: Optional[str] = Field(default=None, max_length=30)
    bio: Optional[str] = Field(default=None, max_length=1000)
    career_goal: Optional[str] = Field(default=None, max_length=200)
