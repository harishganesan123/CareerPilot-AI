import asyncio
import random
import sys
from playwright.async_api import async_playwright

BASE = "http://localhost:5173"
results = []


def check(label, condition, extra=""):
    status = "PASS" if condition else "FAIL"
    results.append((label, status))
    print(f"[{status}] {label}" + (f"  -> {extra}" if extra and not condition else ""))


async def main():
    rand = random.randint(100000, 999999)
    email = f"p3e2e_{rand}@example.com"
    password = "TestPass123"
    name = "Phase3 Student"

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await context.new_page()

        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(m.text) if m.type == "error" else None,
        )

        # --- Register (Phase 2 regression) ---
        await page.goto(f"{BASE}/register")
        await page.fill("#name", name)
        await page.fill("#email", email)
        await page.fill("#programme", "B.Tech Artificial Intelligence")
        await page.fill("#semester", "7")
        await page.fill("#university", "Example University")
        await page.fill("#password", password)
        await page.fill("#confirmPassword", password)
        await page.click("button[type=submit]")
        await page.wait_for_url(f"{BASE}/dashboard", timeout=10000)
        check("Register -> dashboard", True)

        # --- Dashboard empty states ---
        await page.wait_for_selector("text=Profile Completion", timeout=8000)
        body = await page.inner_text("body")
        check("Dashboard greets user by name", f"Welcome back, {name}" in body, body[:200])
        check("Dashboard shows empty skills state", "No skills added yet." in body)
        check("Dashboard shows no primary goal state", "No primary career goal set yet." in body)
        check(
            "Placement readiness shows no fake score",
            "Not enough data yet." in body,
        )
        check(
            "Recent activity empty state",
            "No activity yet." in body,
        )
        check("AI module cards rendered", "AI Academic Assistant" in body and "Open Assistant" in body)

        # Profile completion should be 40% (name+programme+university+semester)
        check(
            "Profile completion computed from real data (40%)",
            "40%" in body,
            [line for line in body.split("\n") if "%" in line],
        )

        # --- Skills CRUD ---
        await page.goto(f"{BASE}/skills")
        await page.wait_for_selector("text=No skills added yet", timeout=8000)
        check("Skills page empty state", True)

        async def add_skill(skill, category, prof):
            # Use whichever add button is visible (empty-state or header)
            btn = page.locator("button", has_text="Add Skill").first
            await btn.click()
            await page.wait_for_selector("#skillName", timeout=5000)
            await page.fill("#skillName", skill)
            await page.select_option("#skillCategory", category)
            await page.select_option("#skillProficiency", prof)
            await page.click("button[type=submit]")
            await page.wait_for_selector(f"text={skill}", timeout=6000)

        await add_skill("Python", "Programming", "Advanced")
        check("Add skill (Python)", True)
        await add_skill("Machine Learning", "AI/ML", "Intermediate")
        await add_skill("SQL", "Database", "Intermediate")
        body = await page.inner_text("body")
        check(
            "Three skills listed",
            all(s in body for s in ["Python", "Machine Learning", "SQL"]),
            body[:300],
        )

        # Edit skill
        await page.click('button[aria-label="Edit Python"]')
        await page.wait_for_selector("#skillProficiency", timeout=5000)
        await page.select_option("#skillProficiency", "Expert")
        await page.click("button[type=submit]")
        await page.wait_for_selector("text=Skill updated.", timeout=6000)
        check("Edit skill shows success toast", True)
        await page.wait_for_timeout(500)
        body = await page.inner_text("body")
        check("Edited skill shows Expert", "Expert" in body)

        # --- Projects ---
        await page.goto(f"{BASE}/projects")
        await page.wait_for_selector("text=No projects added yet", timeout=8000)
        check("Projects page empty state", True)
        await page.locator("button", has_text="Add Project").first.click()
        await page.wait_for_selector("#projectTitle", timeout=5000)
        await page.fill("#projectTitle", "CareerPilot AI")
        await page.fill("#projectDesc", "An academic and career platform.")
        await page.fill("#projectTech", "React, FastAPI, PostgreSQL")
        await page.select_option("#projectType", "Academic")
        await page.fill("#projectRole", "Full-stack developer")
        await page.click("button[type=submit]")
        await page.wait_for_selector("text=Project added.", timeout=6000)
        await page.wait_for_timeout(400)
        body = await page.inner_text("body")
        check(
            "Add project with technologies",
            "CareerPilot AI" in body and "FastAPI" in body,
            body[:300],
        )

        # Project date validation
        await page.locator("button", has_text="Add Project").first.click()
        await page.wait_for_selector("#projectTitle", timeout=5000)
        await page.fill("#projectTitle", "Bad Dates")
        await page.fill("#projectStart", "2026-06-01")
        await page.fill("#projectEnd", "2026-01-01")
        await page.click("button[type=submit]")
        await page.wait_for_timeout(600)
        body = await page.inner_text("body")
        check(
            "End-before-start date validation fires",
            "End date cannot be before the start date." in body,
        )
        await page.locator('button:has-text("Cancel")').first.click()
        await page.wait_for_timeout(300)

        # --- Certifications ---
        await page.goto(f"{BASE}/certifications")
        await page.wait_for_selector("text=No certifications added yet", timeout=8000)
        check("Certifications page empty state", True)
        await page.locator("button", has_text="Add Certification").first.click()
        await page.wait_for_selector("#certName", timeout=5000)
        await page.fill("#certName", "Deep Learning Specialization")
        await page.fill("#certOrg", "DeepLearning.AI")
        await page.fill("#certDate", "2025-11-02")
        await page.click("button[type=submit]")
        await page.wait_for_selector("text=Certification added.", timeout=6000)
        await page.wait_for_timeout(400)
        body = await page.inner_text("body")
        check("Add certification", "Deep Learning Specialization" in body, body[:300])

        # --- Career goals ---
        await page.goto(f"{BASE}/career-goals")
        await page.wait_for_selector("text=No career goals set yet", timeout=8000)
        check("Career goals page empty state", True)
        await page.locator("button", has_text="Add Target Role").first.click()
        await page.wait_for_selector("#goalRole", timeout=5000)
        await page.fill("#goalRole", "Generative AI Engineer")
        await page.select_option("#goalPriority", "Primary")
        await page.click("button[type=submit]")
        await page.wait_for_selector("text=Career goal added.", timeout=6000)

        await page.locator("button", has_text="Add Target Role").first.click()
        await page.wait_for_selector("#goalRole", timeout=5000)
        await page.fill("#goalRole", "Data Scientist")
        await page.select_option("#goalPriority", "Secondary")
        await page.click("button[type=submit]")
        await page.wait_for_timeout(800)
        body = await page.inner_text("body")
        check(
            "Primary and secondary goals grouped",
            "Generative AI Engineer" in body and "Data Scientist" in body
            # Section headings render uppercase via CSS, so compare case-insensitively.
            and "PRIMARY" in body.upper() and "SECONDARY" in body.upper(),
            body[:400],
        )

        # --- Dashboard reflects real data ---
        await page.goto(f"{BASE}/dashboard")
        await page.wait_for_selector("text=Skills Overview", timeout=8000)
        await page.wait_for_timeout(600)
        body = await page.inner_text("body")
        check("Dashboard target career shows primary role", "Generative AI Engineer" in body)
        check("Dashboard skills overview populated", "Python" in body and "SQL" in body)
        check(
            "Dashboard activity derived from real records",
            "Added Python to skills" in body
            and "Added project: CareerPilot AI" in body
            and "Added career goal: Generative AI Engineer" in body,
            body[:600],
        )
        check(
            "Profile completion rose to 90% (bio still missing)",
            "90%" in body,
            [l for l in body.split("\n") if "%" in l],
        )
        check(
            "Completion shows remaining factor",
            "Write a short bio" in body,
        )

        # --- Profile update -> 100% ---
        await page.goto(f"{BASE}/profile")
        await page.wait_for_selector("#bio", timeout=8000)
        body = await page.inner_text("body")
        check(
            "Profile page lists target roles",
            "Generative AI Engineer" in body and "Data Scientist" in body,
        )
        await page.fill("#bio", "Final-year AI student focused on applied ML.")
        await page.click('button[type="submit"]')
        await page.wait_for_selector("text=Profile updated successfully.", timeout=6000)
        check("Profile update success toast", True)

        await page.goto(f"{BASE}/dashboard")
        await page.wait_for_selector("text=Profile Completion", timeout=8000)
        await page.wait_for_timeout(600)
        body = await page.inner_text("body")
        check("Profile completion reaches 100%", "100%" in body,
              [l for l in body.split("\n") if "%" in l])

        # --- Persistence across refresh ---
        await page.reload()
        await page.wait_for_selector("text=Skills Overview", timeout=8000)
        await page.wait_for_timeout(600)
        body = await page.inner_text("body")
        check(
            "Data persists after refresh",
            "Python" in body and "Generative AI Engineer" in body and "100%" in body,
        )

        # --- Coming soon route ---
        await page.goto(f"{BASE}/ai/resume-analyzer")
        await page.wait_for_selector("text=Coming soon", timeout=8000)
        check("Unimplemented module shows Coming Soon, not a broken route", True)

        # --- Delete with confirmation ---
        await page.goto(f"{BASE}/skills")
        await page.wait_for_selector('button[aria-label="Delete SQL"]', timeout=8000)
        await page.click('button[aria-label="Delete SQL"]')
        await page.wait_for_selector("text=This can't be undone.", timeout=5000)
        check("Delete asks for confirmation", True)
        await page.locator('button:has-text("Delete")').last.click()
        await page.wait_for_selector("text=Skill deleted.", timeout=6000)
        await page.wait_for_timeout(500)
        body = await page.inner_text("body")
        check("Skill removed after delete", "SQL" not in body, body[:300])

        # --- Mobile responsive ---
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.goto(f"{BASE}/dashboard")
        await page.wait_for_selector("text=Profile Completion", timeout=8000)
        menu = page.locator('button[aria-label="Open navigation"]')
        check("Mobile shows hamburger menu", await menu.is_visible())
        await menu.click()
        await page.wait_for_timeout(400)
        check(
            "Mobile sidebar opens",
            await page.locator('button[aria-label="Close navigation"]').last.is_visible(),
        )
        scroll_w = await page.evaluate("document.body.scrollWidth")
        check("No horizontal overflow on mobile", scroll_w <= 400, scroll_w)
        await page.set_viewport_size({"width": 1280, "height": 900})

        # --- Logout ---
        await page.goto(f"{BASE}/dashboard")
        await page.wait_for_selector("text=Profile Completion", timeout=8000)
        await page.locator('button:has-text("Logout")').first.click()
        await page.wait_for_url(f"{BASE}/login", timeout=6000)
        check("Logout redirects to login", True)
        await page.goto(f"{BASE}/skills")
        await page.wait_for_url(f"{BASE}/login", timeout=6000)
        check("Protected /skills blocked after logout", True)

        real_errors = [e for e in console_errors if "Failed to load resource" not in e]
        if real_errors:
            print("\nConsole errors:", real_errors)
        check("No unexpected console errors", len(real_errors) == 0, real_errors)

        await browser.close()

    print("\n=== SUMMARY ===")
    failed = [r for r in results if r[1] == "FAIL"]
    print(f"{len(results) - len(failed)}/{len(results)} passed")
    for label, status in failed:
        print(f"  FAILED: {label}")
    if failed:
        sys.exit(1)


asyncio.run(main())
