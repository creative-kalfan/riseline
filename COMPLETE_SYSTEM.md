# Riseline Monorepo Complete System Definition

This document represents the current, verified state of the Riseline (formerly CareerOS) application following the monorepo migration and comprehensive codebase audit.

## 1. Core architecture & components
- **Frontend (`frontend/`)**: React 19, TypeScript, Vite, TanStack Start/Router/Query, Tailwind CSS, Supabase client, Vitest, Playwright. Configured with the Nitro `vercel` preset for production SSR/edge routing.
- **Backend (`backend/`)**: Python 3.11+, FastAPI, Pydantic v2, ARQ background workers.
- **Database/Storage**: Supabase (PostgreSQL 15+, pgvector, Row Level Security, Storage).
- **Queues**: Redis-compatible Valkey (managed).
- **Scheduled Ingestion**: GitHub Actions tick + ARQ workers.

## 2. Monorepo layout & migration
```
riseline/
├── frontend/   # Canonical frontend checkout
├── backend/    # Canonical backend checkout
├── .github/workflows/  # Consolidated CI & schedulers
└── README.md / COMPLETE_SYSTEM.md / .gitignore
```
*Note: The migration preserved historical git logs from the legacy `careeros-frontend` and `careeros-backend-py` repositories. Historical path references in migration commits remain intact for context.*

## 3. Data flow & Background Operations
- **Browser**: Auth via Supabase. Direct upload to Storage via RLS.
- **API**: Stateless FastAPI. Expects `Authorization: Bearer <jwt>`.
- **Worker**: ARQ processes background tasks (intelligence, crawl, parsing) utilizing service-role credentials.

## 4. GitHub Actions & Scheduler Contract
- **Crawl Tick (`.github/workflows/crawl-scheduler.yml`)**: Dispatches every 10 minutes.
- **Endpoint Target**: `POST /internal/scheduler/crawl-tick`
- **Authentication**: `Authorization: Bearer <SCHEDULER_TRIGGER_SECRET>`. The endpoint performs a secure HMAC comparison against the environment variable.
- **Status (Verified Code, Unverified External)**: The YAML and backend contract are 100% correct, however, execution currently requires the user to populate the `CRAWL_TICK_URL` and `SCHEDULER_TRIGGER_SECRET` in the `creative-kalfan/riseline` GitHub Actions Secrets.

## 5. Deployment Configuration & Environments
**Frontend (Vercel)**
- **Root Directory:** `frontend`
- **Build Command:** `npm run build` (or implicit via Nitro preset)
- **Environment:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL` (legacy frontend remains deployed at `https://careeros-frontend-three.vercel.app` until switchover).
- **Status:** **READY**. Local builds verified clean.

**Backend API (Render)**
- **Root Directory:** `backend`
- **Start Command:** `start.sh` or Uvicorn invoking FastAPI.
- **Environment:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`, `SCHEDULER_TRIGGER_SECRET`, `CORS_ALLOWED_ORIGINS` (explicitly allows legacy Vercel URL to avoid breaking production).
- **Status:** **READY**. 1420 tests passing.

**Backend Worker (Render)**
- **Root Directory:** `backend`
- **Start Command:** Must execute ARQ (e.g. `arq app.workers.settings.WorkerSettings`).
- **Environment:** Identical to API, ensuring matched `REDIS_URL`.
- **Status:** **READY**.

## 6. Audit & Verification Results
- **Frontend Test Suite:** Passed (320 tests, requires `VITE_SUPABASE_URL` injected for test run).
- **Backend Test Suite:** Passed (1420 tests via hermetic pytest).
- **Static Checks:** TypeScript zero-emit passing, Python compilation clean.
- **Branding:** UI components successfully migrated to the "Riseline" moniker. System internal queues safely preserve historical names (`careeros_worker_health`) to prevent background worker disconnects.
- **Production Status:** The codebase is fully repaired and verified locally. The **Live Production Environment** is pending user connection of external CI secrets and Vercel/Render dashboard realignment to the new monorepo layout.
