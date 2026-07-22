import { AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

// Small confirmation dialog for destructive actions (delete, etc.).
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  busy = false,
}) {
  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title} size="sm">
      <div className="p-5">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-soft text-red-text">
            <AlertTriangle size={18} strokeWidth={2.3} />
          </span>
          <p className="pt-1 text-[13.5px] font-medium leading-[1.55] text-ink-2">{message}</p>
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-input bg-red-text px-[18px] py-2.5 text-[13.5px] font-bold text-white transition-all hover:brightness-105 active:scale-[.98] disabled:opacity-60"
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
