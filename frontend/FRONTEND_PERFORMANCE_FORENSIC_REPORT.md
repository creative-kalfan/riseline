# FRONTEND PERFORMANCE FORENSIC REPORT - CareerOS

Date: 2026-10-06. Forensic first. No migration. No backend changes.

## 1. Executive summary

CareerOS feels slow after login for three proven reasons, none of which is TanStack itself: (A) the production build is compiled for the wrong runtime, nitro preset cloudflare-module with wrangler output, while production is served on Vercel and the Dockerfile expects a Node server, so deployment is misconfigured before any code runs. (B) The initial JavaScript is very heavy, 4.38 MB of client assets, with three.js, pdfjs, recharts and framer-motion statically imported into first-paint routes and zero React.lazy code splitting in src. (C) Login is a serial waterfall, full-screen blank spinner until Supabase session plus backend profile plus onboarding gate resolve, then the dashboard mounts a WebGL scene and fires 6 backend requests that each serially await a session read first.

Measured client bundle, file .output/public/assets, total 4383626 bytes: pdf.worker 1375838, dashboard chunk 576121, resume detail chunk 521934, landing chunk 385257, shared request chunk 216932, CSS 187541, app shell 88831, jobs 64703, applications 45951. Server bundle confirms heaviness: three 1216 KB, TanStack router 659 KB, pdfjs 578 KB, framer-motion 359 KB, sentry 346 KB, supabase auth 302 KB.

Verdict preview: keeping TanStack is viable. A Next.js migration is not justified by the evidence. A plain React plus Vite SPA is sufficient and is the recommended target only after lazy-loading and waterfall fixes, which remove an estimated 70 to 80 percent of perceived latency without any migration.

## 2. Current architecture

- Frontend: TanStack Start plus TanStack Router plus React 19 plus Vite 8 plus Nitro, configured through the Lovable wrapper at vite.config.ts. Server entry src/server.ts wraps TanStack server entry with h3 error normalization. Router built in src/router.tsx with defaultPreloadStaleTime 0 and a QueryClient that is then ignored, because src/routes/__root.tsx mounts a second QueryClient inside QueryProvider, src/providers/query-provider.tsx. Two clients exist, only one is used.

- Auth: Supabase JS client, src/lib/supabase.ts, session in AuthProvider, src/auth/AuthProvider.tsx, backend calls carry Bearer tokens attached per request by src/auth/http-interceptor.ts attachAuthToken, which awaits supabase.auth.getSession on every request.

- Data: TanStack Query v5, sane defaults, retry 1, refetchOnWindowFocus false, staleTime 5 min, gcTime 10 min. Dashboard aggregates 4 parallel queries in useDashboardData plus 1 telemetry query, src/hooks/api/useDashboardData.ts and useDashboardTelemetry.ts.

- Rendering: no Suspense boundaries, no React.lazy anywhere in src, global AuthLoadingSpinner blank screen, per-widget Skeletons, PageTransition with AnimatePresence mode wait on every route change, framer-motion stagger on dashboard, two always-on three.js WebGL scenes, dashboard Career3DTopology and landing CareerSignalCanvas.

## 3. Vercel deployment diagnosis

- Evidence: .output/nitro.json preset is cloudflare-module with cloudflare deployConfig, generated wrangler.json and .wrangler/deploy/config.json. Dockerfile instead builds and runs node .output/server/index.mjs on port 3000. No vercel.json exists, so Vercel framework detection sees a TanStack Start plus Nitro project emitting a Cloudflare worker, not a Vercel serverless function and not a static SPA.

- Verdict: category A configuration plus C framework adapter, with F application code as contributor. The build artifact target and the hosting runtime disagree. Consequences observed or expected: SSR handlers that never execute on Vercel and fall back to client rendering after a blank shell, environment variables baked for the wrong runtime, preview 404s or stale chunks, and cache headers only correct for hashed assets via _headers, which Vercel ignores.

- Ruled out: B dependency versions build cleanly, D build failure the build succeeds in about 3 s, E env vars the app degrades to a canonical Render URL, G Vercel-specific behavior is secondary to the adapter mismatch.

- Required fix, not a migration: set the Nitro preset to vercel or node as appropriate, or deploy the Dockerfile to a container host and keep Vercel for preview only. One target, one host.

## 4. Login waterfall, measured by code path

- T0 click Sign in: supabase signInWithPassword, 1 network round trip to Supabase Auth, src/auth/auth.service.ts login.

- T1 AuthProvider initializeAuth effect: authService.getSession, local storage read, then fetchProfile, GET /api/profile/me, which first awaits attachAuthToken getSession read #2, then backend on Render, src/auth/AuthProvider.tsx lines 51-80.

- T2 onAuthStateChange SIGNED_IN fires and calls authService.getSession again, duplicate session read #3, lines 83-99. TOKEN_REFRESHED repeats the same duplicate later.

- T3 login page effect: if authenticated and profile missing, fetchProfile again with no dedup, a second concurrent GET /api/profile/me is possible, src/routes/_auth.login.tsx lines 46-59. The _app layout effect can fire yet another, src/routes/_app.tsx lines 40-44.

- T4 navigate to /dashboard: _app layout blocks shell on isInitialized or isLoading only, but the onboarding redirect needs profile, lines 46-80, so first paint of real UI waits on the profile round trip.

- T5 dashboard mount fires 5 backend queries in parallel, good, but each awaits its own getSession inside request, 5 more serial session reads, plus telemetry makes 6 backend calls total. Slowest call gates the skeleton release, _app.dashboard.tsx lines 99-123.

- T6 dashboard chunk 576 KB downloads, parses, compiles, then Career3DTopology constructs a WebGL renderer, 120 particles, 10 nodes, lights, rings, and starts a permanent requestAnimationFrame loop with per-frame raycasting, lines 166-499.

- Shape: login, session, profile serial, then jobs plus applications plus recommendations plus notifications plus telemetry parallel, then WebGL init serial before interactive. Estimated serial backend chain on warm session: auth 400 ms plus profile 600-2500 ms Render plus slowest dashboard query 600-2500 ms plus JS parse of 576 KB chunk 300-800 ms on mid mobile. Render cold start can multiply backend legs by 3 to 10x.

## 5. Network waterfall, dashboard mount inventory

- GET /api/profile/me, blocks onboarding routing, serial after session, dedup missing, cacheable 60 s, deferrable for shell: yes.

- GET /jobs/personalized, full list fetched to compute 4 bucket counts, over-fetch, cache 2 min, parallel: yes.

- GET /applications/stats plus transform, note useApplicationStats elsewhere derives stats from list cache but dashboard calls the stats endpoint directly, parallel: yes.

- GET /recommendations/top limit 5, small, parallel: yes.

- GET /notifications unbounded getAll to render 6 timeline rows, over-fetch, limit param exists but unused, parallel: yes.

- GET /api/dashboard telemetry, overlaps applications and resumes counts already fetched, partial duplication, parallel: yes.

- Plus 6 to 8 supabase.auth.getSession local reads, one per backend call plus init plus listener duplicate, each fast but serially awaited before its fetch, adding 5-15 ms per call and, worse, a refreshSession network call on any 401, src/utils/request.ts tryRefreshAndRetry.

- No polling, no realtime subscriptions, no N+1 beyond the session reads. Query keys are coherent. refetchOnWindowFocus is correctly off. retry 1 is sane. Duplicate observers: useDashboardData personalized key equals usePersonalizedJobs key shape, so cache is shared when filters match, positive.

## 6. Authentication analysis

- getSession call count, login to dashboard interactive: signIn 0, init 1, listener duplicate 1, profile attach 1, login-page refetch risk 1, layout refetch risk 1, 5 dashboard attaches 5, total 7 to 10 reads for one login. All but 401 refreshes are local and cheap, but each is awaited serially ahead of its network call, so they sit on the critical path and multiply under contention.

- getUser network call only on USER_UPDATED events, rare, not a login cost. Correct call.

- Rerenders: AuthProvider value memo has 20 deps and any status change re-renders the whole tree under it, including the dashboard. login sets status loading then authenticated, 2 global renders before data. Acceptable but shell-first rendering would isolate it.

