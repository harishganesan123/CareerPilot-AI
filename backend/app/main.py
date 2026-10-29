"""
CareerPilot AI — FastAPI application entry point.

Phase 1 scope: app bootstrap, CORS, database connection, and a health-check
endpoint. Business logic (auth, AI services, RAG) is added in later phases.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import (
    ai,
    auth,
    career_goals,
    certifications,
    dashboard,
    health,
    projects,
    resume_analyzer,
    skill_gap,
    skills,
    study_recommendations,
    study_tasks,
    placement_readiness,
    career_recommendations,
    users,
    mock_interview
)
from app.ai.errors import AIError
from app.core.config import settings



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema is managed via Alembic migrations (`alembic upgrade head`),
    # run before starting the server — not via metadata.create_all() here.
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(skills.router, prefix=settings.API_PREFIX)
app.include_router(projects.router, prefix=settings.API_PREFIX)
app.include_router(certifications.router, prefix=settings.API_PREFIX)
app.include_router(career_goals.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(ai.router, prefix=settings.API_PREFIX)
app.include_router(skill_gap.router, prefix=settings.API_PREFIX)
app.include_router(resume_analyzer.router, prefix=settings.API_PREFIX)
app.include_router(mock_interview.router,prefix=settings.API_PREFIX,)
app.include_router(study_recommendations.router, prefix=settings.API_PREFIX)
app.include_router(career_recommendations.router,prefix=settings.API_PREFIX)
app.include_router(study_tasks.router, prefix=settings.API_PREFIX)
app.include_router(placement_readiness.router,prefix=settings.API_PREFIX)

@app.exception_handler(AIError)
async def ai_error_handler(request: Request, exc: AIError) -> JSONResponse:
    """Map AI-layer failures to safe responses (no prompts, payloads or keys)."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.public_message})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Never leak raw stack traces to the client. FastAPI's HTTPException flow
    is unaffected by this — only truly unexpected errors land here.
    """
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


@app.get("/")
def root() -> dict:
    return {"message": f"{settings.APP_NAME} backend is running."}
