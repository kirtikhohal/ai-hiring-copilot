# Product Requirements Document (PRD) — Hazel, AI Hiring Copilot

**Status:** POC / v1
**Owner:** Talent Acquisition tooling
**Last updated:** 2026-07

---

## 1. Purpose

Hazel helps recruiters screen and manage candidates faster by automating the repetitive
parts of hiring with AI, while keeping the recruiter in control of every decision.

## 2. Problem statement

Recruiters manually read every résumé, match it to a job description, compare
candidates, write interview questions, and follow up by email. This is:

- **Slow** — dozens of résumés per opening.
- **Inconsistent** — different reviewers judge differently.
- **Hard to scale** — especially for staffing teams hiring for many clients, or when one
  candidate fits several openings.

## 3. Goals & non-goals

### Goals
- Cut screening time dramatically (target: ~90% less manual reading time).
- Give every candidate an **explainable** 0–100 fit score.
- Organise hiring by **client / internal projects → job openings → candidates**.
- Support a candidate being considered for **multiple openings** at once.
- Provide end-to-end assist: ranking → skill gaps → bias check → interview prep →
  interview summary → outreach email.

### Non-goals (for this POC)
- Not an ATS replacement (no offer management, onboarding, payroll).
- No role-based access control or multi-tenant isolation yet.
- No large-scale (hundreds at once) background processing yet.

## 4. Target users & personas

| Persona | Needs |
|---|---|
| **Recruiter (primary)** | Screen fast, shortlist, prep interviews, send emails. |
| **Hiring manager** | Review ranked shortlists and interview material. |
| **Staffing/consulting team** | Client-wise view of openings; reuse candidates across clients. |

## 5. User stories

- As a recruiter, I upload a JD and a batch of résumés and get a ranked shortlist with
  reasons, so I can focus on the top candidates.
- As a recruiter, I see each candidate's skill gaps against the role.
- As a recruiter, I check my JD for biased language before publishing.
- As a recruiter, I generate tailored interview questions for a candidate.
- As a recruiter, I paste an interview transcript and get a summary + verdict.
- As a recruiter, I draft and send a next-round or rejection email, and the candidate's
  status updates automatically.
- As a staffing lead, I organise openings by client and see which clients have demand.
- As a recruiter, I add a strong candidate to another client's opening and they get
  re-scored for it.
- As a recruiter, I track each candidate through a lifecycle (imported → … → selected).
- As a recruiter, I mark candidates internal vs external and filter by source.
- As a user, I register, sign in, reset my password, and manage my profile.

## 6. Functional requirements

1. **Auth** — register, login (email or username), forgot/reset password via email,
   profile edit, avatar upload.
2. **Projects** — create Client or Internal projects; list them; delete them.
3. **Job openings** — add an opening to a project by uploading a JD PDF (auto-parsed);
   view parsed metadata + original PDF; delete an opening.
4. **Résumés** — upload individual PDFs, a ZIP, or import from a server folder; each is
   parsed into a structured profile; view/download the original.
5. **Ranking** — score & rank candidates per opening (list/card views, name filter).
6. **Skill gap** — matched vs. missing skills per candidate.
7. **Bias detection** — flag biased JD phrases + suggestions.
8. **Interview prep** — technical + behavioural questions; export PDF.
9. **Interview summary** — from pasted text or an imported transcript PDF; export PDF.
10. **Email** — AI-drafted, editable, sendable; sending updates candidate state.
11. **Lifecycle** — 9-state machine, auto + manual transitions.
12. **Source** — internal/external flag + filter.
13. **Multi-opening mapping** — add a candidate to more openings (re-scored per opening).
14. **Clients & Internal views** — client-wise and internal roll-ups of openings.
15. **Search** — global ⌘K search across clients, openings, candidates.
16. **Contact us** — send a message to the team inbox.
17. **Delete** — project / job opening / candidate (scoped), each with confirmation.

## 7. Non-functional requirements

- **Usability** — clean, modern UI; clear success/error feedback (toasts); confirmation
  before destructive actions.
- **Performance** — non-AI (DB) endpoints should feel fast; AI calls may take seconds
  and are cached to avoid repeat cost.
- **Security** — passwords hashed (bcrypt); JWT auth; secrets server-side only.
- **Cost** — AI outputs cached; "thinking" disabled on the model.
- **Reliability** — concurrent requests must not corrupt shared connections.

## 8. Success metrics

- Time to shortlist a batch of résumés (target: minutes, not hours).
- % of screening handled automatically before human review.
- Recruiter adoption / repeat usage.

## 9. Assumptions & constraints

- Small batches (≤ ~20 résumés per run) for the POC.
- Single trusted workspace (no per-user isolation yet).
- Gemini billing enabled; Supabase project provisioned.

## 10. Out of scope (Phase 2+)

See "Future enhancements" in the README — background jobs, RBAC, analytics,
integrations, automated tests, CI/CD.
