import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "@/components/shell/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { draftEmail, sendCandidateEmail } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { DesignationBar, ResumeViewButton } from "@/components/shell/doc-views";

// UI type -> backend decision value
const DECISIONS = { advance: "next_round", reject: "rejection" };

// One type-toggle card with a status dot (green advance / red reject).
function TypeButton({ active, type, title, subtitle, onClick }) {
  const selected =
    type === "advance" ? "border-accent bg-accent-soft" : "border-red bg-red-soft";
  const selectedTitle = type === "advance" ? "text-accent" : "text-red-text";
  const dot = type === "advance" ? "bg-green" : "bg-red";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-panel border-[1.5px] p-3.5 text-left transition-all",
        active ? selected : "border-border bg-white hover:border-accent-border"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        <div className={cn("text-[14px] font-extrabold tracking-tight15", active ? selectedTitle : "text-ink")}>
          {title}
        </div>
      </div>
      <div className="mt-1 text-[12px] font-medium text-ink-muted">{subtitle}</div>
    </button>
  );
}

export default function EmailDraft() {
  const navigate = useNavigate();
  const { jdId, candidateId } = useParams();
  const toast = useToast();
  const [emailType, setEmailType] = useState("advance"); // 'advance' | 'reject'
  const [drafts, setDrafts] = useState({}); // cached per type
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [sending, setSending] = useState(false);

  // Generate the draft for the selected type (cached so toggling back is free).
  useEffect(() => {
    if (drafts[emailType]) return;
    let cancelled = false;
    setError("");
    draftEmail(jdId, candidateId, DECISIONS[emailType])
      .then((res) => {
        if (!cancelled) setDrafts((prev) => ({ ...prev, [emailType]: res }));
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Could not draft the email.");
      });
    return () => {
      cancelled = true;
    };
  }, [jdId, candidateId, emailType, drafts]);

  const draft = drafts[emailType];

  function updateDraft(field, value) {
    setDrafts((prev) => ({
      ...prev,
      [emailType]: { ...prev[emailType], [field]: value },
    }));
  }

  async function regenerate() {
    if (regenerating) return;
    setRegenerating(true);
    setError("");
    try {
      const res = await draftEmail(jdId, candidateId, DECISIONS[emailType], true);
      setDrafts((prev) => ({ ...prev, [emailType]: res }));
    } catch (e) {
      setError(e.message || "Could not regenerate the email.");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleCopy() {
    if (!draft) return;
    await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSend() {
    if (!draft || sending) return;
    setSending(true);
    try {
      const res = await sendCandidateEmail({
        jdId,
        resumeId: candidateId,
        decision: DECISIONS[emailType],
        subject: draft.subject,
        body: draft.body,
      });
      toast.success(
        res.message || "Email sent",
        emailType === "advance"
          ? "Candidate moved to Interview Scheduled."
          : "Candidate moved to Rejected."
      );
    } catch (e) {
      toast.error("Couldn't send email", e.message || "");
    } finally {
      setSending(false);
    }
  }

  return (
    <PageContainer width="form">
      <h1 className="h1">Draft an email</h1>
      <p className="mt-2 text-[15px] font-medium text-ink-2">
        One click to a personalized message. Pick an outcome — Hazel writes the
        rest, then edit it right here.
      </p>

      <div className="mt-5">
        <DesignationBar
          jdId={jdId}
          right={
            <ResumeViewButton
              resumeId={candidateId}
              candidateName={draft?.candidate_name}
            />
          }
        />
      </div>

      {/* Type toggle */}
      <div className="mt-7 flex gap-3">
        <TypeButton
          active={emailType === "advance"}
          type="advance"
          title="Move to next round"
          subtitle="Invite to a technical interview"
          onClick={() => setEmailType("advance")}
        />
        <TypeButton
          active={emailType === "reject"}
          type="reject"
          title="Send rejection"
          subtitle="Kind, respectful decline"
          onClick={() => setEmailType("reject")}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-panel border border-red-soft bg-red-soft px-4 py-3 text-[13px] font-medium text-red-text">
          {error}
        </div>
      )}

      {/* Compose window */}
      <Card className="mt-4 overflow-hidden p-0">
        {!draft && !error && (
          <div className="flex items-center gap-3 p-5">
            <Loader2 size={18} strokeWidth={2.5} className="animate-spin text-accent" />
            <span className="text-[14px] font-bold text-ink">Hazel is writing the email…</span>
          </div>
        )}

        {draft && (
          <>
            <div className="flex items-center gap-2 border-b border-hairline bg-surface-2 px-5 py-3 text-[12.5px]">
              <span className="font-bold text-ink-2">To:</span>
              <span className="rounded-full bg-hairline-2 px-2.5 py-[3px] text-[12px] font-bold text-ink">
                {draft.to_email || draft.candidate_name}
              </span>
            </div>

            <div className="p-5">
              <label className="micro-label mb-1.5 block text-ink-muted">Subject</label>
              <input
                value={draft.subject}
                onChange={(e) => updateDraft("subject", e.target.value)}
                className="w-full rounded-input border-[1.5px] border-border-strong bg-white px-[13px] py-2.5 text-[15px] font-bold text-ink transition-shadow"
              />

              <label className="micro-label mb-1.5 mt-4 block text-ink-muted">Body</label>
              <textarea
                value={draft.body}
                onChange={(e) => updateDraft("body", e.target.value)}
                className="h-[300px] w-full resize-y rounded-input border-[1.5px] border-border-strong bg-white px-[13px] py-3 text-[14px] font-medium leading-[1.75] text-[#2b2f3a] transition-shadow"
              />
              <div className="mt-1.5 text-[11.5px] font-medium text-ink-muted">
                Edit the draft directly — your changes are used when you copy or send.
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost-accent" onClick={() => navigate(ROUTES.summary(jdId))}>
          Skip to interview summary
          <ArrowRight size={16} strokeWidth={2.5} />
        </Button>
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            onClick={regenerate}
            disabled={!draft || regenerating}
          >
            <RefreshCw
              size={14}
              strokeWidth={2.5}
              className={regenerating ? "animate-spin" : ""}
            />
            {regenerating ? "Regenerating…" : "Regenerate"}
          </Button>
          <Button variant="ghost" onClick={handleCopy} disabled={!draft}>
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button onClick={handleSend} disabled={!draft || sending}>
            {sending ? "Sending…" : "Send email"}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
