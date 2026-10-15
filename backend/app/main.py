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
    auth,
    career_goals,
    certifications,
    dashboard,
    health,
    projects,
    skills,
    users,
)
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
