"""
Certification model — credentials a student has earned.
"""
from datetime import date, datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class Certification(SQLModel, table=True):
    __tablename__ = "certifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        foreign_key="users.id",
        nullable=False,
        index=True,
        ondelete="CASCADE",
    )
    name: str = Field(nullable=False, max_length=200)
    issuing_organization: Optional[str] = Field(default=None, max_length=200)
    issue_date: Optional[date] = Field(default=None)
    credential_url: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = Field(default=None, max_length=1000)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )
