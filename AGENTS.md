# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Star4ce is a people analytics platform for automotive dealerships ("Better Hires, Fewer Exits"). The system has two repos:

- **Frontend** (`/workspace`): Next.js 16 (App Router), port 3000
- **Backend** (`/workspace/star4ce-backend`): Python Flask API, port 5000, uses SQLite locally

### Quick reference — Frontend

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000, Turbopack) |
| Lint | `npm run lint` (ESLint 9) |
| Build | `npm run build` |

### Quick reference — Backend

| Task | Command |
|------|---------|
| Install deps | `pip install -r requirements.txt` (in `star4ce-backend/`) |
| Dev server | `python3 app.py` (port 5000, auto-creates SQLite DB) |
| Reset DB | `python3 reset_db.py --yes` |

### Running both services

1. **Backend first:** `cd /workspace/star4ce-backend && python3 app.py` (port 5000)
2. **Frontend:** `cd /workspace && npm run dev` (port 3000)
3. The frontend defaults to `http://127.0.0.1:5000` for API calls. Override with `NEXT_PUBLIC_STAR4CE_API_BASE`.

### Important notes

- **Backend .env required.** The backend needs a `.env` file in `star4ce-backend/` with `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_PRICE_ID_ANNUAL`, and other vars. Without `DATABASE_URL`, it uses SQLite (auto-created at `instance/star4ce.db`).
- **`SHOW_EMAIL_CODES=1`** in the backend `.env` prints email verification codes to the console, useful for local dev without a real email service.
- **Pre-existing lint errors.** `npm run lint` reports ~200 errors and ~121 warnings pre-existing in the codebase (mostly `@typescript-eslint/no-explicit-any`, unused vars, `@next/next/no-img-element`). Not regressions.
- **Pre-existing build type error.** `npm run build` fails on `src/app/employees/[id]/page.tsx:458`. The dev server (`npm run dev`) is unaffected.
- **Node.js version.** Tested with Node.js v22. No `.nvmrc` file in the repo.
- **Backend auto-migrates.** The Flask app runs column-level migrations on startup, so there's no separate migration step.
