# Star4ce Frontend

Next.js app for the Star4ce dealership hiring / workforce platform. It talks to the Flask API in `star4ce-backend/`.

**Full architecture, deployment, and operations:** see the repo root [`README.md`](../README.md).

---

## Stack

- **Next.js** 16 (App Router), **React** 19, **TypeScript**
- **Tailwind CSS** 4
- API calls use `NEXT_PUBLIC_STAR4CE_API_BASE` (see below)

---

## Local development

### 1. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 2. Point the UI at the backend

Create `.env.local` in this folder (not committed) so the browser can reach the API:

```env
# Must match where Flask is running (backend defaults to port 5000 unless PORT is set)
NEXT_PUBLIC_STAR4CE_API_BASE=http://127.0.0.1:5000
```

If you omit this variable, the app falls back to a default in `src/lib/auth.ts`—set it explicitly so local dev always matches your backend port.

### 3. Run with the backend

1. Start API: `cd ../star4ce-backend && pip install -r requirements.txt && python app.py`
2. Health check: `GET http://localhost:5000/health` (or your `PORT`)
3. Start frontend: `npm run dev` here

---

## Scripts

| Command        | Purpose        |
|----------------|----------------|
| `npm run dev`  | Dev server     |
| `npm run build`| Production build |
| `npm run start`| Serve production build (`PORT` supported) |
| `npm run lint` | ESLint         |

---

## Deployment (Railway)

Env vars are set in **Railway → your Next.js service → Variables** (not in git).

There are **two hosted setups**: **development** (testing) and **production** (customers). Each frontend service must set `NEXT_PUBLIC_STAR4CE_API_BASE` to the **backend public URL for that same environment** (dev frontend → dev API only; prod → prod API only).

Full runbook: root [`README.md`](../README.md).

---

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
