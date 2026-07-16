/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces / backgrounds — cool near-white canvas, modern SaaS
        bg: "#f6f7fb",
        surface: "#ffffff",
        "surface-2": "#fafbfe", // table headers, expanded panels, meta rows
        "input-surface": "#ffffff",
        border: "#e9ebf3", // card borders
        "border-strong": "#e5e8f2", // input borders (1.5px)
        hairline: "#eef0f7",
        "hairline-2": "#f3f5fa",
        track: "#e8eaf4", // progress / ring track, segmented bg
        // Ink — cool grays
        ink: "#14161f",
        "ink-2": "#565d70",
        "ink-muted": "#858ca0",
        "ink-faint": "#a7adc0",
        "ink-faint-2": "#c9cddb",
        // Dark sidebar rail
        sidebar: "#14161f",
        "sidebar-text": "#9aa1b5",
        "sidebar-muted": "#6a7085",
        "sidebar-icon-active": "#a5a8fb",
        // Accent (indigo → violet)
        accent: "#6366f1",
        "accent-2": "#8b5cf6",
        "accent-strong": "#4f46e5",
        "accent-soft": "#eeeffe",
        "accent-border": "#dcddfb",
        "accent-tint": "#f5f5ff",
        // Coral / terracotta
        terracotta: "#f2683c",
        "terracotta-soft": "#fdece4",
        "terracotta-text": "#d0561f",
        // Green
        green: "#10b981",
        "green-soft": "#e5f7ef",
        "green-text": "#0b7d58",
        // Amber
        amber: "#f59e0b",
        "amber-soft": "#fdf3e0",
        "amber-text": "#b47607",
        "amber-text-2": "#8a5c05",
        // Red
        red: "#e5484d",
        "red-text": "#e5484d",
        "red-soft": "#fdecec",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        panel: "13px",
        input: "11px",
        chip: "8px",
        tile: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,22,31,.04)",
        soft: "0 1px 3px rgba(20,22,31,.06)",
        lift: "0 16px 40px rgba(20,22,31,.12)",
        primary: "0 8px 22px rgba(99,102,241,.35)",
        "primary-lg": "0 12px 28px rgba(99,102,241,.45)",
        menu: "0 18px 50px rgba(20,22,31,.16)",
        modal: "0 30px 80px rgba(20,22,31,.30)",
        segment: "0 1px 3px rgba(20,22,31,.12)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        "accent-tint-gradient": "linear-gradient(135deg, #f5f5ff 0%, #f0edfe 100%)",
      },
      letterSpacing: {
        body: "-0.008em",
        h1: "-0.025em",
        tight2: "-0.02em",
        tight15: "-0.015em",
        eyebrow: "0.13em",
        micro: "0.11em",
      },
      maxWidth: {
        content: "1020px",
        "content-wide": "1020px",
        form: "780px",
        prep: "860px",
        summary: "900px",
        profile: "720px",
      },
      keyframes: {
        spin: { to: { transform: "rotate(360deg)" } },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "spin-slow": "spin .9s linear infinite",
        "fade-in": "fade-in .3s ease both",
        "slide-up": "slide-up .38s cubic-bezier(.22,1,.36,1) both",
        "scale-in": "scale-in .2s ease both",
      },
    },
  },
  plugins: [],
};
