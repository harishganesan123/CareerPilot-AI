"""
Certifications endpoints. All routes are scoped to the authenticated user.
"""
from typing import List

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.certification import Certification
from app.models.user import User
from app.schemas.certification import (
    CertificationCreate,
    CertificationRead,
    CertificationUpdate,
)
from app.services.ownership import apply_updates, get_owned_or_404, list_owned

router = APIRouter(prefix="/certifications", tags=["certifications"])


@router.get("", response_model=List[CertificationRead])
def list_certifications(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> List[Certification]:
    return list(list_owned(session, Certification, current_user.id))


@router.post("", response_model=CertificationRead, status_code=status.HTTP_201_CREATED)
def create_certification(
    data: CertificationCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Certification:
    certification = Certification(user_id=current_user.id, **data.model_dump())
    session.add(certification)
    session.commit()
    session.refresh(certification)
    return certification


@router.patch("/{certification_id}", response_model=CertificationRead)
def update_certification(
    certification_id: int,
    data: CertificationUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Certification:
    certification = get_owned_or_404(
        session, Certification, certification_id, current_user.id
    )
    apply_updates(certification, data.model_dump(exclude_unset=True))
    session.add(certification)
    session.commit()
    session.refresh(certification)
    return certification


@router.delete("/{certification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certification(
    certification_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> None:
    certification = get_owned_or_404(
        session, Certification, certification_id, current_user.id
    )
    session.delete(certification)
    session.commit()
