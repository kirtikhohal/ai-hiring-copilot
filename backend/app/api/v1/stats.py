from fastapi import APIRouter

from app.db import crud
from app.models.schemas import DashboardStats

router = APIRouter()

# Estimated manual time Hazel saves, used for the "hours saved" headline stat.
# Rough, defensible baselines a recruiter would recognize:
#   - reading one resume and matching it against a JD by hand ≈ 15 min
#   - per project: JD analysis, bias review, and interview-prep scaffolding
#     the tool now automates ≈ 20 min
MINUTES_SAVED_PER_RESUME = 15
MINUTES_SAVED_PER_PROJECT = 20


@router.get("/dashboard", response_model=DashboardStats)
def dashboard_stats():
    projects = crud.count_projects()
    resumes = crud.count_resumes()
    minutes = resumes * MINUTES_SAVED_PER_RESUME + projects * MINUTES_SAVED_PER_PROJECT
    return DashboardStats(
        active_projects=projects,
        resumes_screened=resumes,
        est_hours_saved=round(minutes / 60),
    )
