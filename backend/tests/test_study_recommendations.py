"""Phase 3A tests: rule-based GET (unchanged behaviour) and AI POST /ai.
The AI provider is always faked; no real model calls are made."""
import json

import pytest

from app.ai.errors import AIProviderError, AIRateLimitError, AITimeoutError
from app.core.config import settings
from app.main import app
from app.models.skill import Proficiency
from app.models.study_task import StudyTask, StudyTaskStatus
from sqlmodel import select
from tests.conftest import FakeProvider

GET_URL = "/api/study-recommendations"
AI_URL = "/api/study-recommendations/ai"
ROLE = "Python Developer"
# Python Developer requires: Python, Object-Oriented Programming, REST APIs, SQL, Git, Testing, Debugging


def rec(skill, order=1, **over):
    item = {
        "skill_name": skill, "priority": "High", "reason": "Core to the role.",
        "suggested_activity": "Build a small exercise.", "estimated_minutes": 60,
        "order": order, "prerequisites": [], "expected_outcome": "Can use it in a small project.",
    }
    item.update(over)
    return item


def payload(*items):
    return json.dumps({"recommendations": list(items)})


def post(client, role=ROLE):
    return client.post(AI_URL, json={"role_name": role})


@pytest.fixture
def student(db, make_user, login_as):
    user = make_user("Priya Sharma", "priya.private@example.com")
    return user, login_as(user)


# ======================= rule-based GET: compatibility =======================
def test_get_is_rule_based_and_labelled(student, add_skill):
    user, c = student
    add_skill(user, "Python")
    r = c.get(GET_URL, params={"role_name": ROLE})
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "rule_based"
    assert body["missing_count"] == 6 and len(body["recommendations"]) == 5
    assert {"skill_name", "priority", "estimated_minutes", "reason", "suggested_activity"} <= set(body["recommendations"][0])
    assert "rule-based" in body["method_note"]


def test_get_unsupported_role_is_400(student):
    _, c = student
    assert c.get(GET_URL, params={"role_name": "Astronaut"}).status_code == 400


def test_get_requires_authentication(client, db):
    assert client.get(GET_URL, params={"role_name": ROLE}).status_code == 401


def test_get_ignores_other_students_skills(db, make_user, login_as, add_skill):
    alice, bob = make_user("Alice", "a@x.com"), make_user("Bob", "b@x.com")
    add_skill(bob, "Python")
    body = login_as(alice).get(GET_URL, params={"role_name": ROLE}).json()
    assert "Python" in [r["skill_name"] for r in body["recommendations"]]


# ======================= AI POST: success & grounding =======================
def test_ai_success(student, use_provider, add_skill):
    user, c = student
    add_skill(user, "Python", Proficiency.ADVANCED)
    provider = use_provider(FakeProvider(payload(
        rec("SQL", order=2, priority="Medium"),
        rec("Git", order=1, prerequisites=["Python", "Made Up Prereq", "git"], estimated_minutes=30),
    )))
    r = post(c)
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "ai" and body["model"] == settings.AI_MODEL
    assert [x["skill_name"] for x in body["recommendations"]] == ["Git", "SQL"]
    assert [x["order"] for x in body["recommendations"]] == [1, 2]
    # prerequisites: only role skills survive; self-reference and invented ones are dropped
    assert body["recommendations"][0]["prerequisites"] == ["Python"]
    assert body["readiness_score"] == round(1 / 7 * 100)
    assert len(provider.calls) == 1 and provider.calls[0]["schema"] is not None


def test_ai_does_not_change_readiness_or_write_to_database(student, use_provider, db, add_skill):
    user, c = student
    add_skill(user, "Python")
    before = c.get(GET_URL, params={"role_name": ROLE}).json()["readiness_score"]
    use_provider(FakeProvider(payload(rec("SQL"))))
    assert post(c).status_code == 200
    assert db.exec(select(StudyTask)).all() == []
    assert c.get(GET_URL, params={"role_name": ROLE}).json()["readiness_score"] == before


