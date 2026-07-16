import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageContainer from "@/components/shell/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ScoreRing from "@/components/ui/score-ring";
import { ArrowLeft, Check, ArrowRight, Loader2, RefreshCw, Mail, Plus, X, Briefcase, Building2 } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import {
  rankCandidates,
  getSkillGap,
  getBiasReport,
  getCandidateMappings,
  addCandidateMapping,
  setCandidateState,
  setMappingState,
  removeCandidateMapping,
  getProjects,
} from "@/lib/api";
import { initialsFromName, paletteFor, scoreBand } from "@/lib/candidates";
import { DesignationBar, ResumeViewButton } from "@/components/shell/doc-views";
import { SourceBadge, StateBadge } from "@/components/ui/candidate-badges";
import { STATES } from "@/lib/lifecycle";
import Modal from "@/components/ui/modal";
import { useToast } from "@/lib/toast";

// Compact lifecycle-state <select>.
function StateSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-[9px] border-[1.5px] border-border-strong bg-white px-2.5 py-1.5 text-[12px] font-bold text-ink transition-shadow disabled:opacity-50"
    >
      {STATES.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

// Modal that lists every requirement (grouped by client/project) so a
// candidate can be added to another opportunity.
function RequirementPicker({ open, onClose, excludeIds, onPick }) {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    if (!open) return;
    getProjects()
      .then((r) => setProjects(r.projects))
      .catch(() => {});
  }, [open]);

  const options = projects
    .flatMap((p) =>
      p.designations.map((d) => ({
        jdId: d.jd_id,
        role: d.role_title,
        owner: (p.type === "client" ? p.client_name : p.company_name) || p.name,
        project: p.name,
        type: p.type,
      }))
    )
    .filter((o) => !excludeIds.includes(o.jdId));

  return (
    <Modal open={open} onClose={onClose} title="Add to a job opening" subtitle="Shortlist this candidate for another open position." size="md">
      <div className="max-h-[60vh] overflow-y-auto p-4">
        {options.length === 0 ? (
          <div className="px-2 py-8 text-center text-[13px] font-medium text-ink-muted">
            No other job openings available.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {options.map((o) => (
              <button
                key={o.jdId}
                onClick={() => onPick(o.jdId)}
                className="flex items-center gap-3 rounded-[12px] border border-hairline bg-surface px-3.5 py-3 text-left transition-all hover:-translate-y-[1px] hover:border-border-strong hover:shadow-soft"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                    o.type === "client" ? "bg-terracotta-soft text-terracotta" : "bg-accent-soft text-accent"
                  }`}
                >
                  {o.type === "client" ? (
                    <Briefcase size={16} strokeWidth={2.2} />
                  ) : (
                    <Building2 size={16} strokeWidth={2.2} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-bold text-ink">{o.role}</div>
                  <div className="truncate text-[12px] font-medium text-ink-muted">
                    {o.owner} · {o.project}
                  </div>
                </div>
                <Plus size={16} strokeWidth={2.5} className="shrink-0 text-ink-faint" />
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// Required vs Preferred tag — Required is emphasized (filled), Preferred muted.
function ReqTag({ required, tone = "neutral" }) {
  if (required) {
    const cls =
      tone === "amber"
        ? "bg-amber text-white"
        : tone === "green"
          ? "bg-green text-white"
          : "bg-accent text-white";
    return (
      <span className={`rounded-chip px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] ${cls}`}>
        Required
      </span>
    );
  }
  return (
    <span className="rounded-chip border border-border bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-muted">
      Preferred
    </span>
  );
}

function MatchedRow({ skill, required }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2.5">
        <Check size={15} strokeWidth={3} className="shrink-0 text-green" />
        <span className={required ? "text-[13.5px] font-extrabold text-ink" : "text-[13.5px] font-semibold text-ink-2"}>
          {skill}
        </span>
      </div>
      <ReqTag required={required} tone="green" />
    </div>
  );
}

function GapRow({ skill, required }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[9px] px-3 py-2 ${
        required ? "bg-amber-soft ring-1 ring-amber/30" : "bg-surface-2"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-amber text-[10px] font-extrabold text-white">
          !
        </span>
        <span className={required ? "text-[13.5px] font-extrabold text-[#9a6f10]" : "text-[13.5px] font-semibold text-[#9a6f10]"}>
          {skill}
        </span>
      </div>
      <ReqTag required={required} tone="amber" />
    </div>
  );
}

function BiasCard({ tag, term, fix, why }) {
  return (
    <div className="rounded-panel border border-[#f3e8d3] bg-[#fffcf5] p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-[6px] bg-red-soft px-2 py-[3px] text-[10px] font-extrabold uppercase tracking-[0.08em] text-red-text">
          {tag}
        </span>
        <span className="text-[13px] font-bold text-red-text line-through decoration-red-text/60">
          {term}
        </span>
      </div>
      <div className="mt-1.5 flex items-start gap-1.5 text-[13px]">
        <span className="font-extrabold text-green">→</span>
        <span className="font-bold text-green-text">{fix}</span>
      </div>
      {why && (
        <div className="mt-1.5 text-[12px] font-medium leading-[1.5] text-ink-muted">{why}</div>
      )}
    </div>
  );
}

function CardLoading({ label }) {
  return (
    <div className="mt-4 flex items-center gap-2.5 text-[13px] font-medium text-ink-muted">
      <Loader2 size={16} strokeWidth={2.5} className="animate-spin text-accent" />
      {label}
    </div>
  );
}

function CardError({ message }) {
  return (
    <div className="mt-4 rounded-panel border border-amber-soft bg-amber-soft px-3.5 py-2.5 text-[12.5px] font-medium text-[#9a6f10]">
      {message}
    </div>
  );
}

function RefreshBtn({ onClick, busy }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      title="Regenerate"
      className="flex shrink-0 items-center gap-1.5 rounded-input border border-border bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-ink-2 transition-colors hover:bg-hairline disabled:opacity-50"
    >
      <RefreshCw size={13} strokeWidth={2.5} className={busy ? "animate-spin" : ""} />
      {busy ? "…" : "Refresh"}
    </button>
  );
}

const BIAS_TAG_LABELS = {
  gender: "Gendered",
  age: "Age",
  ability: "Ability",
  culture_nationality: "Culture",
  other: "Other",
};

export default function CandidateDetail() {
  const navigate = useNavigate();
  const { jdId, candidateId } = useParams();
  const { state } = useLocation();
  const toast = useToast();

  const [candidate, setCandidate] = useState(state?.candidate ?? null);
  const [gap, setGap] = useState(null);
  const [gapError, setGapError] = useState("");
  const [gapBusy, setGapBusy] = useState(false);
  const [bias, setBias] = useState(null);
  const [biasError, setBiasError] = useState("");
  const [biasBusy, setBiasBusy] = useState(false);
  const [assoc, setAssoc] = useState(null); // { source, associations: [...] }
  const [pickerOpen, setPickerOpen] = useState(false);

  function refreshAssoc() {
    return getCandidateMappings(candidateId)
      .then(setAssoc)
      .catch(() => {});
  }

  // Requirements this candidate is associated with (home + cross-mapped).
  useEffect(() => {
    let cancelled = false;
    getCandidateMappings(candidateId)
      .then((res) => !cancelled && setAssoc(res))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  const source = assoc?.source ?? candidate?.source ?? "external";
  const homeAssoc = assoc?.associations?.find((a) => a.primary);
  const homeState = homeAssoc?.state ?? candidate?.state ?? "matched";

  async function changeHomeState(next) {
    try {
      await setCandidateState(candidateId, next);
      await refreshAssoc();
      toast.success("State updated", "Candidate moved to " + next.replace(/_/g, " ") + ".");
    } catch (e) {
      toast.error("Couldn't update state", e.message || "");
    }
  }
  async function changeMappingState(mappingId, next) {
    try {
      await setMappingState(mappingId, next);
      await refreshAssoc();
    } catch (e) {
      toast.error("Couldn't update state", e.message || "");
    }
  }
  async function addToRequirement(targetJdId) {
    try {
      const res = await addCandidateMapping(candidateId, targetJdId);
      setAssoc(res);
      setPickerOpen(false);
      toast.success("Added to job opening");
    } catch (e) {
      toast.error("Couldn't add mapping", e.message || "");
    }
  }
  async function removeAssoc(mappingId) {
    try {
      await removeCandidateMapping(mappingId);
      await refreshAssoc();
      toast.success("Removed from job opening");
    } catch (e) {
      toast.error("Couldn't remove", e.message || "");
    }
  }

  // Header data for THIS opening (jdId). Rebuilt whenever the opening changes
  // — e.g. when the recruiter clicks another opportunity — so the score/rank
  // reflect the opening being viewed. Nav state gives an instant first paint.
  useEffect(() => {
    let cancelled = false;
    rankCandidates(jdId)
      .then((res) => {
        if (cancelled) return;
        const idx = res.ranked_candidates.findIndex((r) => r.resume_id === candidateId);
        if (idx === -1) return;
        const r = res.ranked_candidates[idx];
        const palette = paletteFor(idx);
        setCandidate({
          id: r.resume_id,
          rank: idx + 1,
          name: r.candidate_name || "Unknown candidate",
          initials: initialsFromName(r.candidate_name),
          avatarBg: palette.bg,
          avatarInk: palette.ink,
          score: r.hiring_score,
          rationale: r.rationale,
          hasFile: r.has_file,
          source: r.source,
          state: r.state,
        });
      })
      .catch(() => {
        // header shows placeholders; skill gap/bias below still work
      });
    return () => {
      cancelled = true;
    };
  }, [jdId, candidateId]);

  // Skill gap analysis (LLM call — takes a few seconds).
  useEffect(() => {
    let cancelled = false;
    getSkillGap(candidateId)
      .then((res) => {
        if (!cancelled) setGap(res);
      })
      .catch((e) => {
        if (!cancelled) setGapError(e.message || "Could not analyze skill gaps.");
      });
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  // Bias detection on the JD (LLM call).
  useEffect(() => {
    let cancelled = false;
    getBiasReport(jdId)
      .then((res) => {
        if (!cancelled) setBias(res);
      })
      .catch((e) => {
        if (!cancelled) setBiasError(e.message || "Could not run bias detection.");
      });
    return () => {
      cancelled = true;
    };
  }, [jdId]);

  async function refreshGap() {
    if (gapBusy) return;
    setGapBusy(true);
    setGapError("");
    try {
      setGap(await getSkillGap(candidateId, true));
    } catch (e) {
      setGapError(e.message || "Could not analyze skill gaps.");
    } finally {
      setGapBusy(false);
    }
  }

  async function refreshBias() {
    if (biasBusy) return;
    setBiasBusy(true);
    setBiasError("");
    try {
      setBias(await getBiasReport(jdId, true));
    } catch (e) {
      setBiasError(e.message || "Could not run bias detection.");
    } finally {
      setBiasBusy(false);
    }
  }

  const band = candidate ? scoreBand(candidate.score) : null;
  const matched = gap
    ? [
        ...gap.matched_required_skills.map((s) => ({ skill: s, required: true })),
        ...gap.matched_preferred_skills.map((s) => ({ skill: s, required: false })),
      ]
    : [];
  const gaps = gap
    ? [
        ...gap.missing_required_skills.map((s) => ({ skill: s, required: true })),
        ...gap.missing_preferred_skills.map((s) => ({ skill: s, required: false })),
      ]
    : [];

  return (
    <PageContainer width="wide">
      {/* Back link */}
      <button
        onClick={() => navigate(ROUTES.ranked(jdId), { state: { roleTitle: state?.roleTitle } })}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 transition-colors hover:text-accent"
      >
        <ArrowLeft size={15} strokeWidth={2.5} />
        Back to ranked list
      </button>

      {/* Project context + JD / résumé quick views */}
      <div className="mt-4">
        <DesignationBar
          jdId={jdId}
          right={
            <ResumeViewButton
              resumeId={candidateId}
              candidateName={candidate?.name}
              hasFile={candidate?.hasFile ?? true}
            />
          }
        />
      </div>

      {/* Header card — identity + score + primary actions all in one place */}
      <Card className="flex flex-wrap items-center gap-4 p-[22px]">
        <div
          className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full text-[19px] font-extrabold"
          style={{
            background: candidate?.avatarBg ?? "#e8eaf4",
            color: candidate?.avatarInk ?? "#858ca0",
          }}
        >
          {candidate?.initials ?? "…"}
        </div>

        <div className="min-w-[180px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[20px] font-extrabold tracking-h1 text-ink">
              {candidate?.name ?? "Loading candidate…"}
            </span>
            {candidate && band && (
              <Badge tone={band.tone}>
                {band.label} · Rank #{candidate.rank}
              </Badge>
            )}
            <SourceBadge source={source} />
            <StateBadge state={homeState} />
          </div>
          {candidate?.rationale && (
            <div className="mt-1 text-[13px] font-medium leading-[1.5] text-ink-2">
              {candidate.rationale}
            </div>
          )}
        </div>

        {candidate && (
          <div className="flex items-center gap-3.5">
            <div className="flex flex-col items-center gap-0.5">
              <ScoreRing score={candidate.score} size={56} />
              <div className="micro-label text-ink-muted">Score</div>
            </div>
            <div className="flex flex-col gap-2 max-[520px]:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(ROUTES.email(jdId, candidateId), {
                    state: { candidate, roleTitle: state?.roleTitle },
                  })
                }
              >
                <Mail size={15} strokeWidth={2.5} />
                Draft email
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  navigate(ROUTES.prep(jdId, candidateId), {
                    state: { candidate, roleTitle: state?.roleTitle },
                  })
                }
              >
                Interview prep
                <ArrowRight size={15} strokeWidth={2.5} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Skill gap analysis — full width, Matched (left) + Gaps (right) */}
      <Card className="mt-3.5 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-extrabold tracking-tight2 text-ink">
              Skill gap analysis
            </h2>
            <p className="mt-1 text-[13px] font-medium text-ink-2">
              Measured against the JD requirements ·
              <span className="font-bold text-ink-2"> Required</span> skills are emphasized.
            </p>
          </div>
          {gap && <RefreshBtn onClick={refreshGap} busy={gapBusy} />}
        </div>

        {!gap && !gapError && <CardLoading label="Analyzing skill gaps…" />}
        {gapError && <CardError message={gapError} />}

        {gap && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 max-[720px]:grid-cols-1">
              {/* Matched */}
              <div>
                <div className="micro-label text-green">Matched · {matched.length}</div>
                <div className="mt-2 divide-y divide-hairline">
                  {matched.map((m) => (
                    <MatchedRow key={`${m.skill}-${m.required}`} {...m} />
                  ))}
                  {matched.length === 0 && (
                    <div className="py-1.5 text-[13px] font-medium text-ink-muted">
                      No matched skills found.
                    </div>
                  )}
                </div>
              </div>

              {/* Gaps */}
              <div>
                <div className="micro-label text-amber">Gaps · {gaps.length}</div>
                <div className="mt-2 flex flex-col gap-2">
                  {gaps.map((g) => (
                    <GapRow key={`${g.skill}-${g.required}`} {...g} />
                  ))}
                  {gaps.length === 0 && (
                    <div className="text-[13px] font-medium text-ink-muted">
                      No gaps — meets every listed skill.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {gap.gap_summary && (
              <div className="mt-4 rounded-panel bg-accent-tint p-3.5 text-[13px] font-medium leading-[1.6] text-ink-2">
                <span className="font-extrabold text-accent">Summary. </span>
                {gap.gap_summary}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Bias detection — full width, below skill gap */}
      <Card className="mt-3.5 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-extrabold tracking-tight2 text-ink">
              Bias detection · Job description
            </h2>
            <p className="mt-1 text-[13px] font-medium text-ink-2">
              {bias
                ? `${bias.bias_flags.length} phrase${bias.bias_flags.length === 1 ? "" : "s"} flagged · overall risk ${bias.overall_risk}.`
                : "Scanning the JD for non-inclusive language."}
            </p>
          </div>
          {bias && <RefreshBtn onClick={refreshBias} busy={biasBusy} />}
        </div>

        {!bias && !biasError && <CardLoading label="Scanning for biased language…" />}
        {biasError && <CardError message={biasError} />}

        {bias && (
          <div className="mt-4 grid grid-cols-2 gap-2.5 max-[720px]:grid-cols-1">
            {bias.bias_flags.map((b) => (
              <BiasCard
                key={b.phrase}
                tag={BIAS_TAG_LABELS[b.category] ?? b.category}
                term={b.phrase}
                fix={b.suggested_alternative}
                why={b.explanation}
              />
            ))}
            {bias.bias_flags.length === 0 && (
              <div className="col-span-2 rounded-panel border border-green-soft bg-green-soft px-3.5 py-2.5 text-[13px] font-bold text-green-text max-[720px]:col-span-1">
                No biased language detected in this JD.
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Opportunities — click another to jump to that opening's candidate view */}
      <Card className="mt-3.5 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-extrabold tracking-tight2 text-ink">Opportunities</h2>
            <p className="mt-1 text-[13px] font-medium text-ink-2">
              {assoc && assoc.associations.length > 1
                ? `Being considered for ${assoc.associations.length} openings — click one to open it.`
                : "The job opening this candidate is being considered for."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            <Plus size={14} strokeWidth={2.5} />
            Add to opening
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {(assoc?.associations ?? []).map((a) => {
            const owner = a.type === "client" ? a.client_name : a.company_name;
            const isClient = a.type === "client";
            const isCurrent = a.jd_id === jdId;
            const info = (
              <>
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                    isClient ? "bg-terracotta-soft text-terracotta" : "bg-accent-soft text-accent"
                  }`}
                >
                  {isClient ? (
                    <Briefcase size={16} strokeWidth={2.2} />
                  ) : (
                    <Building2 size={16} strokeWidth={2.2} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-bold text-ink">
                      {[owner, a.role_title].filter(Boolean).join(" · ")}
                    </span>
                    {a.primary && (
                      <span className="shrink-0 rounded-[6px] bg-hairline px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[.07em] text-ink-2">
                        Home
                      </span>
                    )}
                    {isCurrent && (
                      <span className="shrink-0 rounded-[6px] bg-accent-soft px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[.07em] text-accent">
                        Viewing
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[12px] font-medium text-ink-muted">
                    {a.project_name}
                  </div>
                </div>
              </>
            );
            return (
              <div
                key={a.jd_id}
                className={`flex flex-wrap items-center gap-3 rounded-panel border px-3.5 py-3 ${
                  isCurrent ? "border-accent-border bg-accent-tint" : "border-hairline bg-surface-2"
                }`}
              >
                {isCurrent ? (
                  <div className="flex min-w-0 flex-1 items-center gap-3">{info}</div>
                ) : (
                  <button
                    onClick={() => navigate(ROUTES.candidate(a.jd_id, candidateId))}
                    className="group flex min-w-0 flex-1 items-center gap-3 text-left"
                    title="Open this candidate under this opening"
                  >
                    {info}
                    <ArrowRight
                      size={15}
                      strokeWidth={2.5}
                      className="shrink-0 text-ink-faint transition-colors group-hover:text-accent"
                    />
                  </button>
                )}
                <StateSelect
                  value={a.state}
                  onChange={(next) =>
                    a.primary ? changeHomeState(next) : changeMappingState(a.mapping_id, next)
                  }
                />
                {!a.primary && (
                  <button
                    onClick={() => removeAssoc(a.mapping_id)}
                    title="Remove from this opening"
                    className="shrink-0 text-ink-faint transition-colors hover:text-red-text"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            );
          })}
          {!assoc && (
            <div className="text-[13px] font-medium text-ink-muted">Loading opportunities…</div>
          )}
        </div>
      </Card>

      <RequirementPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={(assoc?.associations ?? []).map((a) => a.jd_id)}
        onPick={addToRequirement}
      />
    </PageContainer>
  );
}
