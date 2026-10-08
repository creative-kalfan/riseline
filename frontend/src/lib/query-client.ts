import { QueryClient } from "@tanstack/react-query";

// Single authoritative QueryClient for the app.
//
// Previously two clients existed: a bare `new QueryClient()` in
// `src/router.tsx` (passed as router context, never consumed by any
// component) and a configured one in `src/providers/query-provider.tsx`
// (the one every `useQueryClient()` call actually resolves to). All feature
// code uses the provider client, so the router client was dead weight with
// a second cache and duplicate observers. Both now share this singleton.
//
// Cache policy (per-query staleTime wins over the global default):
// - HOT (user-visible, changes fast): unread notifications 60s.
// - WARM (dashboard/app data): personalized jobs, app stats,
//   recommendations, notifications list, telemetry 60-120s.
// - COLD (metadata/prefs): notification preferences 5min (global default).
// `refetchOnWindowFocus` stays false; `retry` stays 1. Do not globally
// inflate staleTime — set it per query where freshness demands it.
export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

let appQueryClient: QueryClient | null = null;

export function getAppQueryClient(): QueryClient {
  if (!appQueryClient) {
    appQueryClient = createAppQueryClient();
  }
  return appQueryClient;
}
