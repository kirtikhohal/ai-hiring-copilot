// Shared left brand panel for the auth split-layout (register / login / forgot).
// Dark rail with soft radial glows, logo, the Hazel quote, and glass stat tiles.

function StatTile({ value, label }) {
  return (
    <div className="flex-1 rounded-[14px] border border-[rgba(255,255,255,.09)] bg-[rgba(255,255,255,.05)] px-4 py-3.5">
      <div className="text-[22px] font-extrabold tracking-tight2 text-white">
        {value}
      </div>
      <div className="mt-0.5 text-[11.5px] font-semibold text-sidebar-muted">
        {label}
      </div>
    </div>
  );
}

export default function BrandPanel() {
  return (
    <div className="relative flex w-[44%] min-w-[380px] flex-col overflow-hidden bg-sidebar px-12 py-11 max-[860px]:hidden">
      {/* radial glows */}
      <div
        className="pointer-events-none absolute -right-[180px] -top-[180px] h-[480px] w-[480px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,.28) 0%, rgba(99,102,241,0) 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-[220px] -left-[140px] h-[520px] w-[520px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,.18) 0%, rgba(139,92,246,0) 70%)",
        }}
      />

      {/* logo */}
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-accent-gradient shadow-[0_8px_24px_rgba(99,102,241,.45)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 4 2.5 8.3 12 12.6l7.6-3.44V15.2h1.9V8.3L12 4Z" fill="#fff" />
            <path
              d="M6.6 11.9v3.3c0 1.5 2.4 2.9 5.4 2.9s5.4-1.4 5.4-2.9v-3.3L12 14.35 6.6 11.9Z"
              fill="#fff"
              opacity=".85"
            />
          </svg>
        </div>
        <div className="leading-[1.15]">
          <div className="text-[17px] font-extrabold tracking-tight2 text-white">
            Hazel
          </div>
          <div className="text-[12px] font-semibold text-sidebar-muted">
            Hiring Copilot
          </div>
        </div>
      </div>

      {/* quote */}
      <div className="relative my-auto">
        <div className="text-[36px] font-extrabold leading-[1.25] tracking-h1 text-white">
          &ldquo;Hire character.
          <br />
          Train skill.&rdquo;
        </div>
        <div className="mt-4 text-[14px] font-semibold text-sidebar-muted">
          &mdash; Peter Schutz
        </div>
      </div>

      {/* stats */}
      <div className="relative flex flex-col gap-3.5">
        <div className="flex gap-2.5">
          <StatTile value="90%" label="less time screening" />
          <StatTile value="0–100" label="explainable hiring score" />
          <StatTile value="8/8" label="questions tailored per CV" />
        </div>
        <div className="text-[12.5px] font-medium text-[#6a7085]">
          Screen resumes, spot skill gaps, and prep interviews — in minutes, not
          hours.
        </div>
      </div>
    </div>
  );
}
