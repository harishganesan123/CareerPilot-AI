"""
Schemas for the skills endpoints.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.skill import Proficiency, SkillCategory


class SkillCreate(BaseModel):
    skill_name: str = Field(min_length=1, max_length=120)
    category: SkillCategory = SkillCategory.OTHER
    proficiency: Proficiency = Proficiency.BEGINNER


class SkillUpdate(BaseModel):
    skill_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    category: Optional[SkillCategory] = None
    proficiency: Optional[Proficiency] = None


class SkillRead(BaseModel):
    id: int
    skill_name: str
    category: SkillCategory
    proficiency: Proficiency
    # Deterministic 0-100 rendering of the self-reported proficiency level,
    # provided so the frontend doesn't duplicate the mapping.
    proficiency_percent: int
    created_at: datetime
    updated_at: datetime
