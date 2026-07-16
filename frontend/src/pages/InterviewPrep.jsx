import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageContainer from "@/components/shell/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Download, Code2, Users } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { generateInterviewQuestions, getJD } from "@/lib/api";
import { downloadInterviewPrepPdf } from "@/lib/pdf";
import { useToast } from "@/lib/toast";
import { DesignationBar, ResumeViewButton } from "@/components/shell/doc-views";

const TONES = {
  accent: {
    tile: "bg-accent-soft text-accent",
    pill: "bg-accent-soft text-accent",
    rowHover: "hover:border-accent-border hover:bg-surface-2",
  },
  terracotta: {
    tile: "bg-terracotta-soft text-terracotta",
    pill: "bg-terracotta-soft text-terracotta",
    rowHover: "hover:border-[#fbd9c8] hover:bg-[#fffbf9]",
  },
};

// One question row: bordered card with a numbered tile.
function QuestionRow({ n, text, meta, tone }) {
  const t = TONES[tone] ?? TONES.accent;
  return (
    <div
      className={`flex gap-3 rounded-[11px] border border-hairline-2 p-[11px_13px] transition-colors ${t.rowHover}`}
    >
      <div
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] text-[11px] font-extrabold ${t.tile}`}
      >
        {n}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium leading-[1.55] text-[#2b2f3a]">{text}</p>
        {meta && (
          <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
            {meta}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({ title, questions, tone, metaKey }) {
  const t = TONES[tone] ?? TONES.accent;
  const Icon = tone === "terracotta" ? Users : Code2;
  return (
    <Card className="p-[22px]">
      <div className="mb-4 flex items-center gap-2.5">
        <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-[8px] ${t.tile}`}>
          <Icon size={13} strokeWidth={2.4} />
        </span>
        <span className="text-[14px] font-extrabold tracking-tight15 text-ink">{title}</span>
        <span className={`rounded-full px-[9px] py-0.5 text-[11px] font-extrabold ${t.pill}`}>
          {questions.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <QuestionRow key={i} n={i + 1} text={q.question} meta={q[metaKey]} tone={tone} />
        ))}
      </div>
    </Card>
  );
}

export default function InterviewPrep() {
  const navigate = useNavigate();
  const { jdId, candidateId } = useParams();
  const { state } = useLocation();
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [roleTitle, setRoleTitle] = useState(state?.roleTitle ?? "");

  // Role title is needed for the PDF filename; fetch it if we arrived without
  // nav state (e.g. hard refresh).
  useEffect(() => {
    if (roleTitle) return;
    let cancelled = false;
    getJD(jdId)
      .then((jd) => {
        if (!cancelled) setRoleTitle(jd?.parsed?.role_title ?? "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [jdId, roleTitle]);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setError("");
    generateInterviewQuestions(jdId, candidateId) // cached after first run
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Could not generate questions.");
      });
    return () => {
      cancelled = true;
    };
  }, [jdId, candidateId]);

  async function regenerate() {
    if (regenerating) return;
    setRegenerating(true);
    setError("");
    try {
      const res = await generateInterviewQuestions(jdId, candidateId, true);
      setResult(res);
      toast.success("Questions regenerated");
    } catch (e) {
      const msg = e.message || "Could not regenerate questions.";
      setError(msg);
      toast.error("Regeneration failed", msg);
    } finally {
      setRegenerating(false);
    }
  }

  const candidateName =
    result?.candidate_name ?? state?.candidate?.name ?? "this candidate";

  return (
    <PageContainer width="prep">
      {/* Back link */}
      <button
        onClick={() =>
          navigate(ROUTES.candidate(jdId, candidateId), {
            state: { candidate: state?.candidate, roleTitle: state?.roleTitle },
          })
        }
        className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 transition-colors hover:text-accent"
      >
        <ArrowLeft size={15} strokeWidth={2.5} />
        Back to {candidateName}
      </button>

      <div className="mt-4">
        <DesignationBar
          jdId={jdId}
          right={
            <ResumeViewButton resumeId={candidateId} candidateName={candidateName} />
          }
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="h1">Interview prep for {candidateName}</h1>
          <p className="mt-2 text-[15px] font-medium text-ink-2">
            Tailored questions generated from the resume and JD — probing
            strengths and the flagged gaps.
          </p>
        </div>
        {result && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadInterviewPrepPdf({
                  candidateName:
                    result?.candidate_name ??
                    state?.candidate?.name ??
                    "Candidate",
                  roleTitle: roleTitle || "Interview",
                  technical: result.technical_questions,
                  behavioral: result.behavioral_questions,
                });
                toast.success("PDF downloaded");
              }}
            >
              <Download size={14} strokeWidth={2.5} />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={regenerate} disabled={regenerating}>
              <RefreshCw
                size={14}
                strokeWidth={2.5}
                className={regenerating ? "animate-spin" : ""}
              />
              {regenerating ? "Regenerating…" : "Regenerate"}
            </Button>
          </div>
        )}
      </div>

      {!result && !error && (
        <Card className="mt-7 flex items-center gap-3 p-5">
          <Loader2 size={18} strokeWidth={2.5} className="animate-spin text-accent" />
          <div>
            <div className="text-[14px] font-bold text-ink">
              Loading interview questions…
            </div>
            <div className="text-[12.5px] font-medium text-ink-muted">
              Generated once and cached — the first time can take up to a minute.
            </div>
          </div>
        </Card>
      )}

      {error && (
        <div className="mt-7 rounded-panel border border-red-soft bg-red-soft px-4 py-3 text-[13px] font-medium text-red-text">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-7 flex flex-col gap-3.5">
          <QuestionCard
            dotColor="#6366f1"
            title="Technical"
            questions={result.technical_questions}
            tone="accent"
            metaKey="targets_skill"
          />
          <QuestionCard
            dotColor="#f2683c"
            title="Behavioral"
            questions={result.behavioral_questions}
            tone="terracotta"
            metaKey="focus_area"
          />
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex justify-end">
        <Button
          disabled={!result}
          onClick={() =>
            navigate(ROUTES.email(jdId, candidateId), {
              state: { candidate: state?.candidate, roleTitle: state?.roleTitle },
            })
          }
        >
          Draft outreach email
          <ArrowRight size={16} strokeWidth={2.5} />
        </Button>
      </div>
    </PageContainer>
  );
}
