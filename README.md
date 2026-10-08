# CareerOS — AI-powered Career Operating System

CareerOS replaces disconnected job-search tools (resume builders, ATS scanners,
job boards, spreadsheets) with a single truthful pipeline:
**candidate evidence → job requirements → explainable match → version-safe resume tailoring.**

- **Live product:** https://careeros-frontend-three.vercel.app
- **Live API:** https://career-os-kr9m.onrender.com (`GET /health`)
- **Monorepo:** `frontend/` + `backend/` — independent deploys, shared contracts.

> This repository was consolidated from two canonical histories via
> `git subtree` (no rewrites, no squashes):
> `creative-kalfan/careeros-frontend` → `frontend/`,
> `creative-kalfan/careeros-backend-py` → `backend/`.
> See [COMPLETE_SYSTEM.md](./COMPLETE_SYSTEM.md) for the full system map.

---

## Architecture

```
Browser (Vite + TanStack Start, :8080 dev / Vercel prod)
  │  Supabase Auth (ES256 JWT) + direct Storage upload (resumes/{user_id}/{uuid})
  ▼
frontend/ ──Bearer JWT──▶ backend/ (FastAPI, :8000 dev / Render prod)
                            │  ES256 JWKS verify → RLS-scoped Supabase client
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  Domain Services     In-process EventBus   ARQ + Redis workers
  (ATS, parsing,      (JobIngested,         (crawl, parse, intelligence)
   optimization,       RecommendationGenerated)
   ingestion, recs)
        │                   │                   │
        ▼                   ▼                   ▼
  Repositories (PostgREST)  Notification        External integrations
        │                   subscriber          (Ashby/Greenhouse/Lever/
        ▼                                       SmartRecruiters, Adzuna,
  Supabase PostgreSQL 15+                       JobSpy, Firecrawl, YC,
  (21 tables, RLS,                              LLM: Groq/Gemini/Mistral)
  dedup + master-version indexes)
```

- **Frontend owns:** UI, routing, TanStack Query cache, Supabase session,
  route guards, direct Storage uploads. Never enqueues jobs directly.
- **Backend owns:** JWT verification, RLS queries, business logic, ARQ dispatch,
  ATS analysis, ingestion orchestration, resume parsing.
- **Data:** Supabase PostgreSQL (RLS) + Storage. Both sides talk to the same project.
- **Background work:** backend-only (ARQ + Redis, APScheduler/GitHub Actions tick).

Full map: [COMPLETE_SYSTEM.md](./COMPLETE_SYSTEM.md) ·
Backend detail: [backend/README.md](./backend/README.md) ·
Backend system reference: [backend/COMPLETE_SYSTEM.md](./backend/COMPLETE_SYSTEM.md) ·
Frontend: [frontend/](./frontend/)

---

## Repository layout

```
career_os/
├── frontend/                  # Vite 8 + TanStack Start/Router/Query + React 19 (Vercel)
│   ├── src/routes/            # File-based routes
│   ├── src/api/               # Typed backend clients (request.ts + AbortController)
│   ├── src/components/        # resume, ats, jobs, applications, …
│   └── package.json           # `npm run build` / `npm test` (vitest)
├── backend/                   # FastAPI + Uvicorn, Python 3.11+ (Render)
│   ├── app/api/routes/        # Thin route handlers
│   ├── app/services/          # Business logic (ATS, ingestion, optimization, recs)
│   ├── app/repositories/      # Supabase data access
│   ├── app/workers/           # ARQ jobs + scheduler
│   ├── sql/migrations/        # Numbered idempotent migrations
│   ├── tests/                 # Pytest hermetic suite (live behind `-m live`)
│   ├── Dockerfile + start.sh  # Render entrypoint (web vs worker via SERVICE_TYPE)
│   └── requirements.txt
├── .github/workflows/         # crawl-scheduler, backend-tests, resume-studio-regression
├── README.md
├── COMPLETE_SYSTEM.md
└── .gitignore
```

This is a **monorepo, not a rewrite**: no merged package managers,
no moved application code, no second matching/scoring engine.
Frontend and backend build and test independently.

---

## Quickstart (independent)

### Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
npm ci
npm run dev             # http://localhost:8080 (pinned for backend CORS)
npm run build           # Vite + Nitro (vercel preset) → .output/
npm test                # vitest run src/
```

### Backend

```bash
cd backend
cp .env.example .env   # set Supabase URL/keys, REDIS_URL, provider keys
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
python -m pytest       # hermetic (excludes -m live)
```

---

## Deployment (must stay green)

### Frontend — Vercel

- **Root Directory:** `frontend`
- **Build Command:** `npm run build` (default from `frontend/package.json`)
- **Output:** Nitro `.output/` (preset `vercel` in `frontend/vite.config.ts`)
- **Env:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_API_BASE_URL=https://career-os-kr9m.onrender.com`
- Production guard in `frontend/src/config/env.ts` forces the canonical API URL
  when a localhost URL leaks into a prod build.

