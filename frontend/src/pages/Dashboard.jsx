import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/shell/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import {
  Plus,
  ChevronRight,
  Building2,
  Briefcase,
  FileText,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { getProjects, getDashboardStats, createProject } from "@/lib/api";
import { useAuth, firstNameOf } from "@/lib/auth";
import { useToast } from "@/lib/toast";

// --- Stat tile: label + icon tile, big number, descriptive subtitle ---
function StatTile({ label, value, sub, Icon, coral }) {
  return (
    <Card className="animate-fade-in px-5 py-[18px]">
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] font-bold text-ink-muted">{label}</div>
        <span
          className={cn(
            "flex h-[30px] w-[30px] items-center justify-center rounded-[9px]",
            coral ? "bg-terracotta-soft text-terracotta" : "bg-accent-soft text-accent"
          )}
        >
          <Icon size={15} strokeWidth={2.2} />
        </span>
      </div>
      <div
        className="mt-2 text-[30px] font-extrabold leading-none tracking-[-.03em]"
        style={{ color: coral ? "#f2683c" : "#14161f" }}
      >
        {value}
      </div>
      {sub && <div className="mt-[7px] text-[11.5px] font-semibold text-ink-muted">{sub}</div>}
    </Card>
  );
}

function initialsFromTitle(title) {
  if (!title) return "?";
  return title
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// --- One designation row inside an expanded project ---
function DesignationRow({ d, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[12px] border border-hairline bg-surface px-3.5 py-3 text-left transition-all duration-150 hover:-translate-y-[2px] hover:border-border-strong hover:shadow-lift"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-[11.5px] font-extrabold text-accent">
        {initialsFromTitle(d.role_title)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold tracking-tight2 text-ink">
          {d.role_title}
        </div>
        <div className="mt-0.5 text-[12px] font-medium text-ink-muted">
          {d.resume_count} candidate{d.resume_count === 1 ? "" : "s"}
          {d.top_score != null ? ` · top score ${d.top_score}` : " · not screened yet"}
          {d.shortlisted > 0 && (
            <span className="font-bold text-green-text"> · {d.shortlisted} shortlisted</span>
          )}
        </div>
      </div>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold",
          d.top_score != null ? "bg-green-soft text-green-text" : "bg-hairline-2 text-ink-2"
        )}
      >
        <span
          className={cn(
            "h-[5px] w-[5px] rounded-full",
            d.top_score != null ? "bg-green" : "bg-ink-faint"
          )}
        />
        {d.top_score != null ? "Ranked" : "Not screened"}
      </span>
    </button>
  );
}

