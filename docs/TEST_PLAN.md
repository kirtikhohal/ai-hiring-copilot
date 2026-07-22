# Test Plan — Hazel

This POC does not yet ship an automated test suite. This document defines a **manual
test plan** (what to verify before a demo/release) and outlines the **automated testing**
to add in Phase 2.

## 1. Scope

- Functional testing of all user-facing flows.
- Basic non-functional checks: performance feel, error handling, security basics.
- Out of scope for now: load testing at scale, security penetration testing.

## 2. Test environment

- Backend running (`uvicorn ... --port 8000`) with a valid `.env` and Supabase schema.
- Frontend running (`npm run dev`).
- A Gemini key with billing; (optional) email configured for email tests.
- A few sample JD PDFs and résumé PDFs.

## 3. Manual test cases

Legend: **Steps → Expected result**

### Authentication
| # | Test | Steps → Expected |
|---|---|---|
| A1 | Register | Fill the form (incl. country→city dropdowns) → account created, redirected to login with a success banner. |
| A2 | Login | Enter email/username + password → lands on dashboard; invalid creds → clear error toast. |
| A3 | Forgot password | Submit email → generic "if an account exists…" message; a reset email arrives (if email configured). |
| A4 | Reset password | Open the emailed link → set a new password → can log in with it. |
| A5 | Profile | Edit fields + upload avatar → changes persist and show in sidebar/topbar. |
| A6 | Logout | Avatar menu → Sign out → returns to login; protected routes redirect to register/login. |

### Projects & job openings
| # | Test | Steps → Expected |
|---|---|---|
| P1 | Create client project | New project → Client + client name + project name → appears on dashboard. |
| P2 | Create internal project | New project → Internal → uses org as company. |
| P3 | Add job opening | Expand project → Add job opening → upload JD PDF → parsed metadata shows; View JD works. |
| P4 | Clients view | Sidebar → Clients → clients listed with active opening counts. |
| P5 | Internal view | Sidebar → Internal → internal projects listed. |
| P6 | Delete opening | Trash on an opening → confirm → opening + its candidates removed. |
| P7 | Delete project | Trash on a project → confirm → project + all openings/candidates removed. |

### Résumés & screening
| # | Test | Steps → Expected |
|---|---|---|
| R1 | Upload individual | Add PDFs → Screen → processing → ranked list with scores + rationale. |
| R2 | Upload ZIP | Upload a ZIP of PDFs → same result. |
| R3 | Server folder import | Choose "Server folder" + source → Fetch & screen → résumés from `<base>/<role>/<Internal\|External>` are ingested. |
| R4 | Source toggle | Upload as Internal vs External → candidates carry the correct source badge. |
| R5 | Ranked filters | Filter by name; toggle List/Cards; filter All/Internal/External. |

### Candidate detail & AI features
| # | Test | Steps → Expected |
|---|---|---|
| C1 | Skill gap | Open a candidate → matched vs. missing skills shown; Refresh regenerates. |
| C2 | Bias detection | Bias card shows flagged phrases + fixes (or "none detected"). |
| C3 | Interview prep | Generate → technical + behavioural questions; Download PDF works. |
| C4 | Interview summary (paste) | Paste transcript → Summarize → strengths/watch-outs/verdict; Download PDF works. |
| C5 | Interview summary (import) | Import a transcript PDF → text fills in → Summarize. |
| C6 | Lifecycle state | Change a candidate's state via dropdown → badge updates. |
| C7 | View/download résumé & JD | Quick-view + download work from the candidate page. |

### Multi-opening mapping
| # | Test | Steps → Expected |
|---|---|---|
| M1 | Add to opening | Candidate → Opportunities → Add to opening → candidate re-scored and appears in that opening's ranked list. |
| M2 | Counts update | Dashboard/Clients/Internal candidate counts include the mapped-in candidate. |
| M3 | Switch opportunity | Click another opportunity → navigates to that opening's candidate view. |
| M4 | Scoped delete | Remove from one opening → candidate stays on the others (verify on the other opening). |
| M5 | Only-opening delete | Remove a candidate who is on a single opening → candidate fully removed. |

### Email
| # | Test | Steps → Expected |
|---|---|---|
| E1 | Draft next-round | Email page → draft generated; editable subject/body. |
| E2 | Send | Send → email delivered to candidate; state → Interview Scheduled. |
| E3 | Rejection | Choose rejection → draft → send → state → Rejected. |
| E4 | Contact us | Submit the contact form → team inbox receives it. |

### Cross-cutting
| # | Test | Steps → Expected |
|---|---|---|
| X1 | Global search (⌘K) | Search a client/opening/candidate → results navigate correctly. |
| X2 | Toasts | Success/error toasts appear for key actions. |
| X3 | Confirmations | Every delete asks to confirm first. |
| X4 | Concurrency | Load several pages quickly → no "failed to fetch" / 500s. |

## 4. Non-functional checks

- **Performance:** DB-only pages respond quickly (sub-second after warmup); AI actions
  show a loading state.
- **Error handling:** invalid inputs and backend errors surface readable messages.
- **Security:** passwords never returned; protected routes require a token; secrets not
  exposed to the frontend.

## 5. Regression checklist (before a demo)

1. Backend restarted with the latest code; `/health` returns ok.
2. Login works; dashboard loads projects + stats.
3. One full flow: create opening → upload résumés → rank → skill gap → interview prep →
   email send (state changes).
4. No red errors in the backend console during the above.

## 6. Phase-2 automated testing (planned)

- **Backend:** `pytest` unit tests for `crud`, prompt parsing, and lifecycle transitions;
  API tests with FastAPI's `TestClient` (mocking Gemini + Supabase).
- **Frontend:** component tests (Vitest + React Testing Library) and E2E (Playwright)
  for the core flows above.
- **CI:** run the suite + builds on every push.