def test_prompt_is_grounded_in_role_skills_and_tasks(student, use_provider, add_skill, add_task):
    user, c = student
    add_skill(user, "Python", Proficiency.BEGINNER)
    add_task(user, "SQL", StudyTaskStatus.IN_PROGRESS, title="PRIVATE-TASK-TITLE")
    provider = use_provider(FakeProvider(payload(rec("Git"))))
    assert post(c).status_code == 200
    ctx = json.loads(provider.calls[0]["messages"][0].text)
    assert ctx["target_role"] == ROLE
    assert ctx["matched_skills"] == [{"skill": "Python", "self_reported_level": "Beginner"}]
    assert "Python" not in ctx["missing_skills"] and "Git" in ctx["missing_skills"]
    assert ctx["existing_tasks"] == [{"subject": "SQL", "status": "In Progress"}]
    assert ctx["already_planned_skills"] == ["SQL"]
    assert len(provider.calls[0]["messages"]) == 1
    assert provider.calls[0]["messages"][0].role == "user"
    # the server-side instructions pin the model to the supplied missing skills
    assert "missing_skills" in provider.calls[0]["system"]
    assert "Never add any other skill" in provider.calls[0]["system"]


def test_no_personal_information_or_task_titles_reach_the_model(student, use_provider, add_skill, add_task):
    user, c = student
    add_skill(user, "Python")
    add_task(user, "Git", title="PRIVATE-TASK-TITLE")
    provider = use_provider(FakeProvider(payload(rec("SQL"))))
    post(c)
    sent = provider.calls[0]["system"] + " ".join(m.text for m in provider.calls[0]["messages"])
    for private in ("Priya", "Sharma", "priya.private@example.com", "PRIVATE-TASK-TITLE"):
        assert private not in sent


def test_other_students_data_never_reaches_the_model(db, make_user, login_as, use_provider, add_skill, add_task):
    alice, bob = make_user("Alice", "a@x.com"), make_user("Bob", "b@x.com")
    add_skill(bob, "Git")
    add_task(bob, "BOB-ONLY-SUBJECT")
    add_skill(alice, "Python")
    provider = use_provider(FakeProvider(payload(rec("Git"))))
    assert post(login_as(alice)).status_code == 200
    sent = provider.calls[0]["messages"][0].text
    assert "BOB-ONLY-SUBJECT" not in sent
    ctx = json.loads(sent)
    assert "Git" in ctx["missing_skills"]  # Bob's Git skill is not Alice's


def test_alias_in_model_output_maps_to_canonical_missing_skill(db, make_user, login_as, use_provider):
    c = login_as(make_user("A", "a@x.com"))
    use_provider(FakeProvider(payload(rec("rest api"))))
    body = post(c).json()
    assert body["recommendations"][0]["skill_name"] == "REST APIs"


def test_already_planned_flag_is_computed_by_server(student, use_provider, add_task):
    user, c = student
    add_task(user, "sql", StudyTaskStatus.PENDING)                 # open -> planned
    add_task(user, "Git", StudyTaskStatus.COMPLETED)               # completed -> not planned
    use_provider(FakeProvider(payload(
        rec("SQL", 1, already_planned=False), rec("Git", 2, already_planned=True), rec("Testing", 3),
    )))
    flags = {r["skill_name"]: r["already_planned"] for r in post(c).json()["recommendations"]}
    assert flags == {"SQL": True, "Git": False, "Testing": False}


def test_task_context_is_bounded(student, use_provider, add_task):
    user, c = student
    for i in range(40):
        add_task(user, f"Subject-{i}")
    provider = use_provider(FakeProvider(payload(rec("SQL"))))
    post(c)
    assert len(json.loads(provider.calls[0]["messages"][0].text)["existing_tasks"]) == 30


def test_fully_matched_role_makes_no_ai_call_and_is_not_labelled_ai(student, use_provider, add_skill):
    user, c = student
    for s in ("Python", "Object-Oriented Programming", "REST APIs", "SQL", "Git", "Testing", "Debugging"):
        add_skill(user, s)
    provider = use_provider(FakeProvider(payload(rec("SQL"))))
    body = post(c).json()
    assert body["recommendations"] == [] and body["source"] == "rule_based" and body["model"] is None
    assert provider.calls == []


