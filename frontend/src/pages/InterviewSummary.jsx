import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import PageContainer from "@/components/shell/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Pencil, Download, FileUp, Loader2 } from "lucide-react";
import {
  summarizeInterview,
  getStoredSummary,
  extractTranscriptPdf,
} from "@/lib/api";
import { downloadInterviewSummaryPdf } from "@/lib/pdf";
import { useToast } from "@/lib/toast";
import { DesignationBar } from "@/components/shell/doc-views";

// Verdict -> badge tone
function verdictTone(verdict) {
  if (verdict === "Strong Hire" || verdict === "Hire") return "green";
  if (verdict === "Leaning No Hire") return "amber";
  return "red";
}

// Empty state before a summary is generated.
function EmptyState() {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-card border-2 border-dashed border-border-strong bg-surface p-11 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-tile bg-hairline-2 text-ink-muted">
        <Pencil size={18} strokeWidth={2.25} />
      </div>
      <div className="mt-3 text-[14px] font-bold text-ink-muted">
        Your summary appears here
      </div>
      <div className="mt-1 text-[12.5px] font-medium text-ink-muted">
        Paste a transcript and hit summarize.
      </div>
    </div>
  );
}

// Generated summary panel.
function SummaryPanel({ summary, candidateName }) {
  const toast = useToast();
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-extrabold tracking-tight2 text-ink">
          Interview summary
        </h2>
        <Badge tone={verdictTone(summary.recommended_verdict)} dot>
          Verdict: {summary.recommended_verdict}
        </Badge>
      </div>

      <div className="mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            downloadInterviewSummaryPdf({
              candidateName: candidateName.trim(),
              summary,
            });
            toast.success("PDF downloaded");
          }}
        >
          <Download size={14} strokeWidth={2.5} />
          Download PDF
        </Button>
      </div>

      {/* Scrollable body so a long summary doesn't stretch the page. */}
      <div className="mt-1 max-h-[440px] overflow-y-auto pr-1">
        <div className="micro-label mt-4 text-green">Strengths</div>
        <div className="mt-2 flex flex-col gap-2">
          {summary.strengths.map((s, i) => (
            <div key={i} className="flex gap-2.5">
              <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-green" />
              <span className="text-[13.5px] font-medium leading-[1.5] text-ink">
                {s}
              </span>
            </div>
          ))}
          {summary.strengths.length === 0 && (
            <span className="text-[13px] font-medium text-ink-muted">
              None identified.
            </span>
          )}
        </div>

        <div className="micro-label mt-4 text-amber">Watch-outs</div>
        <div className="mt-2 flex flex-col gap-2">
          {summary.weaknesses.map((w, i) => (
            <div key={i} className="flex gap-2.5">
              <span className="mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-amber text-[10px] font-extrabold text-white">
                !
              </span>
              <span className="text-[13.5px] font-medium leading-[1.5] text-ink">
                {w}
              </span>
            </div>
          ))}
          {summary.weaknesses.length === 0 && (
            <span className="text-[13px] font-medium text-ink-muted">
              None identified.
            </span>
          )}
        </div>

        {/* Recommendation box */}
        {summary.summary && (
          <div className="mt-4 rounded-panel bg-accent-tint-gradient p-3.5 text-[13px] font-medium leading-[1.65] text-[#2b2f3a]">
            <span className="font-extrabold text-accent">Recommendation. </span>
            {summary.summary}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function InterviewSummary() {
  const { jdId } = useParams();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [transcript, setTranscript] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  // Restore the last stored summary (transcript + result) — no LLM call.
  useEffect(() => {
    let cancelled = false;
    getStoredSummary(jdId)
      .then((res) => {
        if (cancelled || !res) return;
        setSummary(res);
        setTranscript(res.transcript || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [jdId]);

  // Import a transcript PDF: backend extracts the text, we drop it into the
  // textarea — the recruiter can review/edit, then Summarize as usual.
  async function onImportPdf(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setImporting(true);
    setError("");
    try {
      const { text } = await extractTranscriptPdf(file);
      setTranscript(text);
      toast.success("Transcript imported", "Review it, then hit Summarize.");
    } catch (err) {
      const msg = err.message || "Could not read that PDF.";
      setError(msg);
      toast.error("Import failed", msg);
    } finally {
      setImporting(false);
    }
  }

  async function handleSummarize() {
    setLoading(true);
    setError("");
    try {
      // If a summary already exists, this is an explicit regenerate → force
      // a fresh call. Otherwise the backend serves cache when unchanged.
      const res = await summarizeInterview(jdId, transcript, Boolean(summary));
      setSummary(res);
      toast.success("Summary ready");
    } catch (e) {
      const msg = e.message || "Could not summarize the interview.";
      setError(msg);
      toast.error("Summary failed", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer width="summary">
      <h1 className="h1">Interview summary</h1>
      <p className="mt-2 text-[15px] font-medium text-ink-2">
        Paste the transcript or import a PDF — Hazel distills strengths,
        watch-outs, and a recommendation.
      </p>

      <div className="mt-5">
        <DesignationBar jdId={jdId} />
      </div>

      {error && (
        <div className="mt-4 rounded-panel border border-red-soft bg-red-soft px-4 py-3 text-[13px] font-medium text-red-text">
          {error}
        </div>
      )}

      <div className="mt-7 grid grid-cols-2 items-start gap-3.5 max-[820px]:grid-cols-1">
        {/* Left — transcript input */}
        <Card className="p-5">
          <label className="micro-label text-ink-muted">
            Candidate name
          </label>
          <input
            type="text"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            placeholder="e.g. Jordan Lee — used for the PDF file name"
            className="mb-4 mt-2 w-full rounded-input border border-border bg-input-surface px-[13px] py-2.5 text-[14px] font-medium text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2">
            <label className="micro-label text-ink-muted">
              Interview transcript
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={onImportPdf}
            />
            <button
              type="button"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-input border border-border bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-ink-2 transition-colors hover:bg-hairline disabled:opacity-50"
            >
              {importing ? (
                <Loader2 size={13} strokeWidth={2.5} className="animate-spin" />
              ) : (
                <FileUp size={13} strokeWidth={2.5} />
              )}
              {importing ? "Importing…" : "Import PDF"}
            </button>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the interview transcript here, or import a PDF above…"
            className="mt-2 h-[280px] w-full resize-none rounded-input border border-border bg-input-surface px-[13px] py-3 text-[14px] font-medium leading-[1.6] text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none"
          />
          <Button
            className="mt-3 w-full"
            onClick={handleSummarize}
            disabled={loading || transcript.trim() === ""}
          >
            {loading
              ? "Summarizing…"
              : summary
                ? "Regenerate summary"
                : "Summarize interview"}
          </Button>
        </Card>

        {/* Right — empty state or summary */}
        {summary ? (
          <SummaryPanel summary={summary} candidateName={candidateName} />
        ) : (
          <EmptyState />
        )}
      </div>
    </PageContainer>
  );
}
