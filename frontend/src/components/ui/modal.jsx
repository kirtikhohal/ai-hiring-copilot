import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Centered modal with a dimmed backdrop. Closes on Escape or backdrop click.
export default function Modal({ open, onClose, title, subtitle, children, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxW =
    size === "lg" ? "max-w-[900px]" : size === "sm" ? "max-w-[460px]" : "max-w-[620px]";

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-[rgba(20,22,31,.45)] backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full animate-scale-in flex-col overflow-hidden rounded-[18px] border border-border bg-surface shadow-modal",
          maxW
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-extrabold tracking-tight2 text-ink">
              {title}
            </div>
            {subtitle && (
              <div className="mt-0.5 truncate text-[12.5px] font-medium text-ink-muted">
                {subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1.5 text-ink-faint transition-colors hover:bg-hairline hover:text-ink-2"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