- Minimum to render: shell plus nav needs only cached session user id and email, available synchronously after getSession. Skeleton needs nothing network. Profile is needed only for the onboarding gate and greeting, and can resolve after shell paint. Token refresh must never blank the UI; today TOKEN_REFRESHED refetches session and can flip loading states.

- Defect: profile fetch has a failure latch, profileFetchFailedRef, that permanently stops retries until forced, lines 30-48. One transient 401 during refresh kills the profile for the session, leaving the onboarding gate in a guess state.

## 7. Bundle analysis

- Route splitting works at the TanStack level, per-route chunks exist, but heaviness is inside the chunks: dashboard 576 KB ships three.js statically, resume detail 522 KB ships pdfjs plus editor, landing 385 KB ships a second three.js scene, shared request chunk 217 KB carries supabase plus sentry weight.

- framer-motion is imported by nearly every route and by global PageTransition, so it is effectively initial JS. recharts ships with dashboard widgets and ui chart. react-day-picker ships with ui calendar wherever forms render. embla carousel ships with ui carousel. pdfjs worker 1.37 MB is correctly a separate file with ?url import, but it is still downloaded on resume routes that users hit early.

- No barrel-file catastrophe found, imports are per-component. lucide-react icons are per-icon imports and already split into tiny chunks, see dozens of 1-3 KB icon chunks, good. date-fns, zod, cmdk are modest.

- Lazy candidates ranked by bytes saved on first paint: Career3DTopology plus three, pdf-canvas-preview plus pdfjs, dashboard recharts widgets, landing cinematic scenes, day-picker calendar, embla carousel. Expected initial JS reduction 45 to 60 percent.

## 8. Render analysis

- Dashboard mounts WebGL plus motion stagger plus recharts plus 5 resolving queries at once. Career3DTopology runs raycast against 10 meshes every frame even with no pointer movement, and setFps triggers a component re-render every 800 ms forever. Landing mounts all 6 cinematic scenes simultaneously and toggles opacity, so 6 scenes of DOM exist at all times.

- PageTransition AnimatePresence mode wait delays every route render until the exit animation finishes, adding hundreds of ms to perceived transitions for zero data benefit.

- Context: AuthProvider, ThemeProvider, SidebarProvider, CopilotProvider nest above Outlet. Only AuthProvider churns globally. No memo abuse found; derived dashboard formatters run per render but on small arrays, not a bottleneck. Do not add memo; remove work instead: lazy WebGL, unmount hidden landing scenes, drop wait transitions.

## 9. Data-fetching analysis

- Strategy is coherent: TanStack Query with 1-5 min staleTime, gcTime 10 min, no focus refetch, keepPreviousData on job lists, optimistic mutations for notifications and application delete. No migration to another server-state layer is needed.

- Issues: dual QueryClients, router client is dead weight, defaultPreloadStaleTime 0 disables preload caching, notifications fetched unbounded for a 6-row widget, telemetry overlaps stats endpoints, useApplicationStats derives from list cache while dashboard calls the stats endpoint, two sources of truth for one number. Invalidation is broad, invalidate all applications on any child mutation, causing refetch storms after writes.

## 10. Perceived-performance analysis

- The app feels slow because the user watches a blank dark spinner through the three slowest serial legs, JS download plus session plus profile, with no shell, no nav, no skeleton. Target UX is shell instantly from cached session, skeleton immediately, widgets hydrate progressively. The gap is entirely sequencing, not backend speed.

- Skeletons exist but release late: full dashboard skeleton requires both aggregated and telemetry queries pending, and the shell spinner precedes all of it. Route transitions feel heavy due to mode wait plus full-page motion variants.

- Optimistic UI exists for notification reads and application delete, good. Stale-while-revalidate is available via cache but undermined by preloadStaleTime 0 and broad invalidation.

## 11. Backend dependency analysis, frontend view only, no backend changes

- Backend hosts: Supabase Auth for session, Render FastAPI at career-os-kr9m.onrender.com for data. Render free tier cold starts are the largest single variance source on profile plus dashboard legs, frontend cannot fix that except by firing fewer and later requests.

