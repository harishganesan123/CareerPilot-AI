# CareerPilot AI

**CareerPilot AI — An Intelligent Academic and Career Development Platform for Students**

## Description

CareerPilot AI is a full-stack, AI-powered web application built as a B.Tech
Artificial Intelligence minor project. It is designed to help students manage
their academic learning and career preparation from a single platform.

## Objectives

CareerPilot AI aims to help students:

- Manage their academic learning
- Interact with their study materials using AI
- Create personalized study plans
- Analyze resumes
- Analyze job descriptions
- Identify skill gaps
- Receive career recommendations
- Prepare for placements and interviews
- Track their overall career readiness

## Technology Stack

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Axios
- Lucide React

**Backend**
- Python 3.12
- FastAPI
- Pydantic / Pydantic Settings
- SQLModel
- Uvicorn

**Database**
- PostgreSQL (compatible with local PostgreSQL and Neon PostgreSQL)

**AI**
- Provider-agnostic AI service layer (configured via environment variables;
  no hard-coded keys). Implemented from Phase 3 onward.

**Auth**
- JWT-based authentication with password hashing (implemented from Phase 2
  onward — Phase 1 ships the UI shell only).

## Current Implementation Status

### Phase 1 — Foundation (complete)

- [x] Frontend scaffolded with Vite + React + TypeScript
- [x] Tailwind CSS, React Router, Axios, and Lucide React configured
- [x] FastAPI backend with configuration management, CORS, and a database
      connection layer (SQLModel)
- [x] `GET /api/health` endpoint
- [x] `.env.example` files (root, frontend, backend) with placeholders only

### Phase 2 — Authentication + User Profile (complete)

- [x] User model extended with `phone`, `bio`, `career_goal`, `updated_at`
- [x] Argon2 password hashing (`pwdlib`) — no plaintext passwords stored
- [x] JWT-based authentication (`python-jose`), with `JWT_SECRET` read from
      the environment
