# CareerOS — Complete System Map (Monorepo)

**Repo:** https://github.com/creative-kalfan/career_os (`main`)
**Layout:** `frontend/` (Vite + TanStack) + `backend/` (FastAPI) ·
**Histories:** `git subtree` imports, no squashes ·
**Live:** https://careeros-frontend-three.vercel.app · API https://career-os-kr9m.onrender.com

This file tells a reviewer how the entire system works in the monorepo layout.
Deep backend reference (pre-migration paths use `careeros-backend-py/`, read as
`backend/`): [backend/COMPLETE_SYSTEM.md](./backend/COMPLETE_SYSTEM.md).
Backend setup: [backend/README.md](./backend/README.md). Start: [README.md](./README.md).

---

## 1. What CareerOS is

AI-powered Career Operating System: one truthful pipeline from candidate
evidence to hired.

1. Upload PDF/DOCX → deterministic parse → structured `ResumeProfile` + completeness score.
2. Resume Studio (`/resumes/$id`): left = AI intelligence/suggestions/versions,
   right = real resume (`PreviewPane` / PDF bytes). No fake scores.
3. ATS analysis vs any JD: 5 deterministic sub-scores + requirement coverage with
   evidence locations; optional LLM semantic reconciliation (upgrade 0.70 / override 0.85)
   with hallucination guards. Deterministic engine stays the score authority.
4. Optimization: skills/summary/bullet proposals with diffs + provenance
   (`gap_fill`, `experience_grounded`). Accept → atomic apply into a **derived**
   version (master never edited directly). Export PDF/DOCX via binary streaming.
5. Jobs: multi-source ingestion (Ashby, Greenhouse, Lever, SmartRecruiters,
   Firecrawl, YC, Adzuna India, JobSpy) → normalize → dedup
   (`source_platform`, `external_job_id`) → stale-deactivate → 8-factor
   personalized match (role 20, skill 20, resume 15, exp 10, location 15,
   salary 10, company 5, freshness 5) with India-first tiebreak.
6. Recommendations feed + in-app notifications (event-driven) + Applications Kanban.

What it is **not**: no whole-resume LLM rewrite, no fake readiness %, no email/push,
no BYOK, no second matching engine, no separate microservices.

---

## 2. Monorepo layout & migration

```
career_os/
├── frontend/   # from creative-kalfan/careeros-frontend@78822f4 (70 commits)
├── backend/    # from creative-kalfan/careeros-backend-py@79adab4 (130 commits)
├── .github/workflows/  # crawl-scheduler, backend-tests, resume-studio-regression
├── README.md / COMPLETE_SYSTEM.md / .gitignore
```

- **Method:** `git subtree add --prefix=frontend <frontend-url> main` then
  `--prefix=backend <backend-url> main` on a fresh `main` (one empty init commit
  + two subtree merges). Full histories preserved; `git log -- frontend/` and
  `git log -- backend/` show the original commits.
- **No architecture rewrite:** no package-manager merge, no moved app code,
  no renamed internal packages. Only monorepo-required path fixes (below).
- **Nested `backend/.github` removed** after consolidating to root
  `.github/workflows` (GitHub only runs root workflows).

### Path fixes applied (only breakages)

| File | Old | New | Why |
|---|---|---|---|
| `frontend/playwright.config.ts` | `../careeros-backend-py/.env` | `../backend/.env` | sibling rename |
| `frontend/tests/e2e/*.spec.ts` (5) | `../../../careeros-backend-py` | `../../../backend` | sibling rename |
| `frontend/src/auth/careeros.code-workspace` | 2 legacy entries | `../../../backend` | remove dangling legacy backend |
| `.github/workflows/backend-tests.yml` | `working-directory: careeros-backend-py` | `working-directory: backend` | monorepo path |
| `.github/workflows/resume-studio-regression.yml` | `careeros-backend-py/**` paths | `backend/**` paths | monorepo path |

Docs/comments referencing old dir names were left as history.

---

## 3. Data flow (request → DB → worker → notification)

```
Browser
 ├─ Auth: Supabase email/password → ES256 JWT (frontend stores session)
 ├─ Upload: PUT directly to Storage `resumes/{user_id}/{uuid}.ext` (RLS path check)
 └─ API: Authorization: Bearer <jwt> → backend
        ▼
backend/app/main.py (CORS allowlist, error envelope, lifespan)
 ├─ dependencies.get_current_user: JWKS ES256 verify (PyJWT[crypto]) → AuthContext
 ├─ Route (thin) → Service (domain) → Repository (PostgREST, RLS client)
 ├─ EventBus.publish(event, context=AuthContext) — context outside event
 └─ ARQ enqueue (Redis) for crawl/parse/intelligence
        ▼
Supabase PostgreSQL (RLS) + Storage  ◀──  ARQ workers (service-role client only)
        ▼
RecommendationGenerated → NotificationSubscriber → in-app inbox
Crawl tick (GitHub Actions every 10 min) → claim due targets (SKIP LOCKED + lease)
 → enqueue crawl_company_job → normalize/upsert/deactivate → JobIngested (no subscribers)
```

Key invariants:

- `posted_at` is the source posting date (NULL = unknown, UI shows “Date unavailable”);
  `created_at` is never a posting date.
- Dedup identity `(source_platform, external_job_id)` + partial unique index
  (migration 013); cross-source uncertain matches stay separate rows.
