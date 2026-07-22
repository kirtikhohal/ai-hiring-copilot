import { useEffect, useState } from "react";
import { Eye, Download, FileText, Building2, Loader2 } from "lucide-react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { getJD, jdFileUrl, resumeFileUrl } from "@/lib/api";

// Embedded PDF preview with a download action.
function PdfBlock({ url, downloadUrl }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex justify-end">
        <a href={downloadUrl}>
          <Button variant="outline" size="sm">
            <Download size={14} strokeWidth={2.5} />
            Download PDF
          </Button>
        </a>
      </div>
      <iframe
        title="Document preview"
        src={url}
        className="h-[58vh] w-full rounded-panel border border-border bg-surface-2"
      />
    </div>
  );
}

function Chip({ children, strong }) {
  return (
    <span
      className={
        strong
          ? "rounded-chip bg-accent-soft px-2.5 py-1 text-[12px] font-bold text-accent"
          : "rounded-chip border border-border bg-white px-2.5 py-1 text-[12px] font-semibold text-ink-2"
      }
    >
      {children}
    </span>
  );
}

// Human label for the project context ("Acme Corp · Q3 Hiring").
export function projectLabel(project) {
  if (!project) return "";
  const company =
    project.type === "client" ? project.client_name : project.company_name;
  return [company, project.project_name].filter(Boolean).join("  ·  ");
}

// The JD metadata + original-PDF quick view, driven by jdId. Fetches lazily
// when first opened. `jd` can be passed in to skip the fetch.
export function JdViewButton({ jdId, jd: jdProp, label = "View JD" }) {
  const [open, setOpen] = useState(false);
  const [jd, setJd] = useState(jdProp ?? null);

  useEffect(() => {
    if (!open || jd) return;
    getJD(jdId)
      .then(setJd)
      .catch(() => {});
  }, [open, jd, jdId]);

  const parsed = jd?.parsed;
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Eye size={14} strokeWidth={2.5} />
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Job description"
        subtitle={projectLabel(jd?.project) || parsed?.role_title}
        size="lg"
      >
        <div className="flex flex-col gap-4 p-5">
          {!jd && (
            <div className="flex items-center gap-2.5 text-[13px] font-medium text-ink-muted">
              <Loader2 size={16} strokeWidth={2.5} className="animate-spin text-accent" />
              Loading job description…
            </div>
          )}

          {parsed && (
            <div className="rounded-panel border border-border bg-input-surface p-4">
              <div className="text-[16px] font-extrabold tracking-tight2 text-ink">
                {parsed.role_title || "Untitled role"}
              </div>
              <div className="mt-1 text-[12.5px] font-medium text-ink-2">
                Parsed by Hazel · min experience {parsed.min_experience_years || 0} yr
                {parsed.education_requirements ? ` · ${parsed.education_requirements}` : ""}
              </div>

              <div className="micro-label mt-4 text-accent">Required skills</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(parsed.required_skills || []).map((s) => (
                  <Chip key={s} strong>
                    {s}
                  </Chip>
                ))}
                {(parsed.required_skills || []).length === 0 && (
                  <span className="text-[12.5px] text-ink-muted">None listed.</span>
                )}
              </div>

              <div className="micro-label mt-4 text-ink-muted">Preferred skills</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(parsed.preferred_skills || []).map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
                {(parsed.preferred_skills || []).length === 0 && (
                  <span className="text-[12.5px] text-ink-muted">None listed.</span>
                )}
              </div>

              {(parsed.key_responsibilities || []).length > 0 && (
                <>
                  <div className="micro-label mt-4 text-ink-muted">
                    Key responsibilities
                  </div>
                  <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-[13px] font-medium leading-[1.55] text-ink-2">
                    {parsed.key_responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {jd?.has_file ? (
            <PdfBlock url={jdFileUrl(jdId)} downloadUrl={jdFileUrl(jdId, true)} />
          ) : (
            jd && (
              <div className="flex items-center gap-2 rounded-panel border border-border bg-input-surface px-3.5 py-2.5 text-[12.5px] font-medium text-ink-muted">
                <FileText size={15} strokeWidth={2.25} />
                The original PDF isn't stored for this job opening (it predates
                file storage). The parsed details above are still available.
              </div>
            )
          )}
        </div>
      </Modal>
    </>
  );
}

// Original-resume quick view + download, driven by resumeId.
export function ResumeViewButton({
  resumeId,
  candidateName,
  hasFile = true,
  label = "View résumé",
}) {
  const [open, setOpen] = useState(false);
  if (!resumeId) return null;
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileText size={14} strokeWidth={2.5} />
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Candidate résumé"
        subtitle={candidateName}
        size="lg"
      >
        <div className="p-5">
          {hasFile ? (
            <PdfBlock
              url={resumeFileUrl(resumeId)}
              downloadUrl={resumeFileUrl(resumeId, true)}
            />
          ) : (
            <div className="flex items-center gap-2 rounded-panel border border-border bg-input-surface px-3.5 py-2.5 text-[12.5px] font-medium text-ink-muted">
              <FileText size={15} strokeWidth={2.25} />
              The original résumé PDF isn't stored for this candidate (it predates
              file storage).
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

// Context strip shown on every designation page: which client/project +
// a "View JD" quick view. `right` lets a page add extra buttons (e.g. résumé).
export function DesignationBar({ jdId, right }) {
  const [jd, setJd] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getJD(jdId)
      .then((r) => !cancelled && setJd(r))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [jdId]);

  const project = jd?.project;
  const label = projectLabel(project);
  const typeLabel =
    project?.type === "client"
      ? "Client"
      : project?.type === "internal"
        ? "Internal"
        : null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 rounded-panel border border-border bg-surface px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-tile bg-accent-soft text-accent">
          <Building2 size={16} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {typeLabel && (
              <span className="rounded-chip bg-hairline px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-ink-2">
                {typeLabel}
              </span>
            )}
            <span className="truncate text-[13.5px] font-bold text-ink">
              {label || "Unassigned job opening"}
            </span>
          </div>
          {jd?.parsed?.role_title && (
            <div className="truncate text-[12px] font-medium text-ink-muted">
              {jd.parsed.role_title}
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {right}
        <JdViewButton jdId={jdId} jd={jd} />
      </div>
    </div>
  );
}
