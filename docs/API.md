# API Documentation — Hazel

- **Base URL:** `http://127.0.0.1:8000`
- **API prefix:** `/api/v1`
- **Interactive docs:** `http://127.0.0.1:8000/docs` (Swagger UI, auto-generated)
- **Auth:** most account endpoints require a JWT — send `Authorization: Bearer <token>`.
  The other resource endpoints are open in this POC (single trusted workspace).
- **Content type:** JSON, except file uploads which use `multipart/form-data`.

Errors use standard HTTP status codes with a body of `{"detail": "<message>"}`.

---

## Auth — `/api/v1/auth`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/register` | — | full_name, username, email, position, org_name, org_city, org_country, password | Create an account (returns the user; no token). |
| POST | `/login` | — | identifier (email or username), password | Returns `{ token, user }`. |
| POST | `/forgot-password` | — | email | Emails a reset link if the account exists (always returns the same message). |
| POST | `/reset-password` | — | token, password | Sets a new password from a valid reset token. |
| GET | `/me` | ✅ | — | Returns the current user. |
| PATCH | `/profile` | ✅ | any of full_name, username, email, position, org, org_city, org_country | Update profile. |
| POST | `/avatar` | ✅ | multipart `file` (image) | Upload profile photo. |

---

## Projects — `/api/v1/projects`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| GET | `` | — | — | List all projects, each with its nested job openings + counts (candidates, top score, shortlisted). |
| POST | `` | ✅ | name, type (`client`/`internal`), client_name | Create a project (internal uses the recruiter's org as company). |
| DELETE | `/{project_id}` | — | — | Delete a project and everything under it (openings, candidates, mappings, files). |

---

## Job openings — `/api/v1/jd`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| GET | `` | — | — | Legacy flat list of openings with basic stats. |
| POST | `/upload` | — | multipart `file` (PDF), `project_id` | Upload a JD; extracts + AI-parses it; creates the opening. |
| GET | `/{jd_id}` | — | — | Parsed JD + project context + `has_file`. |
| GET | `/{jd_id}/file` | — | `?download=true` optional | Serve the original JD PDF (inline or attachment). |
| GET | `/{jd_id}/bias` | — | `?refresh=true` optional | AI bias report for the JD (cached). |
| DELETE | `/{jd_id}` | — | — | Delete an opening and its candidates + files. |

---

## Résumés — `/api/v1/resumes`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/upload` | — | multipart `jd_id`, `source`, `files[]` (PDF/ZIP) | Upload résumés; each is AI-parsed and stored. |
| POST | `/import-local` | — | jd_id, source | Fetch résumés from `<RESUME_BASE_PATH>/<role>/<Internal\|External>` on the server. |
| GET | `/{resume_id}/file` | — | `?download=true` optional | Serve the original résumé PDF. |

> Batch upload / import is capped at **20 résumés per run** (synchronous AI parsing).

---

## Candidates — `/api/v1/candidates`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/rank/{jd_id}` | — | — | Score any unscored candidates for the opening, persist, return ranked list. |
| GET | `/rank/{jd_id}` | — | — | Ranked list (home + cross-mapped candidates), no AI calls. |
| GET | `/all` | — | — | Flat candidate directory (for global search). |
| GET | `/{resume_id}/skill-gap` | — | `?refresh=true` optional | AI skill-gap analysis (cached). |
| PATCH | `/{resume_id}/state` | — | state | Set the candidate's lifecycle state (home opening). |
| GET | `/{resume_id}/mappings` | — | — | All openings a candidate is associated with. |
| POST | `/{resume_id}/mappings` | — | jd_id, state | Add candidate to another opening (re-scores against it). |
| PATCH | `/mappings/{mapping_id}` | — | state | Update a mapping's lifecycle state. |
| DELETE | `/mappings/{mapping_id}` | — | — | Unlink a candidate from a mapped opening. |
| DELETE | `/{resume_id}` | — | — | Delete a candidate entirely. |
| DELETE | `/{resume_id}/openings/{jd_id}` | — | — | Remove a candidate from **one** opening only (promotes another to "home" if needed). |

---

## Interview — `/api/v1/interview`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/questions` | — | jd_id, resume_id (`?refresh=true`) | AI technical + behavioural questions (cached). |
| POST | `/transcript/extract` | — | multipart `file` (PDF) | Extract text from a transcript PDF. |
| GET | `/summary/{jd_id}` | — | — | Last stored interview summary (or null). |
| POST | `/summary` | — | jd_id, transcript (`?refresh=true`) | AI summary + verdict from a transcript (cached). |

---

## Email — `/api/v1/email`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/draft` | — | jd_id, resume_id, decision (`next_round`/`rejection`) (`?refresh=true`) | AI-draft an outreach email (cached per decision). |
| POST | `/send` | — | jd_id, resume_id, decision, subject, body | Send the email; advances candidate state (next_round → Interview Scheduled, rejection → Rejected). |

---

## Contact — `/api/v1/contact`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `` | — | topic, email, message | Sends a contact message to the team inbox (Reply-To = sender). |

---

## Stats & health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/stats/dashboard` | — | Active openings, résumés screened, estimated hours saved. |
| GET | `/health` | — | Liveness check → `{ "status": "ok" }`. |

---

## Examples

### Login
```bash
curl -X POST http://127.0.0.1:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"dana@company.com","password":"secret123"}'
```
```json
{ "token": "eyJhbGciOi...", "user": { "id": "...", "full_name": "Dana", "...": "..." } }
```

### Ranked candidates
```bash
curl http://127.0.0.1:8000/api/v1/candidates/rank/<jd_id>
```
```json
{
  "jd_id": "…",
  "ranked_candidates": [
    { "resume_id": "…", "candidate_name": "Priya Sharma", "hiring_score": 92,
      "rationale": "Strong async FastAPI + PostgreSQL match…",
      "skills": ["Python","FastAPI"], "source": "external",
      "state": "shortlisted", "opportunities": 2, "shared": false }
  ]
}
```

### Add a candidate to another opening
```bash
curl -X POST http://127.0.0.1:8000/api/v1/candidates/<resume_id>/mappings \
  -H "Content-Type: application/json" \
  -d '{"jd_id":"<other_jd_id>","state":"shortlisted"}'
```

> The full, always-current request/response schemas are available interactively at
> `/docs` (Swagger) and `/openapi.json`.
