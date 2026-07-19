# Troubleshooting Guide — Hazel

Practical fixes for the issues you're most likely to hit. Items are grouped by symptom.

---

## Dashboard / general

### "Failed to fetch", 404s, or blank stats after a code change
**Cause:** the running backend process is stale (old code) — most often after pulling new
endpoints without restarting, or a zombie process holding the port.
**Fix:**
1. Stop the backend (Ctrl+C). On Windows, if it still seems to run:
   ```powershell
   Get-Process python | Stop-Process -Force
   ```
2. Restart: `uvicorn app.main:app --reload --port 8000`.
3. Verify at `http://127.0.0.1:8000/docs` that the expected routes are listed.
4. Hard-refresh the browser (Ctrl+Shift+R).

### Intermittent 500s / `httpx.ReadError [WinError 10035]` in the backend console
**Cause:** concurrent requests sharing one database connection (an earlier bug).
**Status:** **fixed** — the backend now uses a **thread-local** Supabase client and a
persistent parallel-query pool. If you still see it, ensure you're on the latest code and
restart the backend.

### First request is slow (several seconds), then fast
**Cause:** Supabase free-tier cold start and the initial TLS handshake.
**Fix:** expected; subsequent requests are fast. Keep the project warm by using it, or
upgrade the Supabase plan.

### DB pages feel slow in general
- Confirm you're on the latest backend (parallelised queries, no N+1, no sidebar ranking
  fetch on every page).
- Network latency to Supabase is the floor (~300 ms/round-trip); a closer region or a
  less restrictive network helps.

---

## Accounts & auth

### Can't log in
- Use the exact email **or** username you registered with. Passwords are case-sensitive.
- If unsure, use **Forgot password** to reset.

### Reset link doesn't work
- Links expire after 30 minutes — request a new one.
- The link points at `FRONTEND_URL`; make sure that env var matches where the frontend
  actually runs (e.g., `http://localhost:5173`).

### Registration fails
- Username/email must be unique. Password must be at least 8 characters.

---

## Job openings & résumés

### JD upload fails or parses oddly
- Only **PDF** files are supported; ensure the PDF has selectable text (scanned/image PDFs
  extract poorly).
- If parsing returns an error, try re-uploading; check the backend console for the Gemini
  error detail.

### Bias scan says "re-upload the JD"
- The opening predates raw-text storage. Re-upload the JD so its text is stored.

### Server-folder import: "No folder found at …"
- The folder must be `RESUME_BASE_PATH/<Job Opening role>/<Internal|External>`.
- The role folder name must match the opening's parsed **role title** exactly.
- Confirm `RESUME_BASE_PATH` is set in the backend `.env` and the backend was restarted.

### Only some résumés imported
- Batch runs are capped at **20** per run (synchronous AI parsing). Unreadable/scanned
  PDFs are skipped.

---

## AI features

### AI is slow
- AI calls (parsing, ranking, questions, summary, email) take a few seconds each — this
  is expected. Results are cached, so repeat views are instant.

### "LLM returned an unparseable response"
- A transient model hiccup. Click **Regenerate/Refresh**. Persistent failures usually
  mean the `GEMINI_API_KEY` is missing/invalid or billing isn't enabled.

---

## Email

### Nothing sends; response mentions a timeout
**Cause:** your network blocks outbound **SMTP** (common on corporate networks — ports
25/465/587 time out).
**Fixes (pick one):**
- Run the backend on a **non-corporate network** (home Wi-Fi / hotspot) and keep
  `EMAIL_PROVIDER=smtp` with your Gmail App Password.
- Switch to an **HTTP email provider** (works over port 443): set `EMAIL_PROVIDER=brevo`
  (or `sendgrid`), verify a sender, and add `BREVO_API_KEY` / `SENDGRID_API_KEY` +
  `EMAIL_FROM`. Restart the backend.

### "Email is not configured"
- Set the credentials for the chosen `EMAIL_PROVIDER` in `.env` and restart.

### Gmail rejects the login
- Use a **Gmail App Password** (requires 2-Step Verification), not your normal password.
  Paste it without spaces.

### Candidate email says "no email address"
- The email is sent to the address parsed from the résumé; if the résumé had none, add it
  or contact the candidate another way.

---

## Frontend / build

### UI didn't pick up new styling
- Restart the Vite dev server (`npm run dev`) after changes to `tailwind.config.js`, then
  hard-refresh.

### CORS errors in the browser console
- Ensure the frontend's `VITE_API_URL` points at the backend, and the backend CORS allows
  that origin (`allow_origins` in `app/main.py`).

---

## Still stuck?

Check the **backend console** — most failures print a specific reason there (Gemini
error, Supabase error, email error). That message is the fastest path to the fix.
