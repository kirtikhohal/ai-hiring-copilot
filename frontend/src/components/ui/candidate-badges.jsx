import { cn } from "@/lib/utils";
import { stateLabel, stateTone, sourceLabel } from "@/lib/lifecycle";

const TONE_CLASS = {
  neutral: "bg-hairline-2 text-ink-2",
  accent: "bg-accent-soft text-accent",
  amber: "bg-amber-soft text-amber-text",
  green: "bg-green-soft text-green-text",
  red: "bg-red-soft text-red-text",
};

export function Pill({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold",
        TONE_CLASS[tone] ?? TONE_CLASS.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

// Lifecycle state badge (Shortlisted, Selected, …)
export function StateBadge({ state, className = "" }) {
  return (
    <Pill tone={stateTone(state)} className={className}>
      {stateLabel(state)}
    </Pill>
  );
}

// Internal / External source badge
export function SourceBadge({ source, className = "" }) {
  const internal = source === "internal";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold",
        internal
          ? "bg-accent-soft text-accent"
          : "border border-border-strong bg-white text-ink-2",
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", internal ? "bg-accent" : "bg-ink-faint")}
      />
      {sourceLabel(source)}
    </span>
  );
}

// "N openings" chip (only meaningful when a candidate is on >1 opening)
export function OpportunitiesPill({ count, className = "" }) {
  if (!count || count <= 1) return null;
  return (
    <Pill tone="accent" className={className}>
      {count} openings
    </Pill>
  );
}
