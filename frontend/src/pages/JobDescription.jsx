import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageContainer from "@/components/shell/PageContainer";
import Stepper from "@/components/shell/Stepper";
import { Button } from "@/components/ui/button";
import { Upload, ArrowRight, Loader2, Download, Building2, Briefcase, Check } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { uploadJD, jdFileUrl } from "@/lib/api";
import { JdViewButton } from "@/components/shell/doc-views";
import { useToast } from "@/lib/toast";

export default function JobDescription() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [jdId, setJdId] = useState(null);
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const projectId = state?.projectId;
  const projectName = state?.projectName;
  const projectType = state?.projectType;
  const company = state?.company;
  const isClient = projectType === "client";

  async function handleFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    setFileName(file.name);
    setError("");
    setParsed(null);
    setUploading(true);
    try {
      const res = await uploadJD(file, projectId);
      setParsed(res.parsed);
      setJdId(res.jd_id);
      setResult(res);
      toast.success("JD parsed", res.parsed?.role_title || "");
    } catch (e) {
      const msg = e.message || "Something went wrong parsing the JD.";
      setError(msg);
      toast.error("JD upload failed", msg);
    } finally {
      setUploading(false);
    }
  }

  function handleContinue() {
    if (!jdId) return;
    navigate(ROUTES.resumes(jdId), { state: { roleTitle: parsed?.role_title } });
  }

  return (
    <PageContainer width="form">
      <Stepper current={1} />

      <h1 className="h1">Add a job opening</h1>
      <p className="mt-1.5 text-[14px] font-medium text-ink-2">
        Upload a JD PDF — Hazel extracts the role, required skills, and experience bar
        automatically.
      </p>

      {/* Project context */}
      {projectId ? (
        <div className="mt-5 flex items-center gap-3 rounded-panel border border-border bg-surface px-4 py-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
              isClient ? "bg-terracotta-soft text-terracotta" : "bg-accent-soft text-accent"
            }`}
          >
            {isClient ? <Briefcase size={16} strokeWidth={2.2} /> : <Building2 size={16} strokeWidth={2.2} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-bold text-ink-muted">Adding a job opening to</div>
            <div className="truncate text-[13.5px] font-extrabold tracking-tight15 text-ink">
              {projectName}
              {company && <span className="font-semibold text-ink-muted"> · {company}</span>}
            </div>
          </div>
          {projectType && (
            <span
              className={`shrink-0 rounded-[6px] px-2 py-[3px] text-[10px] font-extrabold uppercase tracking-[.08em] ${
                isClient ? "bg-terracotta-soft text-terracotta-text" : "bg-accent-soft text-accent"
              }`}
            >
              {isClient ? "Client" : "Internal"}
            </span>
          )}
        </div>
      ) : (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-panel border border-amber-soft bg-amber-soft px-4 py-3">
          <div className="text-[12.5px] font-medium text-amber-text-2">
            This job opening won't be linked to a project. Start from a project on the dashboard to
            keep things organized.
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.dashboard)}>
            Choose project
          </Button>
        </div>
      )}

      {/* Dropzone */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files?.[0]);
        }}
        disabled={uploading}
        className="mt-4 w-full rounded-card border-2 border-dashed border-accent-border bg-accent-tint-gradient p-9 text-center transition-colors hover:border-accent disabled:opacity-70"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-white text-accent shadow-[0_4px_14px_rgba(99,102,241,.18)]">
          {uploading ? (
            <Loader2 size={21} strokeWidth={2.2} className="animate-spin" />
          ) : (
            <Upload size={21} strokeWidth={2.2} />
          )}
        </div>
        <div className="mt-3 text-[15px] font-extrabold tracking-tight15 text-ink">
          {uploading ? "Parsing job description…" : fileName || (
            <>
              Drop the JD here, or <span className="text-accent">browse</span>
            </>
          )}
        </div>
        <div className="mt-1 text-[12.5px] font-medium text-ink-muted">PDF · up to 10 MB</div>
      </button>

      {error && (
        <div className="mt-4 rounded-panel border border-red-soft bg-red-soft px-4 py-3 text-[13px] font-medium text-red-text">
          {error}
        </div>
      )}

      {/* Parsed result */}
      {parsed && (
        <div className="mt-4 rounded-card border border-border bg-surface p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-green-soft text-green">
                <Check size={16} strokeWidth={3} />
              </span>
              <div>
                <div className="text-[14.5px] font-extrabold tracking-tight15 text-ink">
                  {fileName || "Job description"} parsed
                </div>
                <div className="mt-0.5 text-[12px] font-medium text-ink-muted">
                  Role, skills &amp; experience extracted
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <JdViewButton jdId={jdId} jd={result} />
              {result?.has_file && (
                <a href={jdFileUrl(jdId, true)}>
                  <Button variant="outline" size="sm">
                    <Download size={14} strokeWidth={2.5} />
                    Download
                  </Button>
                </a>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-[7px]">
            <span className="rounded-chip bg-accent-soft px-2.5 py-[5px] text-[12px] font-extrabold text-accent">
              {parsed.role_title || "Untitled role"}
            </span>
            {parsed.min_experience_years > 0 && (
              <span className="rounded-chip bg-hairline-2 px-2.5 py-[5px] text-[12px] font-semibold text-ink-2">
                {parsed.min_experience_years}+ yrs
              </span>
            )}
            {(parsed.required_skills || []).map((s) => (
              <span key={s} className="rounded-chip bg-hairline-2 px-2.5 py-[5px] text-[12px] font-semibold text-ink-2">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(ROUTES.dashboard)}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!jdId || uploading}>
          Continue to resumes
          <ArrowRight size={16} strokeWidth={2.5} />
        </Button>
      </div>
    </PageContainer>
  );
}