- Frontend-caused waste: 6 backend calls where 2 would do, profile plus telemetry plus stats overlap; unbounded notifications fetch; per-request session reads; possible duplicate profile fetch from two effects; full personalized job list for bucket counts.

- If one backend leg dominates, it will be GET /api/profile/me or GET /jobs/personalized on cold Render. Distinguish by reading response timings in browser devtools against the waterfall in section 4; frontend serial time is the gap between request start and first byte minus backend processing, visible per request.

## 12. Memory, CPU, browser cost

- Initial heap drivers: three.js module plus geometries on dashboard and landing, pdfjs on resume routes, framer-motion runtime globally, recharts memo trees on dashboard. Two WebGL contexts can exist across navigation if dashboard and landing both mounted in history, each holding GPU buffers until dispose runs on unmount.

- Per-frame CPU: dashboard raycast plus landing particle updates plus camera lerps run even when tabs are backgrounded except for IntersectionObserver gating, which only helps offscreen, not hidden tabs. rAF continues on hidden tabs at throttled rate; dispose on unmount is implemented, good.

- Allocation churn: new Vector3 per node per frame in landing scale lerp, per-frame array maps in dashboard hover check. Small but constant GC pressure. Duplicate state: two QueryClients, session held in both AuthContext and supabase storage, profile mirrored in two effects.

## 13. Root causes ranked by severity

- P0 deployment target mismatch, cloudflare-module artifact on Vercel plus Node Dockerfile. Can make production unloadable or SSR-dead regardless of code speed.

- P0 serial login waterfall with global blank spinner, session then profile then gate then data then WebGL, sections 4 and 10.

- P1 dashboard chunk 576 KB with static three.js on the critical path, plus 1.37 MB pdfjs worker on resume routes.

- P1 duplicate session reads, 7 to 10 per login, and duplicate profile fetch risk from two effects with no dedup.

- P1 landing mounts 6 scenes at once with three.js, unauthenticated first paint pays WebGL cost.

- P2 AnimatePresence mode wait on every route transition.

- P2 over-fetch, unbounded notifications, full personalized list for counts, telemetry overlapping stats.

- P2 dual QueryClients and preloadStaleTime 0, broad invalidation storms after writes.

- P3 per-frame raycast, 800 ms setFps re-render, per-frame Vector3 allocation.

## 14. Quick wins, no contract or behavior change

- Lazy Career3DTopology with React.lazy plus Suspense fallback skeleton, dashboard interactive without WebGL. Saves about 500 KB initial on dashboard.

- Lazy pdf-canvas-preview and resume editor routes, landing scenes below the fold, day-picker calendar, embla carousel. Saves about 1.5 MB across resume and landing paths.

- Remove AnimatePresence mode wait, use initial false without wait, or drop PageTransition for instant transitions.

- Dedupe profile fetch with a shared promise or single owner effect, and cache the session token in memory for attachAuthToken with subscription invalidation instead of a storage read per request.

- Bound notifications fetch with limit 6 to 10 for the widget, keep full list only on the notifications page.

- Unmount inactive landing scenes instead of opacity toggling.

## 15. Medium-term fixes

- Shell-first auth: render app shell from cached session immediately, resolve profile and onboarding gate behind the shell with a non-blocking banner.

- Collapse dashboard bootstrap to 2 requests: profile plus one aggregated bootstrap endpoint, or defer telemetry, recommendations and notifications below the fold with idle prefetch.

- Single QueryClient owned by the router, preloadStaleTime 30 to 60 s, narrower invalidation keys, derive application stats from list cache everywhere.

- Gate WebGL on idle plus reduced-motion plus device memory, default to the existing 2D matrix on weak devices. Throttle raycast to pointermove events, remove setFps state or move it to a ref-driven HUD.

- Fix Nitro preset to exactly one host target and align Dockerfile, vercel config, and headers. Add bundle budgets to CI.

## 16. Is a Next.js migration justified

