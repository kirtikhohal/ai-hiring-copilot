# Database Design / ER Diagram — Hazel

The database is **PostgreSQL**, hosted on **Supabase**. The backend connects with the
Supabase **service_role** key (server-side only) and is the sole writer. Row Level
Security is enabled on the tables; because the backend uses the service role, it operates
as a trusted server (POC — no per-user isolation yet).

## 1. Entity-relationship overview

```
┌───────────┐          ┌────────────┐          ┌───────────┐          ┌──────────────────────┐
│  users    │          │  projects  │ 1      * │   jds      │ 1      * │      resumes          │
│           │          │ (client/   │──────────│ (job       │──────────│   (candidates)        │
│           │          │  internal) │          │  openings) │          │                       │
└───────────┘          └────────────┘          └─────┬──────┘          └──────────┬───────────┘
 (accounts, standalone)                               │                            │
                                                      │ *                        * │
                                                      │      candidate_mappings    │
                                                      └────────────◇───────────────┘
                                                   a candidate can also be linked to
                                                   OTHER openings (many-to-many overlay)
```

- **projects → jds**: one project has many job openings (`jds.project_id`).
- **jds → resumes**: one opening has many "home" candidates (`resumes.jd_id`).
- **resumes ↔ jds** via **candidate_mappings**: a candidate can additionally be mapped
  to other openings, each mapping carrying its own score/state.
- **users** is standalone (accounts); the POC does not scope data per user.

## 2. Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | default `gen_random_uuid()` |
| full_name | text | |
| username | text | unique |
| email | text | unique |
| position | text | e.g. "HR Recruiter" |
| org | text | organization name |
| org_city | text | |
| org_country | text | |
| avatar_url | text | path served via static mount |
| password_hash | text | bcrypt |
| created_at | timestamptz | default `now()` |

### `projects`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | project name |
| type | text | `client` or `internal` |
| client_name | text | for client projects |
| company_name | text | for internal projects (recruiter's org) |
| created_at | timestamptz | |

### `jds` (job openings)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| project_id | uuid (FK → projects.id) | nullable (legacy/unassigned) |
| role_title | text | |
| required_skills | jsonb | array of strings |
| preferred_skills | jsonb | array of strings |
| min_experience_years | numeric | |
| education_requirements | text | |
| key_responsibilities | jsonb | array of strings |
| raw_text | text | extracted JD text (for bias scan) |
| file_path | text | stored PDF path |
| bias_report | jsonb | cached AI bias result |
| interview_summary | jsonb | cached transcript + AI summary |
| created_at | timestamptz | |

### `resumes` (candidates)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| jd_id | uuid (FK → jds.id) | the candidate's "home" opening |
| filename | text | original file name |
| file_path | text | stored PDF path |
| candidate_name | text | parsed |
| email | text | parsed |
| phone | text | parsed |
| total_experience_years | numeric | parsed |
| skills | jsonb | parsed array |
| education | text | parsed |
| work_history_summary | text | parsed |
| certifications | jsonb | parsed array |
| hiring_score | int | AI score 0–100 (home opening) |
| rationale | text | AI score reasoning |
| source | text | `internal` or `external` (default `external`) |
| state | text | lifecycle (default `profile_imported`) |
| skill_gap | jsonb | cached AI skill-gap result |
| interview_questions | jsonb | cached AI questions |
| email_drafts | jsonb | cached AI email drafts (per decision) |
| created_at | timestamptz | |

### `candidate_mappings` (candidate ↔ other openings)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| resume_id | uuid (FK → resumes.id) | |
| jd_id | uuid (FK → jds.id) | the additional opening |
| state | text | lifecycle for this opening (default `shortlisted`) |
| hiring_score | int | AI score for this opening |
| rationale | text | AI reasoning for this opening |
| created_at | timestamptz | |
| — | unique(resume_id, jd_id) | prevents duplicate mappings |

### Lifecycle states (`resumes.state` / `candidate_mappings.state`)
`profile_imported`, `ai_matching`, `matched`, `shortlisted`, `interview_scheduled`,
`selected`, `rejected`, `on_hold`, `idle`.

## 3. Consolidated setup SQL

Run this in the Supabase SQL editor to create the schema from scratch. (Array columns
are stored as `jsonb`.)

```sql
-- USERS
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  username text unique,
  email text unique,
  position text,
  org text,
  org_city text,
  org_country text,
  avatar_url text,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- PROJECTS
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'client',        -- 'client' | 'internal'
  client_name text,
  company_name text,
  created_at timestamptz not null default now()
);

-- JOB OPENINGS (jds)
create table if not exists jds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  role_title text,
  required_skills jsonb default '[]',
  preferred_skills jsonb default '[]',
  min_experience_years numeric default 0,
  education_requirements text,
  key_responsibilities jsonb default '[]',
  raw_text text,
  file_path text,
  bias_report jsonb,
  interview_summary jsonb,
  created_at timestamptz not null default now()
);

-- CANDIDATES (resumes)
create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  jd_id uuid references jds(id),
  filename text,
  file_path text,
  candidate_name text,
  email text,
  phone text,
  total_experience_years numeric default 0,
  skills jsonb default '[]',
  education text,
  work_history_summary text,
  certifications jsonb default '[]',
  hiring_score int,
  rationale text,
  source text not null default 'external',    -- 'internal' | 'external'
  state text not null default 'profile_imported',
  skill_gap jsonb,
  interview_questions jsonb,
  email_drafts jsonb,
  created_at timestamptz not null default now()
);

-- CANDIDATE ↔ OPENING MAPPINGS (many-to-many overlay)
create table if not exists candidate_mappings (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references resumes(id) on delete cascade,
  jd_id uuid not null references jds(id) on delete cascade,
  state text not null default 'shortlisted',
  hiring_score int,
  rationale text,
  created_at timestamptz not null default now(),
  unique (resume_id, jd_id)
);

-- Enable Row Level Security (backend uses the service_role key, which bypasses RLS)
alter table users enable row level security;
alter table projects enable row level security;
alter table jds enable row level security;
alter table resumes enable row level security;
alter table candidate_mappings enable row level security;
```

## 4. Notes & indexing suggestions

- Common lookups filter by `jds.project_id`, `resumes.jd_id`, and
  `candidate_mappings.jd_id` / `resume_id`. For larger datasets, add indexes:
  ```sql
  create index if not exists idx_jds_project on jds(project_id);
  create index if not exists idx_resumes_jd on resumes(jd_id);
  create index if not exists idx_mappings_jd on candidate_mappings(jd_id);
  create index if not exists idx_mappings_resume on candidate_mappings(resume_id);
  ```
- The large AI outputs (`skill_gap`, `interview_questions`, `email_drafts`,
  `bias_report`, `interview_summary`) are `jsonb` caches; list queries deliberately
  avoid selecting them to keep responses small.
- Deletes cascade in application code (project → openings → candidates → mappings +
  files); `candidate_mappings` also has DB-level `on delete cascade`.
