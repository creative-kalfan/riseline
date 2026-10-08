import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { getAppQueryClient } from "../lib/query-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Singleton shared with the router context (src/router.tsx). Stable per
  // mount via useState; identical instance across remounts and tests that
  // share the module registry.
  const [queryClient] = useState(getAppQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
