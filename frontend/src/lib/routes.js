// Path patterns for router registration (react-router dynamic segments).
export const ROUTE_PATTERNS = {
  dashboard: "/",
  jd: "/project/new",
  resumes: "/project/:jdId/resumes",
  processing: "/project/:jdId/processing",
  ranked: "/project/:jdId/candidates",
  candidate: "/project/:jdId/candidates/:candidateId",
  prep: "/project/:jdId/candidates/:candidateId/prep",
  email: "/project/:jdId/candidates/:candidateId/email",
  summary: "/project/:jdId/summary",
  profile: "/profile",
  contact: "/contact",
  clients: "/clients",
  internal: "/internal",
};

// Path builders. jd_id comes from the backend (POST /api/v1/jd/upload) and
// candidateId is a real resume_id, so candidate-scoped routes require both.
export const ROUTES = {
  dashboard: ROUTE_PATTERNS.dashboard,
  jd: ROUTE_PATTERNS.jd,
  resumes: (jdId) => `/project/${jdId}/resumes`,
  processing: (jdId) => `/project/${jdId}/processing`,
  ranked: (jdId) => `/project/${jdId}/candidates`,
  candidate: (jdId, candidateId) => `/project/${jdId}/candidates/${candidateId}`,
  prep: (jdId, candidateId) => `/project/${jdId}/candidates/${candidateId}/prep`,
  email: (jdId, candidateId) => `/project/${jdId}/candidates/${candidateId}/email`,
  summary: (jdId) => `/project/${jdId}/summary`,
  profile: ROUTE_PATTERNS.profile,
  contact: ROUTE_PATTERNS.contact,
  clients: ROUTE_PATTERNS.clients,
  internal: ROUTE_PATTERNS.internal,
  register: "/register",
  login: "/login",
  forgot: "/forgot-password",
};

// Sidebar "CURRENT PROJECT" nav items, in happy-path order. Interview prep
// and Emails are per-candidate; from the sidebar they target the top-ranked
// candidate (`candidateId`). Before any candidate is ranked, they fall back to
// the Candidates list so the recruiter picks one there.
export function getProjectNav(jdId, candidateId) {
  const prepTo = candidateId ? ROUTES.prep(jdId, candidateId) : ROUTES.ranked(jdId);
  const emailTo = candidateId ? ROUTES.email(jdId, candidateId) : ROUTES.ranked(jdId);
  return [
    { key: "jd", label: "Job Opening", to: ROUTES.jd },
    { key: "resumes", label: "Resumes", to: ROUTES.resumes(jdId) },
    { key: "ranked", label: "Candidates", to: ROUTES.ranked(jdId) },
    { key: "prep", label: "Interview prep", to: prepTo },
    { key: "email", label: "Emails", to: emailTo },
    { key: "summary", label: "Summary", to: ROUTES.summary(jdId) },
  ];
}

// Breadcrumb label for the final crumb, per screen key.
export const CRUMB_LABEL = {
  dashboard: "Dashboard",
  jd: "Job Opening",
  resumes: "Resumes",
  processing: "Processing",
  ranked: "Candidates",
  candidate: "Candidate detail",
  prep: "Interview prep",
  email: "Emails",
  summary: "Interview summary",
  profile: "Profile",
  contact: "Contact us",
  clients: "Clients",
  internal: "Internal projects",
};
