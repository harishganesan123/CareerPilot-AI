"""
Shared fixtures for automated tests. No test here needs a database, a network
connection, or real AI credits: auth is overridden and the AI provider is faked.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.ai.base import ChatMessage
from app.ai.rate_limit import reset_rate_limits
from app.ai.service import AIService, get_ai_service
from app.core.database import get_session
from app.core.deps import get_current_user
from app.main import app
from app.models.user import User


class FakeProvider:
    """Scriptable stand-in for a real provider. Records every call it receives."""

    name = "fake"

    def __init__(self, response: str | Exception = '{"message": "Hello!"}') -> None:
        self.response = response
        self.calls: list[dict] = []

    def generate(self, *, system_instruction, messages: list[ChatMessage], max_output_tokens,
                 temperature, response_schema=None) -> str:
        self.calls.append(
            {"system": system_instruction, "messages": messages,
             "max_output_tokens": max_output_tokens, "schema": response_schema}
        )
        if isinstance(self.response, Exception):
            raise self.response
        return self.response


@pytest.fixture(autouse=True)
def _clean_state():
    reset_rate_limits()
    yield
    app.dependency_overrides.clear()
    reset_rate_limits()


@pytest.fixture
def fake_user() -> User:
    return User(id=1, name="Test Student", email="t@example.com", password_hash="x")


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def authed_client(client, fake_user) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: fake_user
    return client


@pytest.fixture
def use_provider():
    """Install a FakeProvider behind the real AIService (real validation/limits)."""
    def _install(provider: FakeProvider) -> FakeProvider:
        app.dependency_overrides[get_ai_service] = lambda: AIService(provider)
        return provider
    return _install


# ---------------------------------------------------------------------------
# Database-backed fixtures (in-memory SQLite; no network, no Postgres needed)
# ---------------------------------------------------------------------------


@pytest.fixture
def db_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db(db_engine):
    """Route the app's `get_session` to the in-memory database."""
    def _override():
        # A fresh session per request, exactly like production.
        with Session(db_engine) as session:
            yield session

    app.dependency_overrides[get_session] = _override
    with Session(db_engine) as session:
        yield session


@pytest.fixture
def make_user(db):
    def _make(name: str, email: str) -> User:
        user = User(name=name, email=email, password_hash="x")
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    return _make


@pytest.fixture
def login_as(client):
    """Authenticate subsequent requests as the given persisted user."""
    def _login(user: User) -> TestClient:
        app.dependency_overrides[get_current_user] = lambda: user
        return client
    return _login


@pytest.fixture
def add_skill(db):
    from app.models.skill import Proficiency, StudentSkill

    def _add(user: User, name: str, level: Proficiency = Proficiency.INTERMEDIATE) -> StudentSkill:
        skill = StudentSkill(user_id=user.id, skill_name=name, proficiency=level)
        db.add(skill)
        db.commit()
        return skill
    return _add


@pytest.fixture
def add_task(db):
    from app.models.study_task import StudyTask, StudyTaskStatus

    def _add(user: User, subject: str, status=StudyTaskStatus.PENDING, title: str | None = None) -> StudyTask:
        task = StudyTask(user_id=user.id, title=title or f"Learn {subject}", subject=subject, status=status)
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
    return _add