// --- One project card (expandable) ---
function ProjectCard({ project, expanded, onToggle, navigate }) {
  const isClient = project.type === "client";
  const isUnassigned = !project.id;
  const company = isClient ? project.client_name : project.company_name;
  const count = project.designations.length;

  return (
    <Card className="animate-slide-up overflow-hidden p-0">
      <div className="flex items-center gap-3.5 p-4">
        <button onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3.5 text-left">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]",
              isClient ? "bg-terracotta-soft text-terracotta" : "bg-accent-soft text-accent"
            )}
          >
            {isClient ? (
              <Briefcase size={19} strokeWidth={2.2} />
            ) : (
              <Building2 size={19} strokeWidth={2.2} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[15px] font-extrabold tracking-tight15 text-ink">
                {project.name}
              </span>
              {!isUnassigned && (
                <span
                  className={cn(
                    "shrink-0 rounded-[6px] px-[7px] py-0.5 text-[10px] font-extrabold uppercase tracking-[.08em]",
                    isClient
                      ? "bg-terracotta-soft text-terracotta-text"
                      : "bg-accent-soft text-accent"
                  )}
                >
                  {isClient ? "Client" : "Internal"}
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-[12.5px] font-medium text-ink-muted">
              {[company, `${count} job opening${count === 1 ? "" : "s"}`]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <ChevronRight
            size={18}
            strokeWidth={2.5}
            className={cn(
              "shrink-0 text-ink-faint transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
        </button>
        {!isUnassigned && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() =>
              navigate(ROUTES.jd, {
                state: {
                  projectId: project.id,
                  projectName: project.name,
                  projectType: project.type,
                  company,
                },
              })
            }
          >
            <Plus size={14} strokeWidth={2.5} />
            Add job opening
          </Button>
        )}
      </div>

      {expanded && (
        <div className="flex flex-col gap-2.5 border-t border-hairline bg-surface-2 p-4">
          {count === 0 && (
            <div className="text-[13px] font-medium text-ink-muted">
              No job openings yet — add one to upload a JD and start screening.
            </div>
          )}
          {project.designations.map((d) => (
            <DesignationRow
              key={d.jd_id}
              d={d}
              onClick={() =>
                navigate(ROUTES.ranked(d.jd_id), { state: { roleTitle: d.role_title } })
              }
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// --- New Project modal ---
function NewProjectModal({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const toast = useToast();
  const [type, setType] = useState("client");
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setType("client");
      setName("");
      setClientName("");
    }
  }, [open]);

  async function submit() {
    if (saving) return;
    if (!name.trim() || (type === "client" && !clientName.trim())) {
      toast.error("Missing details", "Add a project name (and client name for client projects).");
      return;
    }
    setSaving(true);
    try {
      const project = await createProject({ name, type, clientName });
      toast.success("Project created", project.name);
      onCreated(project);
      onClose();
    } catch (e) {
      toast.error("Couldn't create project", e.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const field =
    "mt-2 w-full rounded-[11px] border-[1.5px] border-border-strong bg-white px-[13px] py-2.5 text-[14px] font-medium text-ink placeholder:text-ink-faint transition-shadow";
  const TYPES = [
    { key: "client", label: "Client project", sub: "For an external client" },
    { key: "internal", label: "Internal project", sub: "Hiring for your own org" },
  ];

  return (
    <Modal open={open} onClose={onClose} title="New project" subtitle="Client or internal — job openings live under it.">
      <div className="p-[22px]">
        <div className="text-[12.5px] font-bold text-ink-2">Project type</div>
        <div className="mt-2 flex gap-2.5">
          {TYPES.map((o) => (
            <button
              key={o.key}
              onClick={() => setType(o.key)}
              className={cn(
                "flex-1 rounded-[12px] border-[1.5px] p-3.5 text-left transition-all",
                type === o.key ? "border-accent bg-accent-soft" : "border-border-strong bg-white hover:border-accent-border"
              )}
            >
              <div className={cn("text-[13.5px] font-extrabold", type === o.key ? "text-accent" : "text-ink")}>
                {o.label}
              </div>
              <div className="mt-0.5 text-[11.5px] font-medium text-ink-muted">{o.sub}</div>
            </button>
          ))}
        </div>

        {type === "client" ? (
          <div className="mt-4">
            <div className="text-[12.5px] font-bold text-ink-2">Client name</div>
            <input
              className={field}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Corporation"
            />
          </div>
        ) : (
          <div className="mt-4">
            <div className="text-[12.5px] font-bold text-ink-2">Company</div>
            <input className={cn(field, "cursor-not-allowed text-ink-muted")} value={user?.org || "Your organization"} disabled />
            <div className="mt-1 text-[11.5px] font-medium text-ink-muted">
              Internal projects use your organization from your profile.
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="text-[12.5px] font-bold text-ink-2">Project name</div>
          <input
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q3 Engineering Hiring"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Creating…" : "Create project"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  function loadProjects() {
    return getProjects()
      .then((res) => {
        setProjects(res.projects);
        setExpanded((prev) =>
          Object.keys(prev).length || !res.projects.length
            ? prev
            : { [res.projects[0].id || "unassigned"]: true }
        );
      })
      .catch((e) => {
        setError(e.message || "Could not load your projects.");
        toast.error("Couldn't load projects", e.message || "");
      });
  }

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getProjects(), getDashboardStats()])
      .then(([projRes, statsRes]) => {
        if (cancelled) return;
        if (projRes.status === "fulfilled") {
          setProjects(projRes.value.projects);
          const first = projRes.value.projects[0];
          if (first) setExpanded({ [first.id || "unassigned"]: true });
        } else {
          const msg = projRes.reason?.message || "Could not load your projects.";
          setError(msg);
          toast.error("Couldn't load projects", msg);
        }
        if (statsRes.status === "fulfilled") setStats(statsRes.value);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const designationCount = projects.reduce((n, p) => n + p.designations.length, 0);
  const hours = stats?.est_hours_saved;
  const workingDays = hours != null ? Math.max(1, Math.round(hours / 8)) : null;

  const statTiles = [
    {
      label: "Active projects",
      value: stats?.active_projects ?? "—",
      sub: designationCount ? `${designationCount} job opening${designationCount === 1 ? "" : "s"}` : null,
      Icon: Briefcase,
    },
    {
      label: "Resumes screened",
      value: stats?.resumes_screened ?? "—",
      sub: "across your job openings",
      Icon: FileText,
    },
    {
      label: "Est. hours saved",
      value: hours ?? "—",
      sub: workingDays != null ? `≈ ${workingDays} working day${workingDays === 1 ? "" : "s"}` : null,
      Icon: Clock,
      coral: true,
    },
  ];

  function toggle(key) {
    setExpanded((e) => ({ ...e, [key]: !e[key] }));
  }

  return (
    <PageContainer>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h1">Good afternoon, {firstNameOf(user.fullName)}</h1>
          <p className="mt-1.5 text-[14px] font-medium text-ink-2">
            Here's where your hiring stands today.
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus size={16} strokeWidth={2.5} />
          New project
        </Button>
      </div>

      {/* Stat grid */}
      <div className="mt-7 grid grid-cols-3 gap-3.5 max-[720px]:grid-cols-1">
        {statTiles.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      {/* Projects */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold tracking-tight2 text-ink">Your projects</h2>
        <span className="text-[12.5px] font-semibold text-ink-muted">
          {projects.filter((p) => p.id).length} project
          {projects.filter((p) => p.id).length === 1 ? "" : "s"} · {designationCount} job opening
          {designationCount === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <div className="mb-3.5 rounded-panel border border-red-soft bg-red-soft px-4 py-3 text-[13px] font-medium text-red-text">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {loading && (
          <div className="text-[13px] font-medium text-ink-muted">Loading your projects…</div>
        )}

        {!loading &&
          projects.map((p) => (
            <ProjectCard
              key={p.id || "unassigned"}
              project={p}
              expanded={!!expanded[p.id || "unassigned"]}
              onToggle={() => toggle(p.id || "unassigned")}
              navigate={navigate}
            />
          ))}

        {!loading && projects.length === 0 && !error && (
          <div className="flex items-center gap-4 rounded-card border border-dashed border-accent-border bg-accent-tint p-4">
            <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-tile bg-white text-accent shadow-soft">
              <Plus size={22} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-ink">Create your first project</div>
              <div className="mt-0.5 text-[12.5px] font-medium text-ink-muted">
                Group your hiring under a client or internal project, then add job openings to
                screen candidates.
              </div>
            </div>
            <Button className="shrink-0" onClick={() => setNewOpen(true)}>
              New project
            </Button>
          </div>
        )}
      </div>

      <NewProjectModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={() => loadProjects()} />
    </PageContainer>
  );
}
