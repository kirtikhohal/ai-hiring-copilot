import { useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageContainer from "@/components/shell/PageContainer";
import Stepper from "@/components/shell/Stepper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload, X, ArrowRight, Loader2, FileArchive, Check } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { uploadResumes } from "@/lib/api";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ModeToggle({ mode, setMode }) {
  const opt = (key, label) => (
    <button
      type="button"
      onClick={() => setMode(key)}
      className={cn(
        "flex-1 rounded-[9px] px-3.5 py-1.5 text-[12.5px] font-bold transition-all",
        mode === key ? "bg-white text-ink shadow-segment" : "text-ink-2 hover:text-ink"
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="flex gap-[3px] rounded-[11px] bg-track p-[3px]">
      {opt("individual", "Individual files")}
      {opt("zip", "ZIP folder")}
    </div>
  );
}

export default function Resumes() {
  const navigate = useNavigate();
  const { jdId } = useParams();
  const { state } = useLocation();
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState("individual");
  const [source, setSource] = useState("external");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const isZip = mode === "zip";

  function switchMode(next) {
    setMode(next);
    setFiles([]);
    setError("");
  }

  function addFiles(fileList) {
    const ext = isZip ? ".zip" : ".pdf";
    const incoming = Array.from(fileList || []).filter((f) => f.name.toLowerCase().endsWith(ext));
    if (isZip) setFiles(incoming.slice(0, 1));
    else
      setFiles((prev) => {
        const names = new Set(prev.map((f) => f.name));
        return [...prev, ...incoming.filter((f) => !names.has(f.name))];
      });
    setError("");
  }

  function removeFile(name) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleSubmit() {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    setError("");
    try {
      const res = await uploadResumes(jdId, files, source);
      navigate(ROUTES.processing(jdId), {
        state: { roleTitle: state?.roleTitle, resumes: res.resumes },
      });
    } catch (e) {
      setError(e.message || "Something went wrong uploading resumes.");
      setUploading(false);
    }
  }

  const totalSize = files.reduce((n, f) => n + f.size, 0);

  return (
    <PageContainer width="form">
      <Stepper current={2} />

      <h1 className="h1">Upload candidate resumes</h1>
      <p className="mt-1.5 text-[14px] font-medium text-ink-2">
        Drop in a batch of PDFs — Hazel parses each into a structured profile.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-bold text-ink-muted">Upload as</span>
          <ModeToggle mode={mode} setMode={switchMode} />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-bold text-ink-muted">Candidate source</span>
          <div className="flex rounded-[11px] bg-track p-[3px]">
            {[
              { key: "external", label: "External" },
              { key: "internal", label: "Internal" },
            ].map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setSource(o.key)}
                className={cn(
                  "rounded-[9px] px-3.5 py-1.5 text-[12.5px] font-bold transition-all",
                  source === o.key ? "bg-white text-ink shadow-segment" : "text-ink-2 hover:text-ink"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={isZip ? ".zip" : ".pdf"}
        multiple={!isZip}
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      {/* Dropzone */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        disabled={uploading}
        className="mt-4 w-full rounded-card border-2 border-dashed border-accent-border bg-accent-tint-gradient p-8 text-center transition-colors hover:border-accent disabled:opacity-70"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-white text-accent shadow-[0_4px_14px_rgba(99,102,241,.18)]">
          {isZip ? <FileArchive size={21} strokeWidth={2.2} /> : <Upload size={21} strokeWidth={2.2} />}
        </div>
        <div className="mt-3 text-[15px] font-extrabold tracking-tight15 text-ink">
          {isZip ? (
            <>
              Drop a ZIP here, or <span className="text-accent">browse</span>
            </>
          ) : (
            <>
              Drop resumes here, or <span className="text-accent">browse</span>
            </>
          )}
        </div>
        <div className="mt-1 text-[12.5px] font-medium text-ink-muted">
          {isZip ? "One ZIP containing all resumes" : "PDF · up to 20 files"}
        </div>
      </button>

      {error && (
        <div className="mt-4 rounded-panel border border-red-soft bg-red-soft px-4 py-3 text-[13px] font-medium text-red-text">
          {error}
        </div>
      )}

      {/* File list — one card, divided rows */}
      {files.length > 0 && (
        <>
          <div className="mb-2.5 mt-5 flex items-center justify-between">
            <div className="text-[13px] font-extrabold text-ink">
              {isZip ? "1 archive ready" : `${files.length} file${files.length === 1 ? "" : "s"} ready`}
            </div>
            <div className="text-[12px] font-semibold text-ink-muted">{formatSize(totalSize)} total</div>
          </div>
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            {files.map((f) => {
              const isZipFile = f.name.toLowerCase().endsWith(".zip");
              return (
                <div
                  key={f.name}
                  className="flex items-center gap-3 border-b border-hairline-2 px-4 py-3 last:border-0"
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[9px] font-extrabold",
                      isZipFile ? "bg-accent-soft text-accent" : "bg-red-soft text-red-text"
                    )}
                  >
                    {isZipFile ? "ZIP" : "PDF"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold tracking-tight2 text-ink">
                      {f.name}
                    </div>
                    <div className="text-[11.5px] font-medium text-ink-muted">
                      {formatSize(f.size)}
                      {isZipFile && " · resumes extracted at upload"}
                    </div>
                  </div>
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-green-soft text-green">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(f.name)}
                    disabled={uploading}
                    title="Remove"
                    className="shrink-0 text-ink-faint transition-colors hover:text-red-text disabled:opacity-50"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(ROUTES.jd)}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={files.length === 0 || uploading}>
          {uploading ? (
            <>
              <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
              Screening…
            </>
          ) : (
            <>
              {isZip ? "Screen candidates" : `Screen ${files.length} candidate${files.length === 1 ? "" : "s"}`}
              <ArrowRight size={16} strokeWidth={2.5} />
            </>
          )}
        </Button>
      </div>
    </PageContainer>
  );
}
