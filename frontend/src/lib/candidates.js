// Presentation helpers for candidate display — the backend doesn't supply
// avatars/initials, so they're derived client-side.

export const AVATAR_PALETTE = [
  { bg: "#eeeffe", ink: "#6366f1" }, // indigo
  { bg: "#f0edfe", ink: "#8b5cf6" }, // violet
  { bg: "#e5f7ef", ink: "#0f9e6e" }, // emerald
  { bg: "#fdece4", ink: "#e0592f" }, // coral
  { bg: "#fdf3e0", ink: "#c98a16" }, // amber
];

export function initialsFromName(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function paletteFor(index) {
  return AVATAR_PALETTE[Math.abs(index) % AVATAR_PALETTE.length];
}

// Maps a 0–100 hiring score to a match band label + color.
export function scoreBand(score) {
  if (score >= 85) return { label: "Strong match", tone: "green", color: "#10b981" };
  if (score >= 72) return { label: "Good match", tone: "amber", color: "#f59e0b" };
  return { label: "Partial match", tone: "red", color: "#e5484d" };
}
