import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// 3-step progress header for the create flow: Job Opening → Resumes → Screening.
// `current` is 1-based; steps before it render as done (green ✓).
const STEPS = ["Job Opening", "Resumes", "Screening"];

export default function Stepper({ current = 1 }) {
  return (
    <div className="mb-8 flex items-center">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={label} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? "1 1 0%" : "0 0 auto" }}>
            <div className="flex shrink-0 items-center gap-2.5">
              <span
                className={cn(
                  "flex h-[26px] w-[26px] items-center justify-center rounded-full text-[12px] font-extrabold",
                  active && "bg-accent-gradient text-white shadow-[0_4px_12px_rgba(99,102,241,.35)]",
                  done && "bg-green-soft text-green",
                  !active && !done && "bg-hairline text-ink-muted"
                )}
              >
                {done ? <Check size={13} strokeWidth={3} /> : n}
              </span>
              <span
                className={cn(
                  "text-[13px]",
                  active ? "font-extrabold text-ink" : "font-bold text-ink-muted"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-3.5 h-0.5 flex-1 rounded-full",
                  n < current ? "bg-green/35" : "bg-border-strong"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
