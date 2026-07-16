import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageContainer from "@/components/shell/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ScoreRing from "@/components/ui/score-ring";
import { ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { rankCandidates } from "@/lib/api";
import { initialsFromName, paletteFor, scoreBand } from "@/lib/candidates";
import { DesignationBar } from "@/components/shell/doc-views";
import { SourceBadge, StateBadge, OpportunitiesPill, Pill } from "@/components/ui/candidate-badges";

function buildDisplayCandidates(ranking) {
  return (ranking ?? []).map((r, i) => {
    const palette = paletteFor(i);
    return {
      id: r.resume_id,
      rank: i + 1,
      name: r.candidate_name || "Unknown candidate",
      subtitle: r.education || (r.years ? `${r.years} yrs experience` : ""),
      initials: initialsFromName(r.candidate_name),
      avatarBg: palette.bg,
      avatarInk: palette.ink,
      score: r.hiring_score,
      years: r.years,
      skills: r.skills ?? [],
      rationale: r.rationale,
      hasFile: r.has_file,
      source: r.source ?? "external",
      state: r.state ?? "matched",
      opportunities: r.opportunities ?? 1,
      shared: r.shared ?? false,
    };
  });
}

function Chip({ children }) {
  return (
    <span className="rounded-[7px] bg-hairline-2 px-2 py-[3px] text-[11px] font-bold text-ink-2">
      {children}
    </span>
  );
}

function Avatar({ c, size = 38 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-extrabold"
      style={{
        width: size,
        height: size,
        background: c.avatarBg,
        color: c.avatarInk,
        fontSize: Math.round(size * 0.35),
      }}
    >
      {c.initials}
    </div>
  );
}

function ViewToggle({ variant, setVariant }) {
  const opt = (key, label) => (
    <button
      onClick={() => setVariant(key)}
      className={cn(
        "rounded-[8px] px-3.5 py-[7px] text-[12.5px] font-bold transition-all",
        variant === key ? "bg-white text-ink shadow-segment" : "text-ink-2 hover:text-ink"
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="flex rounded-[10px] bg-track p-[3px]">
      {opt("A", "List")}
      {opt("B", "Cards")}
    </div>
  );
}

function ListView({ candidates, onOpen }) {
  return (
    <Card className="mt-5 overflow-hidden p-0">
      <div className="grid grid-cols-[40px_1fr_190px_120px_36px] gap-3.5 border-b border-hairline bg-surface-2 px-5 py-[11px] text-[10.5px] font-extrabold uppercase tracking-micro text-ink-faint max-[820px]:grid-cols-[40px_1fr_120px_36px]">
        <div>#</div>
        <div>Candidate</div>
        <div className="max-[820px]:hidden">Top skills</div>
        <div>Score</div>
        <div />
      </div>
      {candidates.map((c) => {
        const band = scoreBand(c.score);
        return (
          <button
            key={c.id}
            onClick={() => onOpen(c)}
            className="grid w-full grid-cols-[40px_1fr_190px_120px_36px] items-center gap-3.5 border-b border-hairline-2 px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-surface-2 max-[820px]:grid-cols-[40px_1fr_120px_36px]"
          >
            <div className="text-[13px] font-extrabold text-ink-faint">{c.rank}</div>
            <div className="flex min-w-0 items-center gap-3">
              <Avatar c={c} />
              <div className="min-w-0">
                <div className="truncate text-[14px] font-extrabold tracking-tight15 text-ink">
                  {c.name}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <SourceBadge source={c.source} />
                  <StateBadge state={c.state} />
                  {c.shared && <Pill tone="neutral">Shared</Pill>}
                  <OpportunitiesPill count={c.opportunities} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 max-[820px]:hidden">
              {c.skills.slice(0, 3).map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
            <div className="flex items-center gap-2.5">
              <ScoreRing score={c.score} size={34} />
              <span className="text-[11px] font-extrabold" style={{ color: band.color }}>
                {band.label}
              </span>
            </div>
            <ChevronRight size={18} className="justify-self-end text-ink-faint-2" />
          </button>
        );
      })}
    </Card>
  );
}

function CardView({ candidates, onOpen }) {
  return (
    <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-3.5">
      {candidates.map((c) => {
        const band = scoreBand(c.score);
        return (
          <Card
            key={c.id}
            onClick={() => onOpen(c)}
            className="relative cursor-pointer p-[18px] transition-all duration-200 hover:-translate-y-[3px] hover:shadow-lift"
          >
            <span className="absolute right-3.5 top-3.5 text-[11px] font-extrabold text-ink-faint-2">
              #{c.rank}
            </span>
            <div className="flex items-center gap-3">
              <Avatar c={c} size={44} />
              <div className="min-w-0">
                <div className="truncate text-[14.5px] font-extrabold tracking-tight15 text-ink">
                  {c.name}
                </div>
                <div className="truncate text-[12px] font-medium text-ink-muted">{c.subtitle}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <SourceBadge source={c.source} />
              <StateBadge state={c.state} />
              {c.shared && <Pill tone="neutral">Shared</Pill>}
              <OpportunitiesPill count={c.opportunities} />
            </div>
            <div className="my-4 flex items-center gap-3">
              <ScoreRing score={c.score} size={50} />
              <div>
                <div className="text-[12.5px] font-extrabold" style={{ color: band.color }}>
                  {band.label}
                </div>
                {c.years != null && (
                  <div className="text-[11.5px] font-medium text-ink-muted">
                    {c.years} yrs experience
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {c.skills.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default function Ranked() {
  const navigate = useNavigate();
  const { jdId } = useParams();
  const { state } = useLocation();
  const [variant, setVariant] = useState("A");
  const [ranking, setRanking] = useState(state?.ranking ?? null);
  const [loading, setLoading] = useState(!state?.ranking);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all"); // all | internal | external

  useEffect(() => {
    if (ranking) return;
    let cancelled = false;
    rankCandidates(jdId)
      .then((res) => {
        if (!cancelled) setRanking(res.ranked_candidates);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Could not load rankings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jdId, ranking]);

  const onOpen = (c) =>
    navigate(ROUTES.candidate(jdId, c.id), {
      state: { candidate: c, roleTitle: state?.roleTitle },
    });

  if (loading) {
    return (
      <PageContainer width="wide">
        <DesignationBar jdId={jdId} />
        <p className="text-[14px] font-medium text-ink-2">Loading ranked candidates…</p>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer width="wide">
        <DesignationBar jdId={jdId} />
        <div className="rounded-panel border border-red-soft bg-red-soft px-4 py-3 text-[13px] font-medium text-red-text">
          {error}
        </div>
        <Button className="mt-4" onClick={() => navigate(ROUTES.resumes(jdId))}>
          Back to resumes
        </Button>
      </PageContainer>
    );
  }

  const all = buildDisplayCandidates(ranking);
  const q = filter.trim().toLowerCase();
  const candidates = all
    .filter((c) => sourceFilter === "all" || c.source === sourceFilter)
    .filter((c) => !q || c.name.toLowerCase().includes(q));

  return (
    <PageContainer width="wide">
      <DesignationBar jdId={jdId} />
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="h1">Ranked candidates</h1>
          <p className="mt-1.5 text-[14px] font-medium text-ink-2">
            {all.length} resume{all.length === 1 ? "" : "s"} scored against the JD · ordered
            best-fit first.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex rounded-[10px] bg-track p-[3px]">
            {[
              { key: "all", label: "All" },
              { key: "internal", label: "Internal" },
              { key: "external", label: "External" },
            ].map((o) => (
              <button
                key={o.key}
                onClick={() => setSourceFilter(o.key)}
                className={cn(
                  "rounded-[8px] px-3 py-[7px] text-[12px] font-bold transition-all",
                  sourceFilter === o.key ? "bg-white text-ink shadow-segment" : "text-ink-2 hover:text-ink"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="flex w-[180px] items-center gap-2 rounded-[10px] border-[1.5px] border-border-strong bg-white px-3 py-2 focus-within:border-accent">
            <Search size={13} strokeWidth={2.4} className="shrink-0 text-ink-muted" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name…"
              className="w-full border-0 bg-transparent p-0 text-[12.5px] font-medium text-ink placeholder:text-ink-faint focus:outline-none focus:ring-0"
              style={{ boxShadow: "none" }}
            />
          </div>
          <ViewToggle variant={variant} setVariant={setVariant} />
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-border-strong bg-surface-2 px-4 py-10 text-center text-[13.5px] font-medium text-ink-muted">
          {all.length === 0 ? "No candidates scored yet." : "No candidates match your filters."}
        </div>
      ) : variant === "A" ? (
        <ListView candidates={candidates} onOpen={onOpen} />
      ) : (
        <CardView candidates={candidates} onOpen={onOpen} />
      )}
    </PageContainer>
  );
}
