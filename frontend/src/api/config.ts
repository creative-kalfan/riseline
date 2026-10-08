import { env } from "../config/env.ts";

export const apiConfig = {
  baseUrl: env.VITE_API_BASE_URL,
  timeout: 30000,
  defaultHeaders: {
    "Content-Type": "application/json",
  },
};

// Long-request budget (ms) for document calls that can invoke the LLM
// gateway (tailor, apply-tailoring) or compile artifacts (export). The LLM
// bridge allows up to ~25-30s per model call and a tailor pass makes several,
// so the shared 30s default aborted healthy requests mid-flight ("Request
// timeout"). Callers opt in via `timeoutMs: LONG_REQUEST_TIMEOUT_MS`.
export const LONG_REQUEST_TIMEOUT_MS = 120000;

export type ApiConfig = typeof apiConfig;
