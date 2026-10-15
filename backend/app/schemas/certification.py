"""
Schemas for the certifications endpoints.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CertificationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    issuing_organization: Optional[str] = Field(default=None, max_length=200)
    issue_date: Optional[date] = None
    credential_url: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = Field(default=None, max_length=1000)


class CertificationUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    issuing_organization: Optional[str] = Field(default=None, max_length=200)
    issue_date: Optional[date] = None
    credential_url: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = Field(default=None, max_length=1000)


class CertificationRead(BaseModel):
    # Allows constructing directly from a SQLModel ORM object.
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    issuing_organization: Optional[str]
    issue_date: Optional[date]
    credential_url: Optional[str]
    description: Optional[str]
    created_at: datetime