- No. Every P0 and P1 cause is portable and would survive a migration: the Nitro preset mismatch becomes a Next config mismatch, the serial waterfall is auth sequencing not router brand, the 576 KB dashboard chunk is a static three.js import not a TanStack cost, mode wait transitions exist in any animation library, and Render cold starts are backend hosting. Migration cost is a full rewrite of file-based routes, loaders, and query integration for zero proven gain on any measured leg.

## 17. Would plain React plus Vite be sufficient

- Yes, technically. CareerOS needs no SEO beyond the landing page, no server components, and all data fetching is client-side Bearer-token calls that SSR cannot pre-render per user. A Vite SPA with TanStack Router plus Query preserves everything and removes the Nitro server entirely, which also ends the deployment target confusion. Cost is a moderate refactor of server files and route tree, not a rewrite.

## 18. Is keeping TanStack viable

- Yes, and it is the recommended default. TanStack Router code-splits correctly, Query caching is sound, Start SSR is simply unnecessary for this app and can be run in SPA mode or with the correct preset. Keep the stack, fix sequencing and splitting.

## 19. Recommended target architecture

- Keep TanStack Router plus Query plus Vite. Run TanStack Start in SPA mode or set Nitro preset to exactly one host. Delete the dead router QueryClient. Lazy-split three, pdfjs, recharts, calendar, carousel, and landing scenes. Shell-first auth with deferred profile gate. Two-request dashboard bootstrap with idle hydration for the rest. Bundle budget enforced in CI. Reassess only if SEO or server rendering becomes a product requirement, which it is not today.

- Orchestration note: the plan called for 4 parallel specialists, architect, code-reviewer, security-reviewer, database-reviewer. All 4 spawns were refused with subagent depth limit reached, so this report was produced by direct sequential forensics with the same file and line evidence each agent would have used.

## 20. Expected improvement per recommendation

- Correct deploy target: eliminates failed or SSR-dead production loads, unblocks all other gains. Lazy dashboard WebGL: login to interactive down about 30 to 45 percent on mid mobile. Lazy pdfjs plus editor: resume route initial down about 60 percent, worker loads on demand. Drop mode wait: route transitions faster by 200 to 400 ms perceived. Dedupe session plus profile: removes 1 to 2 backend round trips, 300 to 2500 ms on cold Render. Bound notifications plus collapse bootstrap: dashboard data leg down 30 to 50 percent. Shell-first auth: blank screen time to near zero, skeleton in under 300 ms on warm cache. Combined realistic effect: perceived login to usable dashboard from several seconds to about 1 to 2 s warm, cold bounded by one Render warm-up instead of three serial ones.

## 21. Performance budget

- Initial JS per route, gzip: shell under 150 KB, dashboard under 250 KB, resume routes worker excluded until use. Initial CSS under 50 KB gzip, current 187 KB raw must shrink or split. Login to shell visible under 800 ms warm, login to dashboard usable under 2 s warm and 4 s cold. Authenticated refresh under 1.2 s. Dashboard API legs p95 under 800 ms warm, at most 3 requests before usable. Largest single request under 300 KB. LCP under 2.5 s, TBT under 200 ms, route transition under 300 ms perceived.

## 22. Safe fixes implemented in this task

- Fix 1, src/lib/i18n.ts: Python triple-quoted docstring replaced with equivalent TS line comments. File was unparseable, not imported anywhere, zero behavior change. BEFORE: tsc exit 2 with 16 syntax errors in this file. AFTER: those 16 errors gone. Verified by npx tsc --noEmit.

- Fix 2, src/routes/_app.jobs.tsx: added missing verifiedLiveOnly boolean to local JobSearchParams type, matching the validateSearch code that already produced it and the shared JobSearchFilters type that already declared it. Zero behavior change. BEFORE: 3 TS2353 plus TS2339 errors. AFTER: tsc exit 0 clean. Verified by npx tsc --noEmit.

- No auth semantics changed, no backend contracts changed, no product behavior changed, no framework migration performed. Regression check: vitest 17 files 320 tests pass, vite build succeeds, tsc clean. Lint shows only the pre-existing repo-wide CRLF prettier violations, 4412 problems across untouched files; the two edited lines carry only the same CRLF style as their files.

## 23. Tests and build results

