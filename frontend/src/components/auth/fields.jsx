// Shared styling for the auth + profile form fields, matching the design tokens.

export const inputClass =
  "w-full rounded-input border-[1.5px] border-border-strong bg-white px-[14px] py-[11px] text-[14px] font-medium text-ink transition-shadow placeholder:text-ink-faint";

export function Label({ children, className = "" }) {
  return (
    <div className={`mb-1.5 text-[12.5px] font-bold text-ink-2 ${className}`}>
      {children}
    </div>
  );
}
