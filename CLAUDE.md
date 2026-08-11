# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`aaop-fe` is the front-end for the AAOP application ("OP Assets") — the React client that
will consume/integrate with a back-end (BE) API. The plan for the project lives in `plan.md`.
The first milestone is a single **Dashboard** screen implemented from the design in
`uidesign/FE_UI_1.png`. The "Become Pro Users" promo box from that design is **intentionally
omitted** per the plan — don't re-add it.

## Commands

```bash
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # tsc -b (type-check) THEN vite build → dist/
npm run lint     # oxlint
npm run preview  # serve the production build
```

- `npm run build` is the type-check gate: `tsc -b` runs before the bundle, so a type error
  fails the build. Run it to verify changes compile.
- There is **no test runner** configured (no Vitest/Jest). Don't invent test commands.
- Lint is **oxlint** (not ESLint), configured in `.oxlintrc.json` with the react/typescript/oxc
  plugins; `react/rules-of-hooks` is an error.

## Architecture

Stack: React 19 + TypeScript + Vite, `recharts` for charts, `lucide-react` for icons,
**CSS Modules** for component styles.

**Theming is token-driven.** All colors live as CSS custom properties in `src/index.css`
(`:root`) — a blue-dominant / red-accent / white palette. Components reference them via
`var(--color-*)`. Change the theme there, not in components.
- **Gotcha:** `recharts` props (`fill`, `stroke`, gradient `stopColor`) and CSS `linear-gradient()`
  cannot read CSS variables, so those spots use **hardcoded hex** that must be kept in sync with
  the tokens by hand. They live in the chart components (`AvgWorkHoursChart.tsx`,
  `WorkHoursMonthChart.tsx` + its `.module.css`), the sidebar logo gradient, the topbar badge,
  and `avatarColor` fields in the data. When retheming, grep for the old hex values across `src/`.

**Data layer is mock, typed, and centralized.** All screen data comes from
`src/data/dashboardData.ts`, typed by `src/types/index.ts`. This is the seam for BE
integration: replace these modules with an API/service layer + data-fetching, keeping the types.
Components read data directly from `src/data` today — there is no store or fetching layer yet.

**Component convention:** each component is its own folder with a colocated `*.module.css`.
- `src/components/layout/` — `Sidebar`, `Topbar` (app chrome)
- `src/components/dashboard/` — the dashboard widgets (`StatCards`, the two charts, `EmployeeTable`)
- `src/pages/Dashboard/` — composes the widgets; `App.tsx` is the shell (Sidebar + main).

**Sidebar drawer state is lifted to `App`.** `App` owns `sidebarOpen` and threads it down:
`App → Sidebar(isOpen, onClose)` and `App → Dashboard(onMenuClick) → Topbar(onMenuClick)`.
Below the **880px** breakpoint the sidebar becomes an off-canvas drawer opened by the Topbar
hamburger and dismissed by a backdrop or by tapping a nav item (`onClose`). Responsive
breakpoints used across the CSS modules: **1180 / 980 / 880 / 640 px**.

**No router.** Navigation is presentational only; the active sidebar item is a hardcoded
constant (`activeItem` in `Sidebar.tsx`). Adding real routing means introducing a router and
driving that active state from the current route.
