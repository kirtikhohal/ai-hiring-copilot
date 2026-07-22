// Hazel graduation-cap logo. Mark = white glyph on an indigo→violet gradient tile.

export function LogoMark({ size = 36, className = "" }) {
  const glyph = Math.round(size * 0.58);
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-accent-gradient text-white shadow-primary ${className}`}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3) }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none">
        <path d="M12 4 2.5 8.3 12 12.6l7.6-3.44V15.2h1.9V8.3L12 4Z" fill="#fff" />
        <path
          d="M6.6 11.9v3.3c0 1.5 2.4 2.9 5.4 2.9s5.4-1.4 5.4-2.9v-3.3L12 14.35 6.6 11.9Z"
          fill="#fff"
          opacity=".8"
        />
      </svg>
    </div>
  );
}

export function Wordmark({ dark = false }) {
  return (
    <div className="leading-tight">
      <div
        className="text-[15px] font-extrabold tracking-tight2"
        style={dark ? { color: "#fff" } : undefined}
      >
        Hazel
      </div>
      <div
        className="text-[11.5px] font-semibold"
        style={{ color: dark ? "#9aa1b5" : "#858ca0" }}
      >
        Hiring Copilot
      </div>
    </div>
  );
}
