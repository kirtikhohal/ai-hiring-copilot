# High-Level Design (HLD) — Hazel, AI Hiring Copilot

## 1. Overview

Hazel is a two-tier web application with an AI layer:

- **Frontend** — a React single-page app (SPA).
- **Backend** — a FastAPI service exposing a REST API under `/api/v1`.
- **Database** — Supabase (managed PostgreSQL), accessed only by the backend.
- **AI** — Google Gemini, called only by the backend.
- **Email** — SMTP or an HTTP email provider (Brevo/SendGrid), called by the backend.

The frontend never talks to the database, Gemini, or email providers directly — all of
that goes through the backend, which holds the secrets.

## 2. Architecture diagram

```
        ┌──────────────────────────┐
        │        Browser (SPA)     │
        │  React + Vite + Tailwind │
        └─────────────┬────────────┘
                      │  HTTPS (JSON, Bearer JWT)
                      ▼
        ┌──────────────────────────┐
        │   Backend — FastAPI       │
        │   /api/v1 routers         │
        │   auth, projects, jd,     │
        │   resumes, candidates,    │
        │   interview, email,       │
        │   contact, stats          │
        └───┬─────────┬─────────┬───┘
            │         │         │
   (SQL/HTTP)│  (HTTPS)│  (SMTP/HTTPS)
            ▼         ▼         ▼
    ┌────────────┐ ┌────────┐ ┌──────────────┐
    │  Supabase  │ │ Gemini │ │ Email provider│
    │ PostgreSQL │ │  API   │ │ SMTP/Brevo/SG │
    └────────────┘ └────────┘ └──────────────┘
```

## 3. Components

### 3.1 Frontend (`frontend/`)
- **Routing** (`router.jsx`) — public auth routes (register/login/forgot/reset) and a
  protected app shell (dashboard, clients, internal, openings, candidates, etc.).
- **API layer** (`lib/api.js`) — a single `request()` wrapper that attaches the JWT
  (`Authorization: Bearer`) from `localStorage` and centralises error handling.
- **Auth context** (`lib/auth.jsx`) — validates the stored token on load, exposes the
  current user, and maps backend snake_case ↔ frontend camelCase.
- **Shell** — dark **Sidebar** (collapsible, per-project nav), 3-zone **Topbar**
  (breadcrumb, ⌘K search, avatar menu).
- **UI kit** (`components/ui`) — Button, Card, Badge, Modal, ConfirmDialog, etc.
- **Pages** (`pages/`) — one per screen.

### 3.2 Backend (`backend/app/`)
- **`main.py`** — creates the FastAPI app, configures CORS, mounts the static avatar
  directory, and includes the routers.
- **`api/v1/*`** — one router per resource.
- **`api/deps.py`** — `get_current_user` dependency (decodes the JWT, loads the user).
- **`db/crud.py`** — all database reads/writes (the only module that talks to Supabase).
- **`db/supabase_client.py`** — a **thread-local** Supabase client (see Concurrency).
- **`llm/client.py`** — wraps the Gemini call and JSON parsing; `prompt_loader.py` loads
  prompt templates.
- **`models/schemas.py`** — Pydantic models for request/response validation.
- **`utils/`** — `pdf_extractor` (PyMuPDF), `security` (bcrypt + JWT), `email_sender`
  (SMTP/Brevo/SendGrid), `parallel` (concurrent query helper), `file_utils`.

## 4. Key design decisions

### 4.1 Data hierarchy
`Project (Client|Internal) → Job Opening (JD) → Candidate (résumé)`, with a
`candidate_mappings` join table so a candidate can also belong to **other** openings
(many-to-many overlay), each mapping carrying its own score and lifecycle state.

### 4.2 AI as cached prompt templates
Each AI feature is a text prompt + a Gemini call returning strict JSON. Results are
**persisted** on the relevant row (e.g., a candidate's skill gap, an opening's bias
report). Pages read the cache; a `?refresh=true` flag re-generates on demand. This keeps
the UI fast and the API cost low.

### 4.3 Synchronous handlers in a threadpool
DB-bound endpoints are plain (`def`) functions, so FastAPI runs them in a worker
threadpool and concurrent requests don't block each other. Independent queries within an
endpoint are run in parallel via a small `gather()` helper.

### 4.4 Concurrency & the database client
The Supabase client's underlying HTTP/2 connection is **not** safe to share across
threads. The client is therefore **thread-local** (one connection per thread), and the
parallel-query helper uses a **persistent** thread pool so connections are reused. This
eliminated intermittent `httpx.ReadError` failures under concurrency.

### 4.5 File handling
Uploaded JDs and résumés are stored on disk (`UPLOAD_DIR`); their paths are saved in the
DB and served back through dedicated file endpoints (inline for preview, attachment for
download). Avatars are served via a static mount.

## 5. Request lifecycle (example: screening candidates)

1. Recruiter creates a **Project**, then adds a **Job Opening** by uploading a JD PDF.
2. Backend extracts JD text (PyMuPDF) → Gemini parses it → stored in `jds`.
3. Recruiter uploads résumés (or imports from a folder). Each is extracted → parsed by
   Gemini → stored in `resumes` with state `Profile Imported`.
4. On "Screen", the backend scores each unscored résumé against the JD (Gemini) → stores
   `hiring_score` + rationale, state → `Matched`.
5. The ranked list merges home candidates + any cross-mapped candidates, sorted by score.
6. Skill gap / bias / interview prep / summary / email are generated on demand and
   cached.

## 6. Security

- Passwords hashed with **bcrypt**; never returned by the API.
- Stateless **JWT** (HS256) auth; token in `localStorage`, sent as a Bearer header.
- All third-party secrets (Supabase service key, Gemini key, email creds) live only in
  the backend `.env`.
- Forgot-password uses a short-lived, single-purpose reset token; the endpoint never
  reveals whether an account exists.

## 7. Scalability & performance notes

- Round-trips to Supabase are minimised (batched `IN` queries, no N+1) and parallelised.
- AI results are cached to avoid repeat calls.
- Current bottleneck for large batches is **synchronous** résumé parsing — Phase 2 moves
  this to a background job queue.

## 8. Technology choices (rationale)

| Choice | Why |
|---|---|
| FastAPI | Fast to build, typed, auto OpenAPI docs. |
| Supabase | Managed Postgres + simple client, quick to stand up. |
| Gemini 2.5 Flash | Strong quality at low latency/cost; native JSON output. |
| React + Vite + Tailwind | Fast DX, modern UI, small bundle. |
