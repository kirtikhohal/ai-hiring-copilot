import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/shell/PageContainer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { getProjects } from "@/lib/api";
import { useToast } from "@/lib/toast";

function initials(title) {
  if (!title) return "?";
  return title.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function OpeningRow({ d, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[12px] border border-hairline bg-surface px-3.5 py-3 text-left transition-all duration-150 hover:-translate-y-[2px] hover:border-border-strong hover:shadow-lift"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-[11.5px] font-extrabold text-accent">
        {initials(d.role_title)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold tracking-tight2 text-ink">{d.role_title}</div>
        <div className="mt-0.5 text-[12px] font-medium text-ink-muted">
          {d.resume_count} candidate{d.resume_count === 1 ? "" : "s"}
          {d.top_score != null ? ` · top score ${d.top_score}` : ""}
          {d.shortlisted > 0 ? ` · ${d.shortlisted} shortlisted` : ""}
        </div>
      </div>
      <Badge tone={d.top_score != null ? "green" : "neutral"} dot className="shrink-0">
        {d.top_score != null ? "Ranked" : "Open"}
      </Badge>
    </button>
  );
}

function ProjectCard({ project, expanded, onToggle, navigate }) {
  const count = project.designations.length;
  return (
    <Card className="animate-slide-up overflow-hidden p-0">
      <button onClick={onToggle} className="flex w-full items-center gap-3.5 p-4 text-left">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-accent-soft text-accent">
          <Building2 size={19} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[15px] font-extrabold tracking-tight15 text-ink">
              {project.name}
            </span>
            <span className="shrink-0 rounded-[6px] bg-accent-soft px-[7px] py-0.5 text-[10px] font-extrabold uppercase tracking-[.08em] text-accent">
              Internal
            </span>
          </div>
          <div className="mt-0.5 truncate text-[12.5px] font-medium text-ink-muted">
            {[project.company_name, `${count} job opening${count === 1 ? "" : "s"}`]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <ChevronRight
          size={18}
          strokeWidth={2.5}
          className={cn("shrink-0 text-ink-faint transition-transform duration-200", expanded && "rotate-90")}
        />
      </button>
      {expanded && (
        <div className="flex flex-col gap-2.5 border-t border-hairline bg-surface-2 p-4">
          {count === 0 && (
            <div className="text-[13px] font-medium text-ink-muted">No job openings yet.</div>
          )}
          {project.designations.map((d) => (
            <OpeningRow
              key={d.jd_id}
              d={d}
              onClick={() => navigate(ROUTES.ranked(d.jd_id), { state: { roleTitle: d.role_title } })}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

export default function Internal() {
  const navigate = useNavigate();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProjects()
      .then((res) => {
        if (cancelled) return;
        setProjects(res.projects);
        const first = res.projects.find((p) => p.type === "internal");
        if (first) setExpanded({ [first.id]: true });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "Could not load internal projects.");
        toast.error("Couldn't load internal projects", e.message || "");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const internal = useMemo(() => projects.filter((p) => p.type === "internal"), [projects]);
  const totalOpenings = internal.reduce((n, p) => n + p.designations.length, 0);

  return (
    <PageContainer>
      <h1 className="h1">Internal projects</h1>
      <p className="mt-1.5 text-[14px] font-medium text-ink-2">
        Hiring for your own organization — openings grouped by internal project.
      </p>

      <div className="mb-3 mt-7 flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold tracking-tight2 text-ink">
          {internal.length} internal project{internal.length === 1 ? "" : "s"}
        </h2>
        <span className="text-[12.5px] font-semibold text-ink-muted">
          {totalOpenings} active job opening{totalOpenings === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <div className="mb-3.5 rounded-panel border border-red-soft bg-red-soft px-4 py-3 text-[13px] font-medium text-red-text">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {loading && (
          <div className="text-[13px] font-medium text-ink-muted">Loading internal projects…</div>
        )}

        {!loading &&
          internal.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              expanded={!!expanded[p.id]}
              onToggle={() => setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))}
              navigate={navigate}
            />
          ))}

        {!loading && internal.length === 0 && !error && (
          <div className="rounded-card border border-dashed border-border-strong bg-surface-2 px-4 py-10 text-center text-[13.5px] font-medium text-ink-muted">
            No internal projects yet. Create one from the dashboard (choose “Internal project”).
          </div>
        )}
      </div>
    </PageContainer>
  );
}