- [x] `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- [x] `GET /api/users/me`, `PATCH /api/users/me` (protected-field stripping
      via schema, not by trusting the client)
- [x] Reusable `get_current_user` FastAPI dependency for protected routes
- [x] Alembic migrations for schema changes (`backend/alembic/`) — schema is
      no longer created via `create_all()` on startup
- [x] Global exception handler — no raw stack traces reach the client
- [x] Frontend `AuthProvider` / `useAuth()` context, session restore on
      page refresh via stored JWT
- [x] `ProtectedRoute` wrapper guarding `/dashboard` and `/profile`
- [x] Fully wired Login and Register pages (show/hide password, client-side
      validation, loading states, backend error display)
- [x] Dashboard shows `Welcome back, {user.name}` and a profile summary
- [x] `/profile` page — view and edit programme, university, semester,
      career goal, bio (email kept immutable for this phase)
- [x] Logout clears the client-side session (JWTs are stateless; see the
      Authentication Notes section below)

Authentication, AI services, RAG pipelines, and the remaining feature set
(study planner, resume analysis, skill gap analysis, career recommendations,
placement prep) beyond profile management are intentionally out of scope for
Phase 2 and will be built in subsequent phases.

### Phase 3 — Student Dashboard + Career Profile + Skills Foundation (complete)

- [x] New models: `StudentSkill`, `StudentProject`, `Certification`, `TargetRole`,
      all owned by a user with `ON DELETE CASCADE` (no orphaned records)
- [x] Additive Alembic migration — the existing `users` table and its data were
      left untouched
- [x] Full CRUD APIs for skills, projects, certifications and career goals
- [x] Consolidated `GET /api/dashboard` returning user, profile completion,
      all four collections, real counts, and recent activity
- [x] Deterministic profile-completion score (9 weighted factors totalling 100)
      with a per-factor breakdown so the UI can show what's still missing
- [x] Recent activity derived from real record timestamps — no activity table,
      nothing fabricated
- [x] Ownership enforced in one shared helper; cross-user access returns 404
- [x] Student dashboard with stat cards, completion bar, skill bars, target
      career, AI module cards, placement-readiness placeholder, activity feed
- [x] Skills, Projects, Certifications, Career Goals and improved Profile pages,
      each with loading, empty, error and validation states
- [x] Toast notifications (no browser `alert()`), confirm-before-delete
- [x] Responsive layout with collapsing sidebar; "Coming Soon" pages for the
      eight not-yet-built modules
- [x] TypeScript interfaces for every entity; no `any`

Note on skill proficiency: the 25/50/75/100 bar values are a deterministic
rendering of the student's own self-reported level. They are not an objective
measurement of ability.

Note on placement readiness: no score is generated in this phase. The card
states that there isn't enough data yet rather than showing an invented number.

AI functionality (RAG, chatbot, resume analysis, skill-gap analysis, career
recommendations, study planner, interview generation, placement scoring) is
deliberately out of scope for Phase 3 and will be built in later phases on top
of this data foundation.

## AI Foundation (backend)

CareerPilot AI calls a hosted LLM (Google Gemini via the official `google-genai`
SDK). **The application does not train its own model.**

- `app/ai/service.py` — `AIService`: size limits, output caps, Pydantic validation
  of structured output, metadata-only logging (prompts/resumes are never logged).
- `app/ai/gemini_provider.py` — the only module that imports the SDK; converts
  SDK failures into typed errors (`app/ai/errors.py`) mapped to safe HTTP responses.
- `app/ai/rate_limit.py` — per-user sliding window (in-memory, per process).
- `GET /api/ai/status` — is AI configured? (auth required; never returns the key)
- `POST /api/ai/ping` — one real, minimal structured model call to verify setup.

Provider choice is documented in the Phase 1 report; the provider sits behind the
`AIProvider` interface so it can be swapped without touching feature code.

Run the automated tests (the provider is mocked, so no API credits are used):

```bash
cd backend && pip install -r requirements-dev.txt && python -m pytest
```

`tests/test_phase3_api.py` is a separate live-server script
(`python tests/test_phase3_api.py` with uvicorn running).

## AI Learning Assistant (Phase 2)

A chat page at `/ai/assistant` (sidebar: **AI Academic Assistant**, login required)
where students ask about programming, AI/ML, data science and career preparation.
Answers come from real Gemini inference through the backend; the browser never
talks to the AI provider and never sees the key.

- **Endpoint:** `POST /api/ai/chat` — body `{ "message": str (1–2000 chars), "conversation_history": [{ "role": "user" | "assistant", "content": str }] }`
  (max 20 turns, 4000 chars per turn, 12000 chars in total). Returns `{ answer, model, source, latency_ms, note }`.
- **Environment variables (names only):** `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`,
  `AI_TIMEOUT_SECONDS`, `AI_MAX_OUTPUT_TOKENS`, `AI_MAX_INPUT_CHARS`, `AI_RATE_LIMIT_PER_MINUTE`
  (backend `.env` only; see `.env.example`).
- **Stateless by design:** the client sends the recent history with each question;
  nothing is stored, and the assistant only knows the turns in that request.
- **General knowledge only:** answers are not grounded in uploaded materials yet
  (the response's `source` is `general_knowledge`). Document-based answers arrive with RAG.
- **Rendering:** a small built-in parser turns model output into React text nodes
  (paragraphs, lists, code blocks, inline code/bold). No HTML from the model is ever rendered.

**Limitations.** The server-side system prompt tells the model to treat the student's
message and history as untrusted, but this does not make prompt injection impossible.
The model has no tools and no database access, so the worst case is a misleading answer
to that student, not an action on the system. History is client-supplied, so a user can
forge earlier turns in their *own* conversation. The rate limit (shared with
`/ai/ping`, counting invalid requests too) is in-memory and per server process.

**Run it.**

```bash
# backend (from backend/, with a Gemini key set as AI_API_KEY in backend/.env)
uvicorn app.main:app --reload --port 8000
# frontend (from frontend/)
npm run dev
```

**Test it.** Automated tests never call Gemini:

```bash
cd backend && python -m pytest        # AI provider is faked
cd frontend && npm test               # needs Node 22.6+; tests history bounding + the Markdown parser
cd frontend && npm run build && npm run lint
```

Live inference is verified manually: log in, open `/ai/assistant`, ask a question and
a follow-up. (`POST /api/ai/ping` is a quicker backend-only check.)

## Project Structure

```
CareerPilot-AI/
├── frontend/                 # React + TypeScript + Vite app
│   └── src/
│       ├── api/               # Axios client + typed API calls
│       ├── components/        # Reusable UI components
│       ├── pages/              # Route-level pages
│       └── routes/            # Route definitions
│
├── backend/
│   └── app/
│       ├── api/                # FastAPI routers
│       ├── core/               # Config + database
│       ├── models/             # SQLModel table models
│       ├── schemas/            # Pydantic request/response schemas
│       ├── services/           # Business logic (future phases)
│       ├── ai/                 # AI provider service layer (future phases)
│       ├── rag/                # RAG pipeline (future phases)
│       ├── utils/              # Shared utilities
│       └── main.py             # FastAPI application entry point
│
├── .env.example
├── .gitignore
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (local instance, or a Neon PostgreSQL connection string)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set DATABASE_URL, JWT_SECRET, AI_API_KEY (Gemini key), AI_MODEL

# Apply database migrations (creates/updates the users table)
alembic upgrade head

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify it's running:

```bash
curl http://localhost:8000/api/health
```

To create a new migration after changing a model:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

### Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Edit .env if your backend runs on a different URL

npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Configuration

| Variable | Location | Description |
|---|---|---|
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string (local or Neon) |
| `JWT_SECRET` | `backend/.env` | Secret used to sign JWTs (Phase 2+) |
| `AI_API_KEY` | `backend/.env` | API key for the configured AI provider (Phase 3+) |
| `AI_MODEL` | `backend/.env` | Model identifier for the configured AI provider |
| `VITE_API_BASE_URL` | `frontend/.env` | Base URL the frontend uses to reach the backend API |

No real secrets are committed to this repository — only `.env.example` files
with placeholders are tracked.

## Authentication Notes

This phase uses stateless JWT access tokens (no refresh tokens, no
server-side session store), which keeps the architecture simple and
appropriate for a university project — with one honest tradeoff worth
noting:

- **Logout** removes the token from the browser's `localStorage`. That
  stops the browser from *sending* the token, but the token itself remains
  cryptographically valid until it expires
  (`ACCESS_TOKEN_EXPIRE_MINUTES`, default 24h). A real production system
  wanting immediate server-side revocation would need a token deny-list or
  short-lived access tokens paired with rotating refresh tokens — out of
  scope here by design (see Phase 2 spec, section 5).
- Passwords are hashed with **Argon2** (via `pwdlib`), never stored or
  logged in plaintext.
- `PATCH /api/users/me` only accepts fields explicitly defined on
  `UserUpdateRequest` — `id`, `email`, `password_hash`, `created_at`, and
  `updated_at` are not exposed on that schema, so they can't be modified
  through this endpoint regardless of what a client sends.