- Stale deactivation is source-scoped, post-success only; jobs never deleted.
- Master resume invariant: partial unique index `uq_master_per_resume`.
- LLM never returns scores; malformed JSON rejected; provider failure → deterministic fallback.

---

## 4. API surface (representative)

Auth: `GET /auth/me` · Resumes: `GET/POST /api/resumes`, `PATCH /api/resumes/{id}`
(`{content:{profile}}`), `POST /api/resumes/{id}/parse` ·
Versions: `GET/POST /api/resumes/{id}/versions`, `POST .../versions/{vid}/apply-operation`
(`replace`/`insert`/`delete`), `.../set-master`, `.../duplicate` ·
ATS: `POST /api/ats/analyze` (`resumeId`, `versionId`, `jobDescription`) ·
Optimization: `POST /api/optimization/generate`, `/skills/generate`,
`/summary/generate`, `/experience/bullet/generate`, `/suggestions/accept|reject` ·
Jobs: `GET /jobs`, `/jobs/{id}`, `/jobs/personalized`, `/jobs/saved|save|{id}/unsave`,
`POST /jobs/match|search` · Intelligence: `GET/POST /jobs/{id}/intelligence|analyze` ·
Recs: `GET /recommendations|top`, `POST /refresh|save|dismiss` ·
Applications: CRUD + `/stats` · Notifications: inbox + `/notification-preferences` ·
Profile: `GET/PATCH /api/profile/me` · Export: `GET /api/export/resumes/{rid}/versions/{vid}/pdf|docx` (blob).

Frontend clients: `frontend/src/api/*` (17) + hooks `frontend/src/hooks/api/*` (16);
long LLM/compile/export calls use `LONG_REQUEST_TIMEOUT_MS` (120 s), fresh
AbortController on 401-refresh retry.

---

## 5. Workers, scheduler, ingestion

- **Services:** `ScheduledCrawlRunner` enqueues `crawl_company_job`; Redis `SET NX EX`
  locks prevent concurrent duplicate crawls; ARQ retries ≤ 2.
- **Scheduler modes:** `CRAWL_SCHEDULER_MODE=worker|github`. Prod uses GitHub tick
  (`crawl-scheduler.yml`) + Render worker consuming jobs; inline fallback if Redis down.
- **Sources:** ATS adapters (Ashby/Greenhouse/Lever/SmartRecruiters),
  Firecrawl curated startups, YC, Adzuna India (path pagination, 20-query rotation,
  2/crawl, ~5 calls/day), JobSpy (Naukri/LinkedIn, bounded rotation, optional dep).
- **Pipeline:** `JobIngestionService → JobService (normalize/validate/enrich-guard) → JobRepository.upsert_jobs` →
  `deactivate_stale_jobs(source_platform)` → `JobIngested` event (system-scoped).

---

## 6. Deployment & environments

**Frontend (Vercel):** Root `frontend`, build `npm run build`, Nitro preset
`vercel` (`frontend/vite.config.ts`), dev `:8080` pinned for CORS.
Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_API_BASE_URL` (prod `https://career-os-kr9m.onrender.com`).

**Backend (Render):** Root `backend`, context `backend/`,
`Dockerfile` (`WORKDIR /app`, Typst + Chromium layers) + `start.sh`
(web: uvicorn `$PORT`; worker: dummy `$PORT` listener + ARQ).
Env: `SUPABASE_*`, `REDIS_URL` (`rediss://` prod), `SCHEDULER_TRIGGER_SECRET`,
`CRAWL_TICK_URL`, LLM keys, `MAX_RESUME_UPLOAD_BYTES` (default 10 MB).
CORS: `GET,POST,PATCH,DELETE,OPTIONS`; `Authorization, Content-Type`;
origins include `https://careeros-frontend-three.vercel.app`.

**No secrets in git:** only `.env.example` files tracked; `.env`, `*token*`,
`*auth*` ignored at root + subtrees. Verified via `git ls-files | grep -i env`.

---

## 7. Testing & verification

- Frontend: `npm run build` (Nitro SSR), `npx tsc --noEmit` (0 errors),
  `npm test` — 8 suites / 215 tests.
- Backend: `python -m pytest` (hermetic, `asyncio_mode=auto`, `-m "not live"`);
  `pytest tests/test_resume_studio_regression.py -v` for Studio goldens.
- Targeted: `test_job_ingestion_2o.py` (15), `test_job_stabilization.py` (5).
- Known pre-existing fails (clean-tree verified): copilot 404 stubs + visual goldens.

---

## 8. Security model

RLS on every user table (`auth.uid() = user_id` or ownership `EXISTS`);
Storage RLS `(foldername(name))[1] = auth.uid()`; service-role only in workers;
app-level ownership checks paired with RLS (never repo filtering alone);
generic client errors + server-side logging; upload size guard pre-parse;
`SCHEDULER_TRIGGER_SECRET` bearer on tick endpoint; 404 (not 403) on cross-user
reads to avoid existence leaks.

---

## 9. Where to look next

- Architecture decisions: `backend/docs/` + `backend/COMPLETE_SYSTEM.md` §§8–10.
- Migrations: `backend/sql/migrations/` (000–021; 013 dedup, 020 feature columns).
- Domain rules: `AGENTS.md` §§5.1–5.15 (recommendations, notifications, events,
  ingestion, Studio, LLM gateway, ATS semantic, security, interview prep,
  tailoring, evidence discovery).
- Perf forensics: `frontend/FRONTEND_PERFORMANCE_FORENSIC_REPORT.md`.
