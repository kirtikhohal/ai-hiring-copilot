# User Guide — Hazel

A step-by-step guide for recruiters using Hazel. No technical knowledge required.

---

## 1. Getting started

1. **Create an account** — on the sign-up screen, enter your name, username, work email,
   position, organization, and pick your country then city from the dropdowns. Click
   **Create account**.
2. **Sign in** with your email/username and password.
3. Forgot your password? Click **Forgot password?**, enter your email, and follow the
   link we send you to set a new one.

---

## 2. The workspace at a glance

- **Sidebar (left):** Dashboard, Clients, Internal projects, Contact us, and — when
  you're inside a project — the steps for the current job opening.
- **Top bar:** breadcrumb, a **search** box (press **⌘K / Ctrl+K** anywhere), and your
  **avatar menu** (profile, contact, sign out).
- **Dashboard:** your projects, each expandable into its job openings, plus headline
  stats.

---

## 3. Set up a project and a job opening

1. On the **Dashboard**, click **New project**.
2. Choose **Client** (for an external client — enter the client name) or **Internal**
   (for your own org), give it a name, and create it.
3. Expand the project and click **+ Add job opening**.
4. **Upload the job description PDF.** Hazel reads it and shows the role, required skills,
   and experience. You can **View JD** or **Download** it anytime.
5. Click **Continue to résumés**.

---

## 4. Add candidates (résumés)

On the résumés step, pick **Candidate source** (Internal or External), then one of three
upload methods:

- **Individual files** — drag in or browse for PDF résumés.
- **ZIP folder** — upload one ZIP containing the résumés.
- **Server folder** — Hazel fetches résumés straight from a preconfigured folder on the
  server at `…/<Job Opening>/<Internal|External>` (best for large batches).

Click **Screen candidates** (or **Fetch & screen**). Hazel parses each résumé and scores
it against the job description.

> Up to 20 résumés are processed per run in this version.

---

## 5. Review the ranked candidates

- Candidates are ordered best-fit first, each with a **0–100 score** and a colour band
  (Strong / Good / Partial).
- Switch between **List** and **Cards**, and **filter by name** or by **source**
  (All / Internal / External).
- Each candidate shows badges for **source**, **lifecycle state**, and — if they're on
  more than one opening — how many.
- Click a candidate to open their detail page.

---

## 6. Work a candidate

On the candidate page you'll find:

- **Header** — name, match band, score, and quick actions: **Draft email**,
  **Interview prep**, and a **remove** (trash) action.
- **Skill gap analysis** — matched skills (left) vs. gaps (right); Required skills are
  emphasised.
- **Bias detection** — any non-inclusive language in the JD, with suggested fixes.
- **Opportunities** — every job opening this candidate is being considered for. Click
  another to jump to it, change the state per opening, or **Add to opening** to consider
  them for another role (they'll be re-scored for it).
- **View / download** the candidate's résumé and the JD anytime.

### Change a candidate's status
Use the state dropdown (per opening): Profile Imported → AI Matching → Matched →
Shortlisted → Interview Scheduled → Selected / Rejected / On Hold / Idle.

---

## 7. Interview prep

From a candidate, open **Interview prep** to get AI-generated **technical** and
**behavioural** questions tailored to their résumé and the JD. Click **Download PDF** to
save them. Use **Regenerate** for a fresh set.

---

## 8. Interview summary

Go to **Summary** for the opening. Either **paste the interview transcript** or
**import a transcript PDF**, then click **Summarize**. Hazel produces **strengths**,
**watch-outs**, and a **recommended verdict**. **Download PDF** to save it.

---

## 9. Send an outreach email

From a candidate, open **Draft email**:

1. Choose **Move to next round** or **Send rejection**.
2. Hazel drafts a personalised email — **edit** the subject/body as you like.
3. Click **Copy** to copy it, or **Send email** to send it directly.
4. Sending automatically updates the candidate's status (Interview Scheduled or
   Rejected).

---

## 10. Client & internal views

- **Clients** (sidebar) — see each client and how many active openings they have; expand
  to jump into an opening.
- **Internal** (sidebar) — the same for your internal projects.

---

## 11. Search

Press **⌘K / Ctrl+K** (or click the search bar) to instantly find any **client**,
**job opening**, or **candidate**, and jump straight to it.

---

## 12. Deleting things

Trash icons appear on projects, job openings, and candidates. Every delete asks you to
**confirm** first.

- Deleting a **project** removes its openings and candidates.
- Deleting a **job opening** removes its candidates.
- Deleting a **candidate** from an opening removes them from **that opening only** — they
  stay on any other openings they're on. (If it's their only opening, they're removed
  entirely.)

---

## 13. Contact & profile

- **Contact us** (sidebar) — send feedback or report an issue to the team.
- **Profile** (avatar menu) — update your details and upload a photo.

---

## 14. Tips

- AI results are saved, so revisiting a page is instant and doesn't re-run the AI. Use
  **Regenerate / Refresh** when you want a fresh result.
- The first request after the app has been idle can be a little slow (the database is
  waking up); it speeds up right after.
