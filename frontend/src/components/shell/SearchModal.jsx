import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, FileText, Briefcase } from "lucide-react";
import Modal from "@/components/ui/modal";
import { ROUTES } from "@/lib/routes";
import { getProjects, getCandidateDirectory } from "@/lib/api";
import { StateBadge, SourceBadge } from "@/components/ui/candidate-badges";

function Group({ label, children }) {
  return (
    <div className="mb-1">
      <div className="px-2 py-1.5 text-[10.5px] font-extrabold uppercase tracking-micro text-ink-faint">
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ icon, iconTone, title, meta, right, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors hover:bg-hairline-2"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${iconTone}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-bold text-ink">{title}</div>
        {meta && <div className="truncate text-[12px] font-medium text-ink-muted">{meta}</div>}
      </div>
      {right}
    </button>
  );
}

export default function SearchModal({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [q, setQ] = useState("");
  const [projects, setProjects] = useState([]);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    getProjects().then((r) => setProjects(r.projects)).catch(() => {});
    getCandidateDirectory().then((r) => setCandidates(r.candidates)).catch(() => {});
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  const term = q.trim().toLowerCase();

  const { requirements, clients } = useMemo(() => {
    const reqs = projects.flatMap((p) =>
      p.designations.map((d) => ({
        jdId: d.jd_id,
        role: d.role_title,
        owner: (p.type === "client" ? p.client_name : p.company_name) || p.name,
        type: p.type,
      }))
    );
    const cls = [...new Set(projects.filter((p) => p.type === "client").map((p) => p.client_name).filter(Boolean))];
    return { requirements: reqs, clients: cls };
  }, [projects]);

  const fReq = (term
    ? requirements.filter((r) => `${r.role} ${r.owner}`.toLowerCase().includes(term))
    : requirements
  ).slice(0, 6);
  const fCand = (term
    ? candidates.filter((c) => (c.candidate_name || "").toLowerCase().includes(term))
    : candidates
  ).slice(0, 6);
  const fClients = (term ? clients.filter((c) => c.toLowerCase().includes(term)) : clients).slice(0, 4);

  const total = fReq.length + fCand.length + fClients.length;
  const go = (to, state) => {
    onClose();
    navigate(to, state ? { state } : undefined);
  };

  return (
    <Modal open={open} onClose={onClose} title="Search" subtitle="Clients, job openings, and candidates" size="md">
      <div className="border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2.5 rounded-input border-[1.5px] border-border-strong bg-white px-3 py-2.5 focus-within:border-accent">
          <Search size={15} strokeWidth={2.4} className="shrink-0 text-ink-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search candidates, job openings, clients…"
            className="w-full border-0 bg-transparent p-0 text-[14px] font-medium text-ink placeholder:text-ink-faint focus:outline-none focus:ring-0"
            style={{ boxShadow: "none" }}
          />
        </div>
      </div>

      <div className="max-h-[54vh] overflow-y-auto p-2">
        {total === 0 && (
          <div className="px-2 py-10 text-center text-[13px] font-medium text-ink-muted">
            {term ? `No matches for “${q}”.` : "Start typing to search."}
          </div>
        )}

        {fClients.length > 0 && (
          <Group label="Clients">
            {fClients.map((c) => (
              <Row
                key={c}
                icon={<Briefcase size={16} strokeWidth={2.2} />}
                iconTone="bg-terracotta-soft text-terracotta"
                title={c}
                meta="View client job openings"
                onClick={() => go(ROUTES.clients)}
              />
            ))}
          </Group>
        )}

        {fReq.length > 0 && (
          <Group label="Job openings">
            {fReq.map((r) => (
              <Row
                key={r.jdId}
                icon={<FileText size={16} strokeWidth={2.2} />}
                iconTone="bg-accent-soft text-accent"
                title={r.role}
                meta={r.owner}
                onClick={() => go(ROUTES.ranked(r.jdId), { roleTitle: r.role })}
              />
            ))}
          </Group>
        )}

        {fCand.length > 0 && (
          <Group label="Candidates">
            {fCand.map((c) => (
              <Row
                key={c.resume_id}
                icon={<Users size={16} strokeWidth={2.2} />}
                iconTone="bg-accent-soft text-accent"
                title={c.candidate_name}
                meta={[c.role_title, c.client_name || c.company_name].filter(Boolean).join(" · ")}
                right={
                  <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                    <SourceBadge source={c.source} />
                    <StateBadge state={c.state} />
                  </div>
                }
                onClick={() => go(ROUTES.candidate(c.jd_id, c.resume_id))}
              />
            ))}
          </Group>
        )}
      </div>
    </Modal>
  );
}
