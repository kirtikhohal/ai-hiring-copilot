# Hazel — AI Hiring Copilot

Hazel is an AI assistant for recruiters. You upload a job description and a batch of
candidate résumés, and Hazel automatically reads them, scores each candidate against
the role, highlights skill gaps, checks the job description for biased language,
generates tailored interview questions, summarises interviews, and drafts outreach
emails — all organised by client / internal projects and their job openings.

The goal is simple: **turn hours of manual screening into minutes**, while keeping a
human in control of every decision.

---

## Table of contents

- [Project overview](#project-overview)
- [Key features](#key-features)
- [Technology stack](#technology-stack)
- [AI models & AI features](#ai-models--ai-features)
- [External libraries, APIs & resources](#external-libraries-apis--resources)
- [Prerequisites](#prerequisites)
- [Installation & setup](#installation--setup)
- [Environment variables](#environment-variables)
- [Project folder structure](#project-folder-structure)
- [Screenshots / demo](#screenshots--demo)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Future enhancements (Phase 2)](#future-enhancements-phase-2)
- [Documentation](#documentation)

---

## Project overview

### Problem statement
Recruiters spend a large part of their day on repetitive, manual work: reading every
résumé, matching it against a job description, comparing candidates, writing interview
questions, and following up over email. This is slow, inconsistent, and hard to scale
when a single opening attracts dozens of applicants — or when the same candidate is a
fit for several openings across different clients.

### Solution
Hazel automates the repetitive parts of screening using AI, while leaving hiring
decisions to the recruiter:

- It parses job descriptions and résumés into structured data.
- It scores and ranks candidates against the role with an explainable rationale.
- It surfaces skill gaps, bias in the JD, tailored interview questions, interview
  summaries, and ready-to-edit outreach emails.
- It organises everything under **Projects → Job Openings → Candidates**, and lets a
  candidate be considered for multiple openings at once.

### Target users
- **Recruiters / talent acquisition specialists** — the primary day-to-day users.
- **Hiring managers** — reviewing ranked shortlists and interview material.
- **Staffing / consulting teams** — who hire for multiple external **clients** as well
  as **internal** teams, and need a client-wise view of open positions.

---

## Key features

### Current features
- **Projects & job openings** — group hiring under a **Client** or **Internal** project;
  each project holds multiple job openings (roles).
- **Client-wise & internal views** — see which clients have open positions and how many
  active openings each has.
- **Résumé intake, three ways** — upload individual PDFs, upload a ZIP, or **fetch
  directly from a server folder** for large batches.
- **AI screening** — every résumé is parsed and scored 0–100 against the JD with a
  written rationale, then ranked (list or card view, with a name filter).
- **Skill-gap analysis** — matched vs. missing skills per candidate (Required skills
  emphasised over Preferred).
- **Bias detection** — scans the JD for non-inclusive language and suggests fixes.
- **Interview prep** — AI-generated technical + behavioural questions tailored to the
  résumé and JD; downloadable as a PDF.
- **Interview summary** — paste a transcript or import a transcript PDF; Hazel distills
  strengths, watch-outs and a recommended verdict; downloadable as a PDF.
- **Outreach emails** — AI-drafted "move to next round" / "rejection" emails you can
  edit inline and actually send; sending advances the candidate's state automatically.
- **Candidate lifecycle** — a 9-state machine (Profile Imported → AI Matching → Matched
  → Shortlisted → Interview Scheduled → Selected / Rejected / On Hold / Idle) shown as a
  badge and editable per opening.
- **Candidate source** — mark candidates **Internal** or **External** and filter by it.
- **One candidate, many openings** — add a candidate to other openings; they are
  re-scored for each and appear in each opening's ranked list.
- **Global search** — ⌘K / Ctrl+K to jump to any client, opening, or candidate.
- **Accounts** — register, login, forgot/reset password (email-based), profile with
  avatar upload.
- **Contact us** — sends a message to the team inbox.
- **Delete** — remove a project, a job opening, or a candidate (scoped to one opening),
  each behind a confirmation dialog.
- **Toasts & confirmations** — clear success/error feedback throughout.

### Future scope
See [Future enhancements](#future-enhancements-phase-2).

---

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, lucide-react icons |
| Backend | Python, FastAPI, Uvicorn |
| Database | Supabase (managed PostgreSQL) |
| AI | Google Gemini (`google-genai` SDK) |
| Auth | Custom users table + bcrypt password hashing + JWT (PyJWT) |
| PDF parsing | PyMuPDF (fitz) |
| Email | SMTP (Gmail) or HTTP APIs (Brevo / SendGrid) |
| PDF generation (client) | jsPDF |

---

## AI models & AI features

**Model:** Google **Gemini 2.5 Flash** (`gemini-2.5-flash`), called through the official
`google-genai` Python SDK. Responses are requested as strict JSON
(`response_mime_type=application/json`) and validated with Pydantic. "Thinking" is
disabled (`thinking_budget=0`) for faster, cheaper responses.

Each AI feature is a prompt template (plain text in `backend/app/prompts/`) filled with
the relevant JD/résumé/transcript data:

| Feature | Prompt | What it does |
|---|---|---|
| JD parsing | `parse_jd` | Extracts role title, required/preferred skills, min experience, education, responsibilities. |
| Résumé parsing | `parse_resume` | Turns a résumé into a structured profile (skills, experience, education, etc.). |
| Candidate ranking | `rank_candidate` | Scores a candidate 0–100 against the JD with a rationale. |
| Skill-gap analysis | `skill_gap` | Matched vs. missing required/preferred skills + summary. |
| Bias detection | `bias_detection` | Flags biased phrases in the JD with suggested alternatives. |
| Interview questions | `interview_questions` | Technical + behavioural questions tailored to the candidate. |
| Interview summary | `interview_summary` | Strengths, weaknesses and a verdict from a transcript. |
| Email drafting | `email_draft` | Personalised next-round / rejection emails. |

**Cost control:** every AI result is cached in the database, so opening a page again
does not re-charge the API. A `?refresh=true` flag forces a fresh generation when the
user explicitly clicks "Regenerate".

---

## External libraries, APIs & resources

### Services / APIs

| Service | Purpose | Licensing |
|---|---|---|
| Google Gemini API | All AI features | **Paid** (usage-based; requires billing enabled) |
| Supabase | PostgreSQL database + file-safe backend access | **Free tier** (paid plans available) |
| Brevo / SendGrid (optional) | Sending email over HTTPS when SMTP is blocked | **Free tier** |
| Gmail SMTP (optional) | Sending email | **Free** |
| Google Fonts (Manrope) | UI font | **Free / open source** |

### Backend libraries (Python)

| Library | Purpose | Licensing |
|---|---|---|
| FastAPI, Uvicorn | Web framework + server | Open source (MIT / BSD) |
| Pydantic, pydantic-settings | Validation & settings | Open source (MIT) |
| supabase (supabase-py) | Database client | Open source (MIT) |
| google-genai | Gemini SDK | Open source (Apache-2.0) |
| PyMuPDF (fitz) | Extract text from PDFs | **AGPL-3.0 or commercial** (see note below) |
| bcrypt | Password hashing | Open source (Apache-2.0) |
| PyJWT | JWT tokens | Open source (MIT) |
| python-multipart | File uploads | Open source (Apache-2.0) |

> **Note on PyMuPDF:** it is licensed **AGPL-3.0 or a paid commercial licence**. This is
> fine for internal / evaluation use, but a commercial licence (or switching to an
> MIT/BSD PDF library such as `pypdf`) should be considered before shipping commercially.

### Frontend libraries (JavaScript)

| Library | Purpose | Licensing |
|---|---|---|
| React, React DOM | UI framework | Open source (MIT) |
| Vite | Build tool / dev server | Open source (MIT) |
| Tailwind CSS | Styling | Open source (MIT) |
| react-router-dom | Routing | Open source (MIT) |
| lucide-react | Icons | Open source (ISC) |
| jsPDF | Client-side PDF export | Open source (MIT) |
| class-variance-authority, clsx, tailwind-merge | Styling utilities | Open source (MIT) |

---

## Prerequisites

- **Python 3.11+** (developed on 3.13)
- **Node.js 18+** and npm
- A **Supabase** project (free tier is fine) with the schema created (see
  [docs/DATABASE.md](docs/DATABASE.md))
- A **Google Gemini API key** with billing enabled
- *(Optional)* Email credentials — a Gmail App Password, or a Brevo/SendGrid API key —
  if you want the email features to actually send

---

## Installation & setup

### 1. Clone

```bash
git clone https://github.com/kirtikhohal/ai-hiring-copilot.git
cd ai-hiring-copilot
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS / Linux
pip install -r requirements.txt

copy .env.example .env           # Windows  (cp on macOS/Linux)
# → open .env and fill in real values (see below)

uvicorn app.main:app --reload --port 8000
```

The API runs at `http://127.0.0.1:8000` (interactive docs at `/docs`).

> Set up the database tables first — run the SQL in
> [docs/DATABASE.md](docs/DATABASE.md) in the Supabase SQL editor.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

The frontend talks to the backend at `http://127.0.0.1:8000` by default; override with
`VITE_API_URL` in a `frontend/.env` if needed.

> **Note on email + corporate networks:** many office networks block outbound SMTP.
> If email fails with a timeout, either run the backend on a non-corporate network
> (Gmail SMTP) or use `EMAIL_PROVIDER=brevo` / `sendgrid` (HTTPS, port 443). See
> [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

---

## Environment variables

The backend reads configuration from `backend/.env`. A template is provided at
`backend/.env.example`:

```ini
# --- Google Gemini ---
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# --- Supabase (service_role key, used server-side only) ---
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key

# --- Auth ---
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRE_MINUTES=10080

# --- File uploads ---
UPLOAD_DIR=uploads
# Base folder for the "import from server folder" upload method:
# <RESUME_BASE_PATH>/<Job Opening role>/<Internal|External>
# RESUME_BASE_PATH=C:\path\to\JD&Resumes

# --- Email ---
# EMAIL_PROVIDER: smtp | brevo | sendgrid
EMAIL_PROVIDER=smtp
EMAIL_FROM=you@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your-gmail-app-password
# BREVO_API_KEY=
# SENDGRID_API_KEY=
FRONTEND_URL=http://localhost:5173
```

> **Never commit your real `.env`.** It is git-ignored. Only `.env.example` (with
> placeholders) belongs in the repository.

---

## Project folder structure

```
ai-hiring-copilot/
├── README.md
├── .gitignore
├── docs/                         # Project documentation (PRD, HLD, API, etc.)
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   └── app/
│       ├── main.py               # FastAPI app + router mounts + CORS + static files
│       ├── config.py             # Settings loaded from .env
│       ├── api/
│       │   ├── deps.py           # Auth dependency (get_current_user)
│       │   └── v1/               # Routers: auth, projects, jd, resumes,
│       │       │                 #          candidates, interview, email, contact, stats
│       ├── db/
│       │   ├── supabase_client.py# Thread-local Supabase client
│       │   └── crud.py           # All database operations
│       ├── llm/
│       │   ├── client.py         # Gemini call + JSON parsing
│       │   └── prompt_loader.py  # Loads prompt .txt templates
│       ├── prompts/              # Prompt templates (parse_jd, rank_candidate, ...)
│       ├── models/schemas.py     # Pydantic request/response models
│       ├── services/             # Shared logic (e.g. skill-gap)
│       └── utils/                # pdf_extractor, security, email_sender, parallel, file_utils
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx, App.jsx, router.jsx
        ├── index.css
        ├── lib/                  # api.js, auth.jsx, toast.jsx, routes.js, lifecycle.js, ...
        ├── components/
        │   ├── ui/               # Button, Card, Badge, Modal, ConfirmDialog, ...
        │   ├── shell/            # Sidebar, Topbar, SearchModal, PageContainer, doc-views
        │   └── auth/             # BrandPanel, form fields
        ├── pages/                # Dashboard, Clients, Internal, Ranked, CandidateDetail, ...
        └── data/                 # locations.js (country/city data)
```

---

## Screenshots / demo

> Add screenshots to `docs/images/` and they will render below. Suggested captures:

| Screen | Image |
|---|---|
| Dashboard (projects → job openings) | `docs/images/dashboard.png` |
| Ranked candidates | `docs/images/ranked.png` |
| Candidate detail (skill gap, bias, opportunities) | `docs/images/candidate.png` |
| Interview prep | `docs/images/interview-prep.png` |
| Interview summary | `docs/images/summary.png` |
| Email draft | `docs/images/email.png` |

Example embed once added:

```markdown
![Dashboard](docs/images/dashboard.png)
```

---

## Troubleshooting

Common issues and fixes live in [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).
Highlights:

- **"Failed to fetch" / 404s on dashboard** → the backend process is stale; restart it.
- **Email not sending (timeout)** → your network blocks SMTP; use Brevo/SendGrid or a
  different network.
- **Slow first request** → Supabase cold start; subsequent requests are fast.

---

## Known limitations

- **POC scope** — no role-based access control, no per-user data isolation (all data is
  shared within the single trusted workspace), and no automated test suite yet.
- **Synchronous AI processing** — résumés are parsed one-by-one via blocking API calls,
  so batch upload / server-folder import is **capped at 20 résumés per run** to avoid
  request timeouts. Larger batches need a background-job refactor.
- **Database latency** — the app talks to Supabase over the network (~300 ms per query);
  round-trips are minimised and parallelised, but a far-away region or restrictive
  network will still add latency.
- **PyMuPDF licensing** — AGPL-3.0 (see note above).
- **Email deliverability** — depends on the configured provider and sender verification.

---

## Future enhancements (Phase 2)

- Background job queue for large-scale résumé ingestion (hundreds at once) with live
  progress.
- Role-based access control and per-recruiter data isolation.
- Bulk actions (shortlist/reject multiple candidates, bulk email).
- Analytics dashboard (funnel, time-to-hire, source effectiveness).
- ATS / calendar / job-board integrations.
- Automated test suite (unit + integration + E2E) and CI/CD.
- Configurable scoring weights and prompt tuning per organisation.

---

## Documentation

Detailed documents live in the [`docs/`](docs/) folder:

- [Product Requirements Document (PRD)](docs/PRD.md)
- [High-Level Design (HLD)](docs/HLD.md)
- [Database Design / ER Diagram](docs/DATABASE.md)
- [API Documentation](docs/API.md)
- [Test Plan](docs/TEST_PLAN.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [User Guide](docs/USER_GUIDE.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
