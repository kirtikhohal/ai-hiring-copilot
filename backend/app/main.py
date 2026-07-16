import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1 import jd, resumes, candidates, interview, email, auth, stats, projects, contact
from app.config import settings

app = FastAPI(title="AI Hiring Copilot", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # POC only — tighten before anything resembling prod
    # Auth is a Bearer header (not cookies), so credentials must be off —
    # "*" origin + allow_credentials=True is an invalid combo browsers reject.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(jd.router, prefix="/api/v1/jd", tags=["Job Description"])
app.include_router(resumes.router, prefix="/api/v1/resumes", tags=["Resumes"])
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["Candidates"])
app.include_router(interview.router, prefix="/api/v1/interview", tags=["Interview"])
app.include_router(email.router, prefix="/api/v1/email", tags=["Email"])
app.include_router(contact.router, prefix="/api/v1/contact", tags=["Contact"])
app.include_router(stats.router, prefix="/api/v1/stats", tags=["Stats"])

# Serve uploaded avatars. Only the avatars subdir is exposed (not the whole
# uploads/ dir, which also holds resume/JD PDFs).
_avatar_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
os.makedirs(_avatar_dir, exist_ok=True)
app.mount("/uploads/avatars", StaticFiles(directory=_avatar_dir), name="avatars")


@app.get("/health")
def health_check():
    return {"status": "ok"}
