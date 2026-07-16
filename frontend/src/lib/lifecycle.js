// Candidate lifecycle states + source — shared labels/tones for badges and the
// state dropdown. Keys match the backend (candidates.VALID_STATES).

export const STATES = [
  { key: "profile_imported", label: "Profile Imported", tone: "neutral" },
  { key: "ai_matching", label: "AI Matching in Progress", tone: "accent" },
  { key: "matched", label: "Matched with JD", tone: "accent" },
  { key: "shortlisted", label: "Shortlisted", tone: "accent" },
  { key: "interview_scheduled", label: "Interview Scheduled", tone: "amber" },
  { key: "selected", label: "Selected", tone: "green" },
  { key: "rejected", label: "Rejected", tone: "red" },
  { key: "on_hold", label: "On Hold", tone: "amber" },
  { key: "idle", label: "Idle / Available", tone: "neutral" },
];

const STATE_MAP = Object.fromEntries(STATES.map((s) => [s.key, s]));

export function stateLabel(key) {
  return STATE_MAP[key]?.label ?? "Profile Imported";
}
export function stateTone(key) {
  return STATE_MAP[key]?.tone ?? "neutral";
}

export const SOURCES = [
  { key: "external", label: "External" },
  { key: "internal", label: "Internal" },
];

export function sourceLabel(key) {
  return key === "internal" ? "Internal" : "External";
}
