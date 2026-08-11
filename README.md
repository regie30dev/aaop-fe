# aaop-fe

Front-end for the AAOP application — the client that consumes / integrates with the
back-end (BE) API. Built with **React + TypeScript + Vite**.

This first milestone implements the **OrcaHR Dashboard** screen from the design in
`uidesign/FE_UI_1.png`. (The "Become Pro Users" promo box from the design is
intentionally omitted per the project plan.)

## Tech stack

- **React 19** + **TypeScript**
- **Vite** (dev server + build)
- **recharts** — area & bar charts
- **lucide-react** — icons
- **CSS Modules** + CSS custom properties for theming

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
npm run lint     # run oxlint
```

## Project structure

```
src/
  main.tsx                     # app entry
  App.tsx                      # shell: sidebar + main content
  index.css                    # global reset + design tokens (CSS variables)
  types/                       # shared TypeScript types
  data/                        # mock data (to be replaced by BE API calls)
  components/
    layout/                    # Sidebar, Topbar
    dashboard/                 # StatCards, charts, EmployeeTable
  pages/
    Dashboard/                 # dashboard page composition
```

Each component lives in its own folder with a colocated `*.module.css` file.

## Notes

- Data currently comes from `src/data/dashboardData.ts`. When BE integration begins,
  swap these modules for API calls (e.g. a `services/` layer + data-fetching hooks).