# ======================= AI POST: output validation =======================
@pytest.mark.parametrize("bad", [
    payload(rec("Quantum Basket Weaving")),                            # invented skill
    payload(rec("Python")),                                            # not missing (student has it)
    payload(rec("SQL", 1), rec("sql", 2)),                             # duplicate skill
    payload(rec("SQL", estimated_minutes=5)),                          # below bound
    payload(rec("SQL", estimated_minutes=999)),                        # above bound
    payload(rec("SQL", priority="Urgent")),                            # bad enum
    payload(rec("SQL", reason="")),                                    # empty text
    payload(rec("SQL", reason="x" * 401)),                             # oversize text
    payload(rec("SQL", order=0)),                                      # bad order
    payload(*[rec(s, i + 1) for i, s in enumerate(["SQL", "Git", "Testing", "Debugging", "REST APIs", "Object-Oriented Programming"])]),  # >5
    json.dumps({"recommendations": []}),                               # none
    json.dumps({"something": "else"}),                                 # wrong shape
    "not json at all",
    "",
])
def test_invalid_model_output_is_rejected_with_502(db, make_user, login_as, use_provider, add_skill, bad):
    user = make_user("A", "a@x.com")
    add_skill(user, "Python")
    use_provider(FakeProvider(bad))
    r = post(login_as(user))
    assert r.status_code == 502
    assert set(r.json()) == {"detail"}
    assert "Quantum" not in r.text


# ======================= AI POST: auth, input, limits =======================
def test_requires_authentication_and_makes_no_model_call(client, db, use_provider):
    provider = use_provider(FakeProvider(payload(rec("SQL"))))
    assert post(client).status_code == 401
    assert provider.calls == []


def test_unsupported_role_is_400_without_model_call(student, use_provider):
    _, c = student
    provider = use_provider(FakeProvider(payload(rec("SQL"))))
    assert post(c, "Astronaut").status_code == 400
    assert provider.calls == []


@pytest.mark.parametrize("body", [{}, {"role_name": ""}, {"role_name": "x" * 201}, {"role": ROLE}])
def test_invalid_request_body_is_422(student, use_provider, body):
    _, c = student
    provider = use_provider(FakeProvider(payload(rec("SQL"))))
    assert c.post(AI_URL, json=body).status_code == 422
    assert provider.calls == []


def test_ai_rate_limit_applies_but_get_is_not_limited(student, use_provider, monkeypatch):
    _, c = student
    monkeypatch.setattr(settings, "AI_RATE_LIMIT_PER_MINUTE", 1)
    provider = use_provider(FakeProvider(payload(rec("SQL"))))
    assert post(c).status_code == 200
    assert post(c).status_code == 429
    assert len(provider.calls) == 1
    for _ in range(3):
        assert c.get(GET_URL, params={"role_name": ROLE}).status_code == 200


def test_ai_not_configured_is_503(student, monkeypatch):
    from app.ai.service import get_ai_service
    _, c = student
    get_ai_service.cache_clear()
    monkeypatch.setattr(settings, "AI_API_KEY", "")
    r = post(c)
    assert r.status_code == 503 and "AI_API_KEY" not in r.text
    get_ai_service.cache_clear()


# ======================= AI POST: provider failures =======================
@pytest.mark.parametrize("exc,status", [
    (AITimeoutError(), 504),
    (AIProviderError("gemini api error code=503"), 502),
    (AIRateLimitError(), 429),
])
def test_provider_failures_are_safe_and_do_not_fall_back_silently(student, use_provider, db, exc, status):
    _, c = student
    use_provider(FakeProvider(exc))
    r = post(c)
    assert r.status_code == status
    assert set(r.json()) == {"detail"}
    assert "recommendations" not in r.text and "code=503" not in r.text
    assert db.exec(select(StudyTask)).all() == []


def test_unexpected_exception_returns_generic_500(student, use_provider):
    from fastapi.testclient import TestClient
    use_provider(FakeProvider(RuntimeError("Traceback api_key=SECRET-KEY")))
    r = TestClient(app, raise_server_exceptions=False).post(AI_URL, json={"role_name": ROLE})
    assert r.status_code == 500 and "SECRET-KEY" not in r.text


def test_logs_do_not_contain_student_data(student, use_provider, add_task, caplog):
    import logging
    user, c = student
    add_task(user, "PRIVATE-SUBJECT-XYZ")
    use_provider(FakeProvider(payload(rec("SQL", reason="PRIVATE-MODEL-OUTPUT"))))
    with caplog.at_level(logging.DEBUG):
        post(c)
    assert "PRIVATE-SUBJECT-XYZ" not in caplog.text
    assert "PRIVATE-MODEL-OUTPUT" not in caplog.text
    assert "priya.private@example.com" not in caplog.text
