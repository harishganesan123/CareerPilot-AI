from pydantic import BaseModel, Field


class ReadinessFactor(BaseModel):
    name: str
    score: float = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)
    status: str
    details: str


class PlacementReadinessResponse(BaseModel):
    overall_score: float = Field(ge=0, le=100)
    readiness_level: str
    target_role: str | None = None
    factors: list[ReadinessFactor]
    strengths: list[str]
    improvement_areas: list[str]
    recommended_actions: list[str]
    disclaimer: str
