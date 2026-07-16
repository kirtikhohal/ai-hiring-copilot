// Thin fetch wrapper around the FastAPI backend. No React Query/SWR yet —
// pages call these directly and manage their own loading/error state.

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "hazel_token";

// Turn a backend-relative asset path (e.g. an avatar URL) into an absolute URL.
export function assetUrl(path) {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${API_BASE}${path}`;
}

// --- token storage (read directly from localStorage so this module stays
// decoupled from React; AuthProvider owns the lifecycle) ---
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Attach the bearer token (when present) to any header set.
function authHeaders(extra = {}) {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

async function errorMessage(response) {
  try {
    const body = await response.json();
    const detail = body?.detail;
    if (typeof detail === "string") return detail;
    // FastAPI/Pydantic 422 returns detail as a list of error objects.
    if (Array.isArray(detail) && detail.length) {
      return detail.map((e) => e.msg || "Invalid input").join("; ");
    }
  } catch {
    // not JSON — fall through
  }
  return `Request failed (${response.status})`;
}

async function request(path, { method = "GET", body, json } = {}) {
  const opts = { method, headers: authHeaders() };
  if (json !== undefined) {
    opts.headers = authHeaders({ "Content-Type": "application/json" });
    opts.body = JSON.stringify(json);
  } else if (body !== undefined) {
    // FormData — let the browser set the multipart Content-Type/boundary.
    opts.body = body;
  }
  const response = await fetch(`${API_BASE}${path}`, opts);
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json();
}

// ---- Auth / profile (raw snake_case shapes, matching the backend) ----

export function apiRegister(payload) {
  return request("/api/v1/auth/register", { method: "POST", json: payload });
}
export function apiLogin(identifier, password) {
  return request("/api/v1/auth/login", {
    method: "POST",
    json: { identifier, password },
  });
}
export function apiForgotPassword(email) {
  return request("/api/v1/auth/forgot-password", {
    method: "POST",
    json: { email },
  });
}
export function apiResetPassword(token, password) {
  return request("/api/v1/auth/reset-password", {
    method: "POST",
    json: { token, password },
  });
}
export function apiGetMe() {
  return request("/api/v1/auth/me");
}
export function apiUpdateProfile(updates) {
  return request("/api/v1/auth/profile", { method: "PATCH", json: updates });
}
export function apiUploadAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);
  return request("/api/v1/auth/avatar", { method: "POST", body: formData });
}

// GET /api/v1/stats/dashboard -> { active_projects, resumes_screened, est_hours_saved }
export function getDashboardStats() {
  return request("/api/v1/stats/dashboard");
}

// ---- JD ----

// POST /api/v1/jd/upload -> { jd_id, parsed, project, has_file }
export function uploadJD(file, projectId) {
  const formData = new FormData();
  formData.append("file", file);
  if (projectId) formData.append("project_id", projectId);
  return request("/api/v1/jd/upload", { method: "POST", body: formData });
}

// GET /api/v1/jd -> { projects: [{ jd_id, role_title, resume_count, top_score, created_at }] }
export function listJDs() {
  return request("/api/v1/jd");
}

// GET /api/v1/jd/{jd_id} -> { jd_id, parsed, project, has_file }
export function getJD(jdId) {
  return request(`/api/v1/jd/${jdId}`);
}

// Direct (unauthenticated, like the rest of the doc endpoints) file URLs for
// inline viewing (iframe) or download.
export function jdFileUrl(jdId, download = false) {
  return assetUrl(`/api/v1/jd/${jdId}/file${download ? "?download=true" : ""}`);
}
export function resumeFileUrl(resumeId, download = false) {
  return assetUrl(`/api/v1/resumes/${resumeId}/file${download ? "?download=true" : ""}`);
}

// ---- Projects (Client / Internal containers) ----

// GET /api/v1/projects -> { projects: [{ id, name, type, client_name, company_name, designations: [...] }] }
export function getProjects() {
  return request("/api/v1/projects");
}

// POST /api/v1/projects -> ProjectResponse
export function createProject({ name, type, clientName }) {
  return request("/api/v1/projects", {
    method: "POST",
    json: { name, type, client_name: clientName || "" },
  });
}

// GET /api/v1/jd/{jd_id}/bias -> { jd_id, bias_flags: [...], overall_risk }
// Cached after first run; pass refresh=true to force a fresh LLM call.
export function getBiasReport(jdId, refresh = false) {
  return request(`/api/v1/jd/${jdId}/bias${refresh ? "?refresh=true" : ""}`);
}

// ---- Resumes ----

// POST /api/v1/resumes/upload (jd_id + files[] + source) -> { jd_id, resumes: [...] }
export function uploadResumes(jdId, files, source = "external") {
  const formData = new FormData();
  formData.append("jd_id", jdId);
  formData.append("source", source);
  files.forEach((file) => formData.append("files", file));
  return request("/api/v1/resumes/upload", { method: "POST", body: formData });
}

// ---- Candidates ----

// GET /api/v1/candidates/rank/{jd_id} — read-only, no LLM calls.
export function rankCandidates(jdId) {
  return request(`/api/v1/candidates/rank/${jdId}`);
}

// POST /api/v1/candidates/rank/{jd_id} — scores unscored resumes + persists.
export function triggerRanking(jdId) {
  return request(`/api/v1/candidates/rank/${jdId}`, { method: "POST" });
}

// GET /api/v1/candidates/{resume_id}/skill-gap — cached; refresh forces a call.
export function getSkillGap(resumeId, refresh = false) {
  return request(
    `/api/v1/candidates/${resumeId}/skill-gap${refresh ? "?refresh=true" : ""}`
  );
}

// ---- Candidate lifecycle + cross-requirement mappings ----

// PATCH /api/v1/candidates/{resume_id}/state
export function setCandidateState(resumeId, state) {
  return request(`/api/v1/candidates/${resumeId}/state`, {
    method: "PATCH",
    json: { state },
  });
}

// GET /api/v1/candidates/{resume_id}/mappings -> { resume_id, candidate_name, source, associations }
export function getCandidateMappings(resumeId) {
  return request(`/api/v1/candidates/${resumeId}/mappings`);
}

// POST /api/v1/candidates/{resume_id}/mappings -> updated associations
export function addCandidateMapping(resumeId, jdId, state = "shortlisted") {
  return request(`/api/v1/candidates/${resumeId}/mappings`, {
    method: "POST",
    json: { jd_id: jdId, state },
  });
}

// PATCH /api/v1/candidates/mappings/{mapping_id}
export function setMappingState(mappingId, state) {
  return request(`/api/v1/candidates/mappings/${mappingId}`, {
    method: "PATCH",
    json: { state },
  });
}

// DELETE /api/v1/candidates/mappings/{mapping_id}
export function removeCandidateMapping(mappingId) {
  return request(`/api/v1/candidates/mappings/${mappingId}`, { method: "DELETE" });
}

// GET /api/v1/candidates/all -> { candidates: [...] } (global search directory)
export function getCandidateDirectory() {
  return request("/api/v1/candidates/all");
}

// POST /api/v1/email/send — actually sends the outreach email + advances state.
export function sendCandidateEmail({ jdId, resumeId, decision, subject, body }) {
  return request("/api/v1/email/send", {
    method: "POST",
    json: { jd_id: jdId, resume_id: resumeId, decision, subject, body },
  });
}

// POST /api/v1/contact — sends a contact-us message to the team inbox.
export function submitContact({ topic, email, message }) {
  return request("/api/v1/contact", {
    method: "POST",
    json: { topic, email, message },
  });
}

// ---- Interview & email ----

// POST /api/v1/interview/questions — cached; refresh forces a fresh call.
export function generateInterviewQuestions(jdId, resumeId, refresh = false) {
  return request(`/api/v1/interview/questions${refresh ? "?refresh=true" : ""}`, {
    method: "POST",
    json: { jd_id: jdId, resume_id: resumeId },
  });
}

// GET /api/v1/interview/summary/{jd_id} -> last stored summary or null (no LLM).
export function getStoredSummary(jdId) {
  return request(`/api/v1/interview/summary/${jdId}`);
}

// POST /api/v1/interview/transcript/extract — pulls raw text out of a
// transcript PDF so it can be summarized like a pasted transcript.
export function extractTranscriptPdf(file) {
  const formData = new FormData();
  formData.append("file", file);
  return request("/api/v1/interview/transcript/extract", {
    method: "POST",
    body: formData,
  });
}

// POST /api/v1/interview/summary — returns cached if the transcript is
// unchanged; refresh forces a fresh call.
export function summarizeInterview(jdId, transcript, refresh = false) {
  return request(`/api/v1/interview/summary${refresh ? "?refresh=true" : ""}`, {
    method: "POST",
    json: { jd_id: jdId, transcript },
  });
}

// POST /api/v1/email/draft — cached per decision; refresh forces a fresh call.
// decision: "next_round" | "rejection"
export function draftEmail(jdId, resumeId, decision, refresh = false) {
  return request(`/api/v1/email/draft${refresh ? "?refresh=true" : ""}`, {
    method: "POST",
    json: { jd_id: jdId, resume_id: resumeId, decision },
  });
}
