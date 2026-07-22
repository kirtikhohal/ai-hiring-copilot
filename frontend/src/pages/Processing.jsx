import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { triggerRanking } from "@/lib/api";

const PROCESSING_STEPS = [
  { label: "Extracting text from resumes", threshold: 15 },
  { label: "Parsing structured profiles", threshold: 38 },
  { label: "Matching against the job description", threshold: 60 },
  { label: "Scoring & ranking candidates", threshold: 82 },
  { label: "Analyzing skill gaps & bias", threshold: 100 },
];

function stepStatus(step, progress) {
  if (progress >= step.threshold) return "done";
  if (progress >= step.threshold - 25) return "active";
  return "pending";
}

function StepRow({ label, status }) {
  const circle =
    status === "done"
      ? "bg-green text-white"
      : status === "active"
        ? "bg-accent-soft text-accent"
        : "bg-hairline text-transparent";
  const text =
    status === "done"
      ? "text-ink font-bold"
      : status === "active"
        ? "text-accent font-bold"
        : "text-ink-faint font-medium";
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-extrabold",
          circle
        )}
      >
        {status === "done" && <Check size={12} strokeWidth={3.5} />}
      </span>
      <span className={cn("text-[13.5px] tracking-tight2", text)}>{label}</span>
    </div>
  );
}

export default function Processing() {
  const navigate = useNavigate();
  const { jdId } = useParams();
  const { state } = useLocation();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const startedRef = useRef(false);
  const tickRef = useRef(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    tickRef.current = setInterval(() => {
      setProgress((p) => (p < 92 ? p + Math.max(1, (92 - p) * 0.08) : p));
    }, 150);

    triggerRanking(jdId)
      .then((res) => {
        clearInterval(tickRef.current);
        setProgress(100);
        setTimeout(() => {
          navigate(ROUTES.ranked(jdId), {
            state: { roleTitle: state?.roleTitle, ranking: res.ranked_candidates },
          });
        }, 550);
      })
      .catch((e) => {
        clearInterval(tickRef.current);
        setError(e.message || "Something went wrong while screening candidates.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="px-9 pb-16 pt-[84px]">
        <div className="mx-auto max-w-[560px] text-center">
          <h1 className="h1">Screening failed</h1>
          <p className="mt-2 text-[14px] font-medium text-ink-2">{error}</p>
          <Button className="mt-6" onClick={() => navigate(ROUTES.resumes(jdId))}>
            Back to resumes
          </Button>
        </div>
      </div>
    );
  }

  const pct = Math.round(progress);
  const resumeCount = state?.resumes?.length ?? PROCESSING_STEPS.length;

  return (
    <div className="px-9 py-20">
      <div className="mx-auto max-w-[520px] text-center">
        {/* Spinner with % inside */}
        <div className="relative mx-auto h-[72px] w-[72px]">
          <div
            className="h-[72px] w-[72px] animate-spin-slow rounded-full border-[5px] border-accent-soft"
            style={{ borderTopColor: "#6366f1" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-accent">
            {pct}%
          </div>
        </div>

        <h1 className="mt-[26px] text-[22px] font-extrabold tracking-h1 text-ink">
          Hazel is screening your candidates
        </h1>
        <p className="mt-[7px] text-[13.5px] font-medium text-ink-2">
          This usually takes under a minute — we'll move you along automatically.
        </p>

        {/* Gradient progress bar */}
        <div className="mt-7 h-1.5 overflow-hidden rounded-lg bg-track">
          <div
            className="h-full rounded-lg bg-accent-gradient transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step checklist card */}
        <div className="mt-6 flex flex-col gap-3 rounded-card border border-border bg-surface p-5 text-left shadow-card">
          {PROCESSING_STEPS.map((step, i) => (
            <StepRow
              key={i}
              label={i === 0 ? `Extracting text from ${resumeCount} resumes` : step.label}
              status={stepStatus(step, progress)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
