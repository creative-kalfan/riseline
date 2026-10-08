import { QueryClient } from "@tanstack/react-query";
import { apiConfig } from "./config.ts";

export const apiClient = {
  queryClient: null as QueryClient | null,

  setQueryClient(client: QueryClient) {
    this.queryClient = client;
  },

  getQueryClient(): QueryClient {
    if (!this.queryClient) {
      throw new Error("QueryClient not initialized. Ensure QueryProvider is wrapping the app.");
    }
    return this.queryClient;
  },
};

export type ApiClient = typeof apiClient;
