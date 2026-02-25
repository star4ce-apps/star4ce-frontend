# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Star4ce is a **frontend-only** Next.js 16 (App Router) application — a people analytics platform for automotive dealerships. It communicates with a **separate backend API** (not in this repo) at `http://127.0.0.1:5000` by default, configurable via `NEXT_PUBLIC_STAR4CE_API_BASE`.

### Quick reference

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000, Turbopack) |
| Lint | `npm run lint` (ESLint 9) |
| Build | `npm run build` |
| Production server | `npm run start` |

### Important notes

- **No backend in this repo.** All authenticated features (dashboard, analytics, employees, candidates, surveys, settings) require the backend API. Public/marketing pages (home, about, pricing, case studies, login/register forms) render without it.
- **Pre-existing lint errors.** `npm run lint` reports ~200 errors and ~121 warnings that are pre-existing in the codebase (mostly `@typescript-eslint/no-explicit-any`, unused vars, and `@next/next/no-img-element`). These are not regressions.
- **Pre-existing build type error.** `npm run build` fails with a TypeScript error in `src/app/employees/[id]/page.tsx:458` (`Property 'name' does not exist on type 'Promise<any>'`). The dev server (`npm run dev`) is unaffected since Turbopack doesn't enforce strict type checking.
- **Backend API config.** Set `NEXT_PUBLIC_STAR4CE_API_BASE` env var to point to the backend. Default is `http://127.0.0.1:5000`. The frontend normalizes this value (strips trailing slashes, paths, etc.).
- **Node.js version.** Tested with Node.js v22. No `.nvmrc` or `.node-version` file exists in the repo.
