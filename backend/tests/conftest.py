"""
Shared fixtures for automated tests. No test here needs a database, a network
connection, or real AI credits: auth is overridden and the AI provider is faked.
"""
import pytest
from fastapi.testclient import TestClient

from app.ai.base import ChatMessage
from app.ai.rate_limit import reset_rate_limits
from app.ai.service import AIService, get_ai_service
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
