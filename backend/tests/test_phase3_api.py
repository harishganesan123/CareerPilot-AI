"""
Phase 3 backend API tests.

Covers CRUD for skills, projects, certifications and career goals, the
consolidated dashboard endpoint, and — critically — cross-user isolation.
"""
import random
import sys

import requests

BASE = "http://localhost:8000/api"
results = []


def check(label, condition, extra=""):
    status = "PASS" if condition else "FAIL"
    results.append((label, status))
    print(f"[{status}] {label}" + (f"  -> {extra}" if extra and not condition else ""))


def make_user(tag):
    rand = random.randint(100000, 999999)
    email = f"p3_{tag}_{rand}@example.com"
    resp = requests.post(
        f"{BASE}/auth/register",
        json={
            "name": f"Phase3 {tag}",
            "email": email,
            "password": "TestPass123",
            "programme": "B.Tech Artificial Intelligence",
            "university": "Example University",
            "semester": 7,
        },
    )
    resp.raise_for_status()
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, email


def main():
    user_a, _ = make_user("a")
    user_b, _ = make_user("b")

    # ---------------- SKILLS ----------------
    r = requests.post(
        f"{BASE}/skills",
        headers=user_a,
        json={"skill_name": "Python", "category": "Programming", "proficiency": "Advanced"},
    )
    check("Create skill", r.status_code == 201, r.text)
    skill = r.json()
    check("Skill proficiency_percent mapped deterministically", skill["proficiency_percent"] == 75, skill)
    skill_id = skill["id"]

    for name, cat, prof in [
        ("Machine Learning", "AI/ML", "Intermediate"),
        ("SQL", "Database", "Intermediate"),
    ]:
        requests.post(
            f"{BASE}/skills",
            headers=user_a,
            json={"skill_name": name, "category": cat, "proficiency": prof},
        )

    r = requests.get(f"{BASE}/skills", headers=user_a)
    check("List skills returns all 3", r.status_code == 200 and len(r.json()) == 3, r.text)

    r = requests.patch(
        f"{BASE}/skills/{skill_id}", headers=user_a, json={"proficiency": "Expert"}
    )
    check(
        "Update skill",
        r.status_code == 200 and r.json()["proficiency"] == "Expert"
        and r.json()["proficiency_percent"] == 100,
        r.text,
    )

    # ---------------- PROJECTS ----------------
    r = requests.post(
        f"{BASE}/projects",
        headers=user_a,
        json={
            "title": "CareerPilot AI",
            "description": "An academic and career platform.",
            "technologies": ["React", "FastAPI", "PostgreSQL"],
            "project_type": "Academic",
            "role": "Full-stack developer",
            "github_url": "https://github.com/example/careerpilot",
            "start_date": "2026-01-15",
        },
    )
    check("Create project", r.status_code == 201, r.text)
    project = r.json()
    check(
        "Project technologies round-trip as a list",
        project["technologies"] == ["React", "FastAPI", "PostgreSQL"],
        project,
    )
    project_id = project["id"]

    r = requests.get(f"{BASE}/projects", headers=user_a)
    check("List projects", r.status_code == 200 and len(r.json()) == 1, r.text)

    r = requests.patch(
        f"{BASE}/projects/{project_id}",
        headers=user_a,
        json={"technologies": ["React", "FastAPI", "PostgreSQL", "Alembic"]},
    )
    check(
        "Update project technologies",
        r.status_code == 200 and len(r.json()["technologies"]) == 4,
        r.text,
    )

    # ---------------- CERTIFICATIONS ----------------
    r = requests.post(
        f"{BASE}/certifications",
        headers=user_a,
        json={
            "name": "Deep Learning Specialization",
            "issuing_organization": "Coursera",
            "issue_date": "2025-11-02",
            "credential_url": "https://example.com/cred/123",
        },
    )
    check("Create certification", r.status_code == 201, r.text)
    cert_id = r.json()["id"]

    r = requests.get(f"{BASE}/certifications", headers=user_a)
    check("List certifications", r.status_code == 200 and len(r.json()) == 1, r.text)

    r = requests.patch(
        f"{BASE}/certifications/{cert_id}",
        headers=user_a,
        json={"issuing_organization": "DeepLearning.AI"},
    )
    check(
        "Update certification",
        r.status_code == 200 and r.json()["issuing_organization"] == "DeepLearning.AI",
        r.text,
    )

    # ---------------- CAREER GOALS ----------------
    r = requests.post(
        f"{BASE}/career-goals",
        headers=user_a,
        json={
            "role_name": "Generative AI Engineer",
            "priority": "Primary",
            "target_date": "2027-06-01",
        },
    )
    check("Create career goal", r.status_code == 201, r.text)
    goal_id = r.json()["id"]

    requests.post(
        f"{BASE}/career-goals",
        headers=user_a,
        json={"role_name": "Data Scientist", "priority": "Secondary"},
    )

    r = requests.get(f"{BASE}/career-goals", headers=user_a)
    check("List career goals", r.status_code == 200 and len(r.json()) == 2, r.text)

    r = requests.patch(
        f"{BASE}/career-goals/{goal_id}", headers=user_a, json={"role_name": "GenAI Engineer"}
    )
    check(
        "Update career goal",
        r.status_code == 200 and r.json()["role_name"] == "GenAI Engineer",
        r.text,
    )

    # ---------------- DASHBOARD ----------------
    r = requests.get(f"{BASE}/dashboard", headers=user_a)
    check("Dashboard returns 200", r.status_code == 200, r.text)
    dash = r.json()
    stats = dash["stats"]
    check(
        "Dashboard stats computed from real records",
        stats["skills_count"] == 3
        and stats["projects_count"] == 1
        and stats["certifications_count"] == 1
        and stats["target_roles_count"] == 2,
        stats,
    )
    check(
        "Dashboard profile completion is 100 for fully-populated profile "
        "(bio still missing -> expect 90)",
        dash["profile_completion"]["percent"] == 90,
        dash["profile_completion"]["percent"],
    )
    check(
        "Dashboard recent activity derived from real records",
        len(dash["recent_activity"]) == 7,
        len(dash["recent_activity"]),
    )
    check(
        "Dashboard completion factors are explainable",
        any(f["key"] == "bio" and f["complete"] is False for f in dash["profile_completion"]["factors"]),
        dash["profile_completion"]["factors"],
    )

    # ---------------- USER ISOLATION ----------------
    r = requests.get(f"{BASE}/skills", headers=user_b)
    check("User B sees none of User A's skills", r.status_code == 200 and r.json() == [], r.text)

    r = requests.get(f"{BASE}/dashboard", headers=user_b)
    check(
        "User B dashboard stats are all zero",
        r.status_code == 200 and r.json()["stats"]["skills_count"] == 0,
        r.text,
    )

    for label, method, path in [
        ("skill", "patch", f"/skills/{skill_id}"),
        ("project", "patch", f"/projects/{project_id}"),
        ("certification", "patch", f"/certifications/{cert_id}"),
        ("career goal", "patch", f"/career-goals/{goal_id}"),
    ]:
        r = getattr(requests, method)(f"{BASE}{path}", headers=user_b, json={})
        check(f"User B cannot update User A's {label} (404)", r.status_code == 404, r.status_code)

    for label, path in [
        ("skill", f"/skills/{skill_id}"),
        ("project", f"/projects/{project_id}"),
        ("certification", f"/certifications/{cert_id}"),
        ("career goal", f"/career-goals/{goal_id}"),
    ]:
        r = requests.delete(f"{BASE}{path}", headers=user_b)
        check(f"User B cannot delete User A's {label} (404)", r.status_code == 404, r.status_code)

    # Unauthenticated access
    for path in ["/skills", "/projects", "/certifications", "/career-goals", "/dashboard"]:
        r = requests.get(f"{BASE}{path}")
        check(f"Unauthenticated GET {path} rejected", r.status_code == 401, r.status_code)

    # ---------------- DELETION (owner) ----------------
    r = requests.delete(f"{BASE}/skills/{skill_id}", headers=user_a)
    check("Owner can delete skill", r.status_code == 204, r.status_code)
    r = requests.get(f"{BASE}/skills", headers=user_a)
    check("Skill list reflects deletion", len(r.json()) == 2, r.text)

    r = requests.delete(f"{BASE}/projects/{project_id}", headers=user_a)
    check("Owner can delete project", r.status_code == 204, r.status_code)
    r = requests.delete(f"{BASE}/certifications/{cert_id}", headers=user_a)
    check("Owner can delete certification", r.status_code == 204, r.status_code)
    r = requests.delete(f"{BASE}/career-goals/{goal_id}", headers=user_a)
    check("Owner can delete career goal", r.status_code == 204, r.status_code)

    r = requests.get(f"{BASE}/dashboard", headers=user_a)
    check(
        "Dashboard stats update after deletions",
        r.json()["stats"] == {
            "skills_count": 2,
            "projects_count": 0,
            "certifications_count": 0,
            "target_roles_count": 1,
        },
        r.json()["stats"],
    )

    # ---------------- VALIDATION ----------------
    r = requests.post(f"{BASE}/skills", headers=user_a, json={"skill_name": ""})
    check("Empty skill name rejected", r.status_code == 422, r.status_code)
    r = requests.post(
        f"{BASE}/skills",
        headers=user_a,
        json={"skill_name": "X", "proficiency": "Godlike"},
    )
    check("Invalid proficiency rejected", r.status_code == 422, r.status_code)

    print("\n=== SUMMARY ===")
    failed = [r for r in results if r[1] == "FAIL"]
    print(f"{len(results) - len(failed)}/{len(results)} passed")
    for label, status in failed:
        print(f"  FAILED: {label}")
    if failed:
        sys.exit(1)


main()
