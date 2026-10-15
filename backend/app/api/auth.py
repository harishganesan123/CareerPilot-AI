"""
Authentication endpoints.
"""
from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_user
from app.core.jwt import create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserPublic
from app.services.auth_service import authenticate_user, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _to_public(user: User) -> UserPublic:
    return UserPublic(
        id=user.id,
        name=user.name,
        email=user.email,
        programme=user.programme,
        university=user.university,
        semester=user.semester,
        phone=user.phone,
        bio=user.bio,
        career_goal=user.career_goal,
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, session: Session = Depends(get_session)) -> TokenResponse:
    """Create a new user account and return an access token, same as login."""
    user = register_user(session, data)
    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token, user=_to_public(user))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, session: Session = Depends(get_session)) -> TokenResponse:
    """Verify credentials and return a JWT access token."""
    user = authenticate_user(session, data)
    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token, user=_to_public(user))


@router.get("/me", response_model=UserPublic)
def read_current_user(current_user: User = Depends(get_current_user)) -> UserPublic:
    """Return the profile of the currently authenticated user."""
    return _to_public(current_user)
