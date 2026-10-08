import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { getAppQueryClient } from "./lib/query-client";

export const getRouter = () => {
  // Authoritative client shared with QueryProvider — router context and
  // useQueryClient() resolve to the same cache. Previously this was a bare
  // `new QueryClient()` with no default options, shadowing the configured
  // provider client.
  const queryClient = getAppQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // 30s: route preloads reuse fresh dashboard/job data instead of
    // refetching on every hover/intent. Per-query staleTime still governs
    // (60s-5min); this only stops `staleTime: 0` from disabling the cache.
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
