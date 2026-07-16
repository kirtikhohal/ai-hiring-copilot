import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

// Lightweight app-wide toast system. Toasts stack in the top-right, slide in,
// and auto-dismiss. Use via the useToast() hook:
//   const toast = useToast();
//   toast.success("Saved successfully");
//   toast.error("Could not save your profile");

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    Icon: CheckCircle2,
    accent: "#10b981", // green
    iconClass: "text-green",
    ring: "border-green-soft",
  },
  error: {
    Icon: AlertCircle,
    accent: "#e5484d", // red-text
    iconClass: "text-red-text",
    ring: "border-red-soft",
  },
  info: {
    Icon: Info,
    accent: "#6366f1", // accent
    iconClass: "text-accent",
    ring: "border-accent-border",
  },
};

function ToastCard({ toast, onDismiss }) {
  const v = VARIANTS[toast.variant] ?? VARIANTS.info;
  const { Icon } = v;
  return (
    <div
      role="status"
      className="animate-toast-in pointer-events-auto flex w-[340px] max-w-[calc(100vw-32px)] items-start gap-3 overflow-hidden rounded-[14px] border border-border-strong bg-surface py-3 pl-3 pr-2.5 shadow-menu"
    >
      <Icon size={18} strokeWidth={2.5} className={`mt-0.5 shrink-0 ${v.iconClass}`} />
      <div className="min-w-0 flex-1">
        {toast.title && (
          <div className="text-[13.5px] font-extrabold leading-tight text-ink">
            {toast.title}
          </div>
        )}
        {toast.message && (
          <div className={`text-[12.5px] font-medium leading-[1.5] text-ink-2 ${toast.title ? "mt-0.5" : ""}`}>
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-ink-faint transition-colors hover:bg-hairline hover:text-ink-2"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant, title, message, duration = 4000) => {
      // Counter-based id keeps this deterministic (no Date.now()/random).
      const id = ++idRef.current;
      setToasts((list) => [...list, { id, variant, title, message }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  // Stable API. `success`/`error`/`info` accept (title, message?) — with one
  // argument the text is used as the message (no bold title).
  const api = useRef({
    success: (a, b) => (b === undefined ? push("success", "", a) : push("success", a, b)),
    error: (a, b) => (b === undefined ? push("error", "", a) : push("error", a, b)),
    info: (a, b) => (b === undefined ? push("info", "", a) : push("info", a, b)),
    dismiss,
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2.5">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
