"""
StudentSkill model — a skill a student claims, with a self-reported
proficiency level.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class SkillCategory(str, Enum):
    PROGRAMMING = "Programming"
    AI_ML = "AI/ML"
    DATA = "Data"
    WEB_DEVELOPMENT = "Web Development"
    DATABASE = "Database"
    CLOUD = "Cloud"
    TOOLS = "Tools"
    SOFT_SKILLS = "Soft Skills"
    OTHER = "Other"


class Proficiency(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    EXPERT = "Expert"


# Deterministic mapping used for the dashboard's skill bars. This is a
# straightforward rendering of the student's own self-reported level — it is
# not an objective measurement of ability.
PROFICIENCY_PERCENT: dict[str, int] = {
    Proficiency.BEGINNER: 25,
    Proficiency.INTERMEDIATE: 50,
    Proficiency.ADVANCED: 75,
    Proficiency.EXPERT: 100,
}


class StudentSkill(SQLModel, table=True):
    __tablename__ = "student_skills"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        foreign_key="users.id",
        nullable=False,
        index=True,
        ondelete="CASCADE",
    )
    skill_name: str = Field(nullable=False, max_length=120)
    category: SkillCategory = Field(default=SkillCategory.OTHER, nullable=False)
    proficiency: Proficiency = Field(default=Proficiency.BEGINNER, nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )
