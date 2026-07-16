# AI Hiring Copilot — Frontend (Hazel)

React (Vite) + Tailwind CSS + shadcn/ui-style primitives, implementing the 9
screens from the design handoff.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
```

Copy everything under this folder into your `/ai-hiring-copilot/frontend`.

## Structure

```
src/
  components/
    shell/        AppShell, Sidebar, Topbar, PageContainer
    ui/           Button, Card, Badge, Input, Textarea (shadcn-style)
  data/mock.js    ALL mock data + scoreBand() — every real API TODO lives here
  lib/            routes.js (paths, nav, crumbs), utils.js (cn)
  pages/          one file per screen
  router.jsx      all 9 routes under AppShell
```

## Design tokens

Encoded in `tailwind.config.js` (colors, radii, shadows, tracking, max-widths)
and `src/index.css` (Manrope, body letter-spacing, `.h1` / `.eyebrow` /
`.micro-label` helpers). Use these rather than raw hex where possible.

## Build order (review-gated)

- [x] **Step 1 — App shell**: sidebar + top bar + routing. Pages are
      placeholders that render inside the shell so nav/active-state/breadcrumb
      can be reviewed against the prototype.
- [ ] Step 2 — Dashboard
- [ ] Step 3 — JD → Resumes → Processing → Ranked flow
- [ ] Step 4 — Candidate Detail → Prep → Email → Summary

## Wiring the real backend

The prototype fakes everything with local state/timers. All of that is isolated
in `src/data/mock.js`, which lists the FastAPI endpoints each export should come
from. Recommended: add React Query / SWR and swap the imports screen-by-screen.
The Processing screen should kick off the screening job and poll a `/status`
endpoint (~2s) per the README, then navigate to Ranked. Look for `TODO(api)`.
```
