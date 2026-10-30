"""Baseline tests for the existing study-task CRUD API (no code changed): CRUD,
validation, authentication and cross-student isolation."""
from app.models.study_task import StudyTaskStatus

URL = "/api/study-tasks"


def test_requires_authentication(client, db):
    assert client.get(URL).status_code == 401
    assert client.post(URL, json={"title": "t", "subject": "s"}).status_code == 401
    assert client.patch(f"{URL}/1", json={"status": "Completed"}).status_code == 401
    assert client.delete(f"{URL}/1").status_code == 401


def test_create_and_list_only_own_tasks(db, make_user, login_as, add_task):
    alice, bob = make_user("Alice", "a@x.com"), make_user("Bob", "b@x.com")
    add_task(bob, "Bob-Secret-Subject")
    c = login_as(alice)
    r = c.post(URL, json={"title": "  Learn SQL  ", "subject": " SQL ", "estimated_minutes": 45, "priority": "High"})
    assert r.status_code == 201
    body = r.json()
    assert body["title"] == "Learn SQL" and body["subject"] == "SQL" and body["status"] == "Pending"
    listed = c.get(URL).json()
    assert [t["subject"] for t in listed] == ["SQL"]
    assert "Bob-Secret-Subject" not in c.get(URL).text


def test_mark_complete(db, make_user, login_as, add_task):
    alice = make_user("Alice", "a@x.com")
    task = add_task(alice, "Python")
    r = login_as(alice).patch(f"{URL}/{task.id}", json={"status": "Completed"})
    assert r.status_code == 200 and r.json()["status"] == "Completed"
    assert r.json()["updated_at"] >= r.json()["created_at"]


def test_cannot_read_modify_or_delete_another_students_task(db, make_user, login_as, add_task):
    alice, bob = make_user("Alice", "a@x.com"), make_user("Bob", "b@x.com")
    bobs = add_task(bob, "Docker")
    c = login_as(alice)
    assert c.patch(f"{URL}/{bobs.id}", json={"status": "Completed"}).status_code == 404
    assert c.delete(f"{URL}/{bobs.id}").status_code == 404
    db.refresh(bobs)
    assert bobs.status == StudyTaskStatus.PENDING  # untouched
    assert login_as(bob).delete(f"{URL}/{bobs.id}").status_code == 204


def test_missing_task_is_404(db, make_user, login_as):
    c = login_as(make_user("Alice", "a@x.com"))
    assert c.patch(f"{URL}/999", json={"status": "Completed"}).status_code == 404


def test_validation(db, make_user, login_as):
    c = login_as(make_user("Alice", "a@x.com"))
    assert c.post(URL, json={"title": "   ", "subject": "s"}).status_code == 422
    assert c.post(URL, json={"title": "t", "subject": "  "}).status_code == 422
    assert c.post(URL, json={"title": "t", "subject": "s", "estimated_minutes": 1}).status_code == 422
    assert c.post(URL, json={"title": "t", "subject": "s", "estimated_minutes": 9999}).status_code == 422
    assert c.post(URL, json={"title": "t", "subject": "s", "priority": "Urgent"}).status_code == 422
    assert c.post(URL, json={"title": "t"}).status_code == 422


def test_patch_rejects_blank_title_and_bad_status(db, make_user, login_as, add_task):
    alice = make_user("Alice", "a@x.com")
    task = add_task(alice, "Git")
    c = login_as(alice)
    assert c.patch(f"{URL}/{task.id}", json={"title": "  "}).status_code == 422
    assert c.patch(f"{URL}/{task.id}", json={"status": "Done"}).status_code == 422