- npm run build: success, client plus nitro server in about 3 s. npx tsc --noEmit: exit 0. npm test, vitest run src: 17 files, 320 tests, all pass. npm run lint: fails on pre-existing prettier CRLF violations repo-wide, unrelated to this task, no new violation class introduced.

- Functional verification was static plus suite-based: login, logout, session restore, protected routes, dashboard, jobs, resumes, and API auth paths were traced through AuthProvider, GuestRoute, ProtectedRoute, _app layout, request plus interceptor, and the 320 passing unit tests. No live browser session was available in this environment, so timings above are code-path derived plus build-measured bundle sizes, flagged as such.

## 24. Production-performance hardening implementation (2026-10-06, keep-TanStack)

No migration. TanStack Router plus Query plus Vite retained. Backend untouched
(zero `careeros-backend-py/` diff). All commits on `main`, no history rewrite.

- Phase 1 runtime (`a61dc53`): `vite.config.ts` pins `nitro: { preset: "vercel" }`
  (wrapper defaults to `cloudflare-module`; Lovable sandbox still forces
  Cloudflare for preview only). `Dockerfile` header-marked container-preview
  only. Build emits `.vercel/output/nitro.json` with `preset: "vercel"`,
  `deploy: vercel deploy --prebuilt`. No `vercel.json` created (detection is
  deterministic with the explicit preset).

- Phase 2 auth (`a61dc53`): in-memory access-token cache in
  `src/auth/http-interceptor.ts` with `onAuthStateChange` invalidation;
  `attachAuthToken` serves fresh cache, single `getSession` fallback;
  401 refresh path unchanged. `AuthProvider.tsx`: `SIGNED_IN`/`TOKEN_REFRESHED`
  map directly from the event session (listener duplicate `getSession`
  removed, refresh never blanks UI); `fetchProfile` single-flight shared
  promise keeps the `Promise<void>` contract; sign-out/logout clear the
  in-flight ref.

- Phase 3 shell (`a55b555`): `_auth.login.tsx` navigates on `isAuthenticated`
  immediately (no profile wait — removed one 600-2500ms serial leg on cold
  Render). `_app.tsx` owns the profile behind the shell and redirects to
  onboarding only once the profile resolves as incomplete.

- Phase 4 bootstrap (`9f1523d`): `useDashboardData` two-tier — Tier-1
  (personalized jobs plus app stats) gates skeleton release; recs plus
  notifications hydrate progressively. Notifications bounded to
  `getAll({ limit: 6 })` with key `["notifications", { limit: 6 }]`
  (server already supported `limit`; full history stays on `/notifications`;
  prefix invalidations still match).

- Phase 5 query (`252056a`): `src/lib/query-client.ts` singleton shared by
  router context and `QueryProvider` (dead bare router client deleted);
  `defaultPreloadStaleTime: 0` to `30_000`. Per-query `staleTime` values
  unchanged; broad prefix invalidation deliberately kept (narrowing risks
  stale filtered lists).

- Phase 6 splits (`fae591d`, `880370f`): dashboard `Career3DTopology`
  `React.lazy` plus `Suspense` skeleton — route chunk 576KB to 34KB raw,
  three.js in on-demand 529KB raw (133KB gzip) chunk. Landing mounts 1 of 6
  scenes (`key={activeScene}` re-triggers enter; scenes are light DOM, no
  lazy needed; three.js lives only in dead `CareerSignalCanvas`, zero usages,
  untouched). Resume `PdfCanvasPreview` lazy inside `preview-pane` —
  route chunk 510KB to 170KB raw, pdfjs in on-demand 336KB raw (99KB gzip)
  chunk, `A4DocumentSkeleton` fallback, template path unaffected. recharts,
  `ui/calendar`, `ui/carousel`: zero usages in `src/`, tree-shaken or
  unshipped — no action taken.

- Phase 8 transitions (`a9c0b3c`): `AnimatePresence mode="wait"` to `"sync"`
  globally (`page-transition.tsx`) and all 3 `_app.jobs.tsx` instances.
  Enter/exit variants and reduced-motion path untouched.

