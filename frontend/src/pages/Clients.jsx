import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/shell/PageContainer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { getProjects } from "@/lib/api";
import { useToast } from "@/lib/toast";

function initials(title) {
  if (!title) return "?";
  return title.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function RequirementRow({ r, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[12px] border border-hairline bg-surface px-3.5 py-3 text-left transition-all duration-150 hover:-translate-y-[2px] hover:border-border-strong hover:shadow-lift"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-[11.5px] font-extrabold text-accent">
        {initials(r.role_title)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold tracking-tight2 text-ink">{r.role_title}</div>
        <div className="mt-0.5 text-[12px] font-medium text-ink-muted">
          {r.projectName} · {r.resume_count} candidate{r.resume_count === 1 ? "" : "s"}
        </div>
      </div>
      <Badge tone={r.top_score != null ? "green" : "neutral"} dot className="shrink-0">
        {r.top_score != null ? "Ranked" : "Open"}
      </Badge>
    </button>
  );
}

function ClientCard({ client, expanded, onToggle, navigate }) {
  return (
    <Card className="animate-slide-up overflow-hidden p-0">
      <button onClick={onToggle} className="flex w-full items-center gap-3.5 p-4 text-left">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-terracotta-soft text-terracotta">
          <Briefcase size={19} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[15px] font-extrabold tracking-tight15 text-ink">
              {client.name}
            </span>
            <span className="shrink-0 rounded-[6px] bg-terracotta-soft px-[7px] py-0.5 text-[10px] font-extrabold uppercase tracking-[.08em] text-terracotta-text">
              Client
            </span>
          </div>
          <div className="mt-0.5 truncate text-[12.5px] font-medium text-ink-muted">
            {client.requirements.length} active job opening
            {client.requirements.length === 1 ? "" : "s"} · {client.candidates} candidate
            {client.candidates === 1 ? "" : "s"}
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
          {client.requirements.length === 0 && (
            <div className="text-[13px] font-medium text-ink-muted">No job openings yet.</div>
          )}
          {client.requirements.map((r) => (
            <RequirementRow
              key={r.jd_id}
              r={r}
              onClick={() => navigate(ROUTES.ranked(r.jd_id), { state: { roleTitle: r.role_title } })}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

export default function Clients() {
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
        const firstClient = res.projects.find((p) => p.type === "client");
        const key = firstClient?.client_name || firstClient?.name;
        if (key) setExpanded({ [key]: true });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "Could not load clients.");
        toast.error("Couldn't load clients", e.message || "");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Roll up client-type projects into clients (a client may span >1 project).
  const clients = useMemo(() => {
    const map = new Map();
    for (const p of projects) {
      if (p.type !== "client") continue;
      const key = p.client_name || p.name;
      const entry = map.get(key) || { name: key, projects: 0, requirements: [], candidates: 0 };
      entry.projects += 1;
      for (const d of p.designations) {
        entry.requirements.push({ ...d, projectName: p.name });
        entry.candidates += d.resume_count;
      }
      map.set(key, entry);
    }
    return [...map.values()];
  }, [projects]);

  const totalReqs = clients.reduce((n, c) => n + c.requirements.length, 0);

  return (
    <PageContainer>
      <h1 className="h1">Clients</h1>
      <p className="mt-1.5 text-[14px] font-medium text-ink-2">
        Open positions organized by client — prioritize where the demand is.
      </p>

      <div className="mb-3 mt-7 flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold tracking-tight2 text-ink">
          {clients.length} client{clients.length === 1 ? "" : "s"} with open positions
        </h2>
        <span className="text-[12.5px] font-semibold text-ink-muted">
          {totalReqs} active job opening{totalReqs === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <div className="mb-3.5 rounded-panel border border-red-soft bg-red-soft px-4 py-3 text-[13px] font-medium text-red-text">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {loading && <div className="text-[13px] font-medium text-ink-muted">Loading clients…</div>}

        {!loading &&
          clients.map((c) => (
            <ClientCard
              key={c.name}
              client={c}
              expanded={!!expanded[c.name]}
              onToggle={() => setExpanded((e) => ({ ...e, [c.name]: !e[c.name] }))}
              navigate={navigate}
            />
          ))}

        {!loading && clients.length === 0 && !error && (
          <div className="rounded-card border border-dashed border-border-strong bg-surface-2 px-4 py-10 text-center text-[13.5px] font-medium text-ink-muted">
            No client projects yet. Create a client project from the dashboard to see it here.
          </div>
        )}
      </div>
    </PageContainer>
  );
}
