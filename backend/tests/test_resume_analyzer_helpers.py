from app.services.resume_analyzer_service import (
    calculate_ats_score,
    detect_sections,
    extract_resume_text,
    redact_contact_details,
)


def test_extract_txt_resume():
    raw = (
        b"John Doe\njohn@example.com\nProfessional Summary\nPython developer\n"
        b"Education\nUniversity\nSkills\nPython SQL\nProjects\nBuilt a data dashboard"
    )
    text = extract_resume_text("resume.txt", raw)
    assert "Python developer" in text
    assert "Education" in text


def test_reject_unsupported_extension():
    try:
        extract_resume_text("resume.exe", b"some resume text" * 20)
    except ValueError as exc:
        assert "PDF, DOCX, or TXT" in str(exc)
    else:
        raise AssertionError("Expected ValueError")


def test_redacts_email_phone_and_urls():
    text = redact_contact_details("mail me@example.com or +1 555 222 3333 https://example.com")
    assert "me@example.com" not in text
    assert "https://example.com" not in text
    assert "[EMAIL REDACTED]" in text


def test_score_is_bounded_and_breakdown_sums():
    text = "Summary Python SQL Education Projects Skills Developed a dashboard with 30 users"
    score, breakdown = calculate_ats_score(text, "Data Analyst")
    assert 0 <= score <= 100
    assert score == sum(breakdown.values())
    assert "Education" in detect_sections(text)