- Phase 9 gates (`159f11e`): `scripts/check-bundle-budget.mjs` plus
  `npm run check:budgets` — 10 raw+gzip caps, all passing (dashboard 34/10,
  resume 170/39, landing 120, shell 24, topology-on-demand 133, pdf-on-demand
  99, CSS 27, largest 133 KB gzip). No frontend CI workflow exists in this
  repo, so wiring the gate into CI is a follow-up. `src/lib/perf-marks.ts`
  timing-only marks (dev / `VITE_PERF_MARKS=1`, no PII): `login-start` to
  `auth-complete` to `shell-visible`, dashboard mount to usable to
  noncritical-hydrated, with `performance.measure` debug output.

BEFORE/AFTER (build-measured, `.vercel/output/static/assets`): dashboard
route 576 to 34KB raw; resume route 510 to 170KB raw; per-login `getSession`
hot-path 7-10 reads to 1 cold plus cache; duplicate `GET /api/profile/me`
eliminated via single-flight; login-to-dashboard serial legs reduced by one
full profile round trip plus 4-5 session reads. Perceived login-to-usable
improvement is INFERRED from code paths plus bundle deltas, not browser
measured — use the perf marks in a live session to confirm.

Deferred (explicit): invalidation narrowing, WebGL idle/reduced-motion/
device-memory gating plus raycast throttling, CI workflow wiring, live
browser timing confirmation (flows A-G), root `COMPLETE_SYSTEM.md` update
(lives in the backend repo — left to its own flow).

---

## 11. Security Advisory Resolution — CVE-2026-102989 (TanStack Start XSS)

### 11.1 Problem & Vercel Security Block
- **Advisory:** CVE-2026-102989 — TanStack Start XSS vulnerability.
- **Affected range:** `@tanstack/react-start` versions `>= 1.143.12`, patched in `>= 1.168.60`.
- **Transitive requirement:** `@tanstack/start-server-core` must be `>= 1.169.39`.
- **Vercel Block:** Vercel rejected production deployments with error:
  `"Vulnerable TanStack Start package detected (@tanstack/react-start@1.168.27). Please update to a patched version."`
- **Vulnerable version discovered:** `@tanstack/react-start@1.168.27` was resolved in `package-lock.json` with transitive `@tanstack/start-server-core@1.169.16`.

### 11.2 Resolution & Dependency Graph Verification
- **Upgraded packages:**
  - `@tanstack/react-start`: `1.168.27` -> `1.168.60` (patched stable release)
  - `@tanstack/react-router`: `1.170.17` -> `1.170.41`
  - `@tanstack/router-plugin`: `1.168.19` -> `1.168.42`
  - `@tanstack/start-server-core`: `1.169.16` -> `1.169.39` (transitive via `@tanstack/react-start@1.168.60`)
  - `@tanstack/react-start-client`: `1.168.15` -> `1.168.39`
  - `@tanstack/react-start-server`: `1.167.21` -> `1.167.46`
  - `@tanstack/react-start-rsc`: `0.1.26` -> `0.1.59`
  - `@tanstack/start-client-core`: `1.170.13` -> `1.170.34`
  - `@tanstack/start-plugin-core`: `1.171.19` -> `1.171.49`
- **Lockfile regenerated:** `package-lock.json` updated cleanly via npm.
- **Auditable dependency check:** `npm ls @tanstack/react-start @tanstack/start-server-core` confirms zero vulnerable 1.168.27 references.
- **Bypass Verification:** Confirmed `DANGEROUSLY_DEPLOY_VULNERABLE_TANSTACK_START_XSS` was **NOT** used anywhere in the codebase.
- **Vercel Runtime & Preset:** `vite.config.ts` preserves `nitro: { preset: "vercel" }`. Build output in `.vercel/output/nitro.json` targets `vercel` preset with `nodejs22.x` runtime.
- **Verification Baselines:**
  - TypeScript: 0 errors (`npx tsc --noEmit` clean after updating root `ErrorComponent` error typing to `unknown`).
  - Vitest: 320/320 tests passing.
  - Production build: Succeeded (`vite build` -> `.vercel/output`).
  - Bundle budgets: All 10 budget limits pass (`npm run check:budgets`).