### Backend — Render

- **Root Directory:** `backend`
- **Docker Context:** `backend/` (`backend/Dockerfile`, `WORKDIR /app`, `COPY . .`)
- **Web:** `./start.sh` → `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Worker:** same image, `SERVICE_TYPE=worker` → dummy `$PORT` listener + `python -m arq app.workers.settings.WorkerSettings`
- **Env:** `SUPABASE_*`, `REDIS_URL` (`rediss://` + auth in prod),
  `SCHEDULER_TRIGGER_SECRET`, `CRAWL_TICK_URL`, LLM keys, `MAX_RESUME_UPLOAD_BYTES`.
- **CORS allowlist:** `https://careeros-frontend-three.vercel.app` +
  `localhost:8080/5173/3000` (`backend/app/main.py`).
- No `render.yaml` is checked in — Render is configured via dashboard;
  `Dockerfile` + `start.sh` are the contract.

### Scheduler — GitHub Actions

- `.github/workflows/crawl-scheduler.yml` — every 10 min `POST $CRAWL_TICK_URL`
  with `Authorization: Bearer $SCHEDULER_TRIGGER_SECRET`. Never crawls itself;
  claims use `FOR UPDATE SKIP LOCKED` + leases, ARQ retries ≤ 2.
- Secrets required: `CRAWL_TICK_URL`, `SCHEDULER_TRIGGER_SECRET`.
- `backend-tests.yml` and `resume-studio-regression.yml` use
  `working-directory: backend` and `backend/**` path filters.

---

## Contracts & conventions (do not break)

- **API envelope:** errors are `{ success: false, error: { code, message } }`
  with machine-readable `code` (`http_exception_handler` normalizes).
- **Resumes:** Studio saves via `PATCH /api/resumes/{id}` with
  `{ content: { profile } }`; exports via `requestBlob`
  (`/api/export/resumes/{id}/versions/{vid}/pdf|docx`); 120 s timeout
  (`LONG_REQUEST_TIMEOUT_MS`) for LLM/compile paths; 401 retry uses a fresh
  `AbortController`.
- **Recommendations:** reuse `PersonalizedJobService.calculate_match_score`
  (8 factors); no second engine; no LLM unless explicitly requested.
- **Notifications:** thin routes, repository persistence, RLS-only,
  in-app only (no email/push unless requested).
- **Events:** typed, serializable payloads; `publish(event, context=...)`
  carries auth outside the event; handler failures never break the producer.
- **Ingestion:** identity is `(source_platform, external_job_id)`;
  jobs are deactivated (`is_active`), never deleted; stale deactivation is
  source-scoped post-success only.
- **Resume Studio:** master is never edited directly — suggestions create
  derived versions via `/apply-operation` (`replace`/`insert`/`delete`).
- **LLM Gateway:** backend-only keys, `LLMGateway`/`ProviderRouter` only,
  typed Pydantic outputs, minimal context, `run_coro_sync` bridge (never
  `asyncio.run()` in sync services).
- **Security:** RLS client for user data + app-level ownership checks;
  generic error messages (log server-side); CORS allowlist (no `*`);
  upload size guard `MAX_RESUME_UPLOAD_BYTES`.

---

## Testing

| Suite | Command | Status |
|---|---|---|
| Frontend unit (Vitest, 8 suites) | `cd frontend && npm test` | 215 passed |
| Frontend typecheck | `cd frontend && npx tsc --noEmit` | 0 errors |
| Frontend prod build | `cd frontend && npm run build` | 1.5 s SSR build |
| Backend hermetic | `cd backend && python -m pytest` | 985 passed / 14 pre-existing fails* |
| Backend targeted | `cd backend && python -m pytest tests/test_job_ingestion_2o.py` | 15/15 |

\* Pre-existing on clean tree: 6× copilot 404 (stub-only) + 8× visual goldens
(Groq rate-limit fallback + pixel diffs). Verified via `git stash`.

---

## Docs

- [COMPLETE_SYSTEM.md](./COMPLETE_SYSTEM.md) — monorepo system map (start here).
- [backend/COMPLETE_SYSTEM.md](./backend/COMPLETE_SYSTEM.md) — deep backend reference.
- [backend/README.md](./backend/README.md) — backend setup & layout.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — see backend docs (historical wrapper doc retired).
- `frontend/FRONTEND_PERFORMANCE_FORENSIC_REPORT.md` — measured perf deltas.
- `frontend/AGENTS.md` + `backend/AGENTS.md` (via subtree) — agent operating guides.

---

## Contributing

Small, targeted diffs. Extend existing modules instead of duplicating.
Update `COMPLETE_SYSTEM.md` when you add a service, table, job type, or
frontend module pattern. Verify with the targeted suite before pushing.
