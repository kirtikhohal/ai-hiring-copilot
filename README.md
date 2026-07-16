# Hazel — AI Hiring Copilot

A POC that helps recruiters screen candidates end-to-end: upload a job description
and a batch of resumes, then get AI ranking, skill-gap analysis, bias detection,
tailored interview prep, interview summaries, and outreach emails — organized by
client / internal projects and their job openings.

## Structure

```
backend/    FastAPI + Supabase (Postgres) + Google Gemini
frontend/   React + Vite + Tailwind
```

## Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate           # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
cp .env.example .env            # then fill in real values
uvicorn app.main:app --reload --port 8000
```

Requires a Supabase project (tables set up via the SQL run during development) and
a Google Gemini API key. See `backend/.env.example` for all settings, including
email (SMTP or the Brevo/SendGrid HTTP providers).

## Frontend

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

The frontend talks to the backend at `http://127.0.0.1:8000` by default
(override with `VITE_API_URL`).

## Notes

- `backend/.env` and `backend/uploads/` are git-ignored (secrets + candidate PII).
- Auth uses a custom `users` table with bcrypt + JWT; the Gemini/Supabase keys stay
  server-side.
