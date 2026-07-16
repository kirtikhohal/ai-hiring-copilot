from typing import List, Optional
from pydantic import BaseModel, Field


# ---- Projects (the top-level Client / Internal container) ----

class ProjectCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    type: str = "client"  # "client" | "internal"
    client_name: str = ""  # required for client projects; blank for internal


class ProjectContext(BaseModel):
    """Project info attached to a JD/designation so pages can show
    'Client · Project' (or 'Company · Project' for internal)."""
    project_id: Optional[str] = None
    project_name: str = ""
    type: str = ""  # "client" | "internal" | ""
    client_name: str = ""
    company_name: str = ""


class DesignationSummary(BaseModel):
    jd_id: str
    role_title: str
    resume_count: int
    top_score: Optional[int] = None
    shortlisted: int = 0  # candidates in the 'shortlisted' state for this opening
    created_at: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str  # "" for the synthetic "Unassigned" group holding legacy JDs
    name: str
    type: str = "client"
    client_name: str = ""
    company_name: str = ""
    created_at: Optional[str] = None
    designations: List[DesignationSummary] = []


class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]


# ---- Job description (a "designation" under a project) ----

class JDParsed(BaseModel):
    role_title: str = ""
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    min_experience_years: float = 0
    education_requirements: str = ""
    key_responsibilities: List[str] = []


class JDUploadResponse(BaseModel):
    jd_id: str
    parsed: JDParsed
    project: ProjectContext = ProjectContext()
    has_file: bool = False  # whether the original JD PDF is stored/viewable


class JDSummary(BaseModel):
    jd_id: str
    role_title: str
    resume_count: int
    top_score: Optional[int] = None
    created_at: Optional[str] = None


class JDListResponse(BaseModel):
    projects: List[JDSummary]


class ResumeParsed(BaseModel):
    candidate_name: str = ""
    email: str = ""
    phone: str = ""
    total_experience_years: float = 0
    skills: List[str] = []
    education: str = ""
    work_history_summary: str = ""
    certifications: List[str] = []


class ResumeUploadResponseItem(BaseModel):
    resume_id: str
    filename: str
    parsed: ResumeParsed


class ResumeUploadResponse(BaseModel):
    jd_id: str
    resumes: List[ResumeUploadResponseItem]


class CandidateRanking(BaseModel):
    resume_id: str
    candidate_name: str
    hiring_score: int
    rationale: str
    # Enriched from the parsed resume so the ranked list renders fully without
    # depending on client-side navigation state.
    skills: List[str] = []
    years: Optional[float] = None
    education: str = ""
    has_file: bool = False  # whether the original resume PDF is stored/viewable
    source: str = "external"  # "internal" | "external"
    state: str = "profile_imported"  # lifecycle state for THIS requirement
    opportunities: int = 1  # how many requirements this candidate is on
    shared: bool = False  # True when cross-mapped in from another requirement


class RankingResponse(BaseModel):
    jd_id: str
    ranked_candidates: List[CandidateRanking]


# ---- Candidate lifecycle + cross-requirement mapping ----

class CandidateStateUpdate(BaseModel):
    state: str


class MappingCreate(BaseModel):
    jd_id: str
    state: str = "shortlisted"


class MappingStateUpdate(BaseModel):
    state: str


class RequirementAssociation(BaseModel):
    """One requirement a candidate is associated with (their home JD, or a
    cross-mapped one)."""
    mapping_id: Optional[str] = None  # None for the candidate's home requirement
    jd_id: str
    role_title: str = ""
    project_id: Optional[str] = None
    project_name: str = ""
    client_name: str = ""
    company_name: str = ""
    type: str = ""  # "client" | "internal"
    state: str = "profile_imported"
    primary: bool = False


class CandidateAssociations(BaseModel):
    resume_id: str
    candidate_name: str = ""
    source: str = "external"
    associations: List[RequirementAssociation] = []


class CandidateDirectoryItem(BaseModel):
    """Flattened candidate row for the global search / directory."""
    resume_id: str
    candidate_name: str = ""
    jd_id: str
    role_title: str = ""
    project_name: str = ""
    client_name: str = ""
    company_name: str = ""
    type: str = ""
    state: str = "profile_imported"
    source: str = "external"


class CandidateDirectoryResponse(BaseModel):
    candidates: List[CandidateDirectoryItem]


# ---- Skill gap analysis ----

class SkillGapResponse(BaseModel):
    resume_id: str
    candidate_name: str
    matched_required_skills: List[str] = []
    missing_required_skills: List[str] = []
    matched_preferred_skills: List[str] = []
    missing_preferred_skills: List[str] = []
    gap_summary: str = ""


# ---- Bias detection ----

class BiasFlag(BaseModel):
    # Defaulted so a flag from the LLM that omits a field doesn't 500 the
    # response-model validation.
    phrase: str = ""
    category: str = "other"
    explanation: str = ""
    suggested_alternative: str = ""


class BiasReportResponse(BaseModel):
    jd_id: str
    bias_flags: List[BiasFlag] = []
    overall_risk: str = "low"


# ---- Interview questions ----

class TechnicalQuestion(BaseModel):
    question: str
    targets_skill: str = ""


class BehavioralQuestion(BaseModel):
    question: str
    focus_area: str = ""


class InterviewQuestionsRequest(BaseModel):
    jd_id: str
    resume_id: str


class InterviewQuestionsResponse(BaseModel):
    resume_id: str
    candidate_name: str
    technical_questions: List[TechnicalQuestion] = []
    behavioral_questions: List[BehavioralQuestion] = []


# ---- Interview summary ----

class InterviewSummaryRequest(BaseModel):
    jd_id: str
    transcript: str


class InterviewSummaryResponse(BaseModel):
    strengths: List[str] = []
    weaknesses: List[str] = []
    summary: str = ""
    recommended_verdict: str = ""
    transcript: str = ""  # echoed back so the UI can restore the last run


class TranscriptExtractResponse(BaseModel):
    text: str  # raw text pulled from an uploaded transcript PDF


# ---- Email drafts ----

class EmailDraftRequest(BaseModel):
    jd_id: str
    resume_id: str
    decision: str  # "next_round" | "rejection"


class EmailDraftResponse(BaseModel):
    resume_id: str
    candidate_name: str
    to_email: str = ""
    subject: str = ""
    body: str = ""


class EmailSendRequest(BaseModel):
    jd_id: str
    resume_id: str
    decision: str  # "next_round" | "rejection"
    subject: str
    body: str


class ContactRequest(BaseModel):
    topic: str = ""
    email: str
    message: str


# ---- Auth / profile ----

class UserPublic(BaseModel):
    id: str
    full_name: str = ""
    username: str
    email: str
    position: str = ""
    org: str = ""  # organization name
    org_city: str = ""
    org_country: str = ""
    avatar_url: Optional[str] = None


class RegisterRequest(BaseModel):
    full_name: str = ""
    username: str = Field(min_length=3, max_length=40)
    email: str
    position: str = "HR Recruiter"
    org_name: str = Field(min_length=1, max_length=120)
    org_city: str = ""
    org_country: str = ""
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    identifier: str  # email OR username
    password: str


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = Field(default=None, min_length=3, max_length=40)
    email: Optional[str] = None
    position: Optional[str] = None
    org: Optional[str] = None  # organization name
    org_city: Optional[str] = None
    org_country: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8)


class MessageResponse(BaseModel):
    message: str


# ---- Dashboard stats ----

class DashboardStats(BaseModel):
    active_projects: int
    resumes_screened: int
    est_hours_saved: int