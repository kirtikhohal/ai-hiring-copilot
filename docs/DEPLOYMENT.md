# Deployment Guide — Hazel

This guide covers running Hazel locally and deploying it for a shared/demo environment.
Hazel has three moving parts: the **backend** (FastAPI), the **frontend** (static SPA),
and the **database** (Supabase, already hosted).

---

## 1. Prerequisites

- Python 3.11+, Node.js 18+
- A Supabase project with the schema from [DATABASE.md](DATABASE.md) applied
- A Google Gemini API key (billing enabled)
- (Optional) Email provider credentials (Gmail App Password, or Brevo/SendGrid key)

---

## 2. Database (Supabase)

1. Create a Supabase project.
2. Open the **SQL Editor** and run the consolidated setup SQL in
   [DATABASE.md](DATABASE.md).
3. From **Project Settings → API**, copy:
   - Project URL → `SUPABASE_URL`
   - **service_role** key → `SUPABASE_KEY` (server-side only — never expose to the frontend)

---

## 3. Backend

### 3.1 Configure
```bash
cd backend
cp .env.example .env     # fill in real values (see README → Environment variables)
```

### 3.2 Local run (development)
```bash
python -m venv venv
venv\Scripts\activate            # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3.3 Production run
Use multiple workers behind the ASGI server (no `--reload`):
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```
Notes:
- Each worker is a separate process; the app uses **thread-local** database clients, so
  concurrency is safe within and across workers.
- Put it behind a reverse proxy (Nginx/Caddy) terminating TLS.
- Persist the `UPLOAD_DIR` folder (stored JD/résumé PDFs + avatars) on a durable volume.
- Set `FRONTEND_URL` to the deployed frontend origin (used in password-reset links).
- Tighten CORS: in `app/main.py`, replace `allow_origins=["*"]` with your frontend
  origin before any real deployment.

### 3.4 Container (optional sketch)
A minimal Dockerfile:
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

---

## 4. Frontend

### 4.1 Point it at the backend
Create `frontend/.env`:
```ini
VITE_API_URL=https://your-backend-domain
```
(Defaults to `http://127.0.0.1:8000` for local dev.)

### 4.2 Build
```bash
cd frontend
npm install
npm run build       # outputs static files to frontend/dist/
```

### 4.3 Host the static build
Serve `frontend/dist/` on any static host (Netlify, Vercel, Cloudflare Pages, S3+CDN,
or Nginx). Because it's a single-page app, configure the host to **fall back to
`index.html`** for unknown routes (client-side routing).

---

## 5. Email setup (optional but recommended for the email features)

- **SMTP (Gmail):** enable 2-Step Verification, create an **App Password**, set
  `EMAIL_PROVIDER=smtp`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`. Note: many corporate
  networks block outbound SMTP (ports 25/465/587).
- **HTTP provider (works where SMTP is blocked):** sign up for Brevo or SendGrid, verify
  a sender, create an API key, then set `EMAIL_PROVIDER=brevo` (or `sendgrid`),
  `EMAIL_FROM`, and `BREVO_API_KEY` / `SENDGRID_API_KEY`.

---

## 6. Post-deployment checklist

- [ ] `GET /health` returns `{"status":"ok"}`.
- [ ] Frontend loads and can register/login.
- [ ] Dashboard loads projects + stats (backend ↔ Supabase working).
- [ ] A JD upload parses (Gemini working).
- [ ] CORS restricted to the real frontend origin.
- [ ] `UPLOAD_DIR` is on a persistent volume.
- [ ] Secrets are set via environment, not committed.

---

## 7. Rollback

- Backend: redeploy the previous image/commit; the database schema is additive, so older
  code remains compatible in most cases.
- Frontend: redeploy the previous `dist/` build.
