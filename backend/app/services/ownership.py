"""
Shared, ownership-scoped data access helpers.

Every student-owned resource (skills, projects, certifications, target
roles) is queried through these helpers so the "only ever touch the
authenticated user's own rows" rule lives in exactly one place instead of
being re-implemented — and potentially forgotten — in each router.
"""
from typing import Sequence, Type, TypeVar

from fastapi import HTTPException, status
from sqlmodel import Session, SQLModel, select

T = TypeVar("T", bound=SQLModel)


def list_owned(session: Session, model: Type[T], user_id: int) -> Sequence[T]:
    """Return every row of `model` belonging to this user."""
    statement = select(model).where(model.user_id == user_id)
    return session.exec(statement).all()


def get_owned_or_404(session: Session, model: Type[T], record_id: int, user_id: int) -> T:
    """
    Fetch a single row by id, but only if it belongs to this user.

    A record that exists but belongs to someone else raises the same 404 as
    a record that doesn't exist at all. Returning 403 here would confirm the
    id is real, which leaks information about other users' data.
    """
    record = session.get(model, record_id)
    if record is None or record.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found",
        )
    return record


def apply_updates(record: T, updates: dict) -> T:
    """Apply a dict of validated updates onto a record in place."""
    for field, value in updates.items():
        setattr(record, field, value)
    return record
