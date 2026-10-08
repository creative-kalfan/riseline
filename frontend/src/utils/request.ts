import { apiConfig } from "../api/config";
import { ApiClientError } from "./api-error";
import type { ApiError } from "../types/api/ApiError.ts";
import { attachAuthToken } from "../auth/http-interceptor";
import { supabase } from "../lib/supabase";

export type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  // Per-request timeout override (ms). Defaults to apiConfig.timeout (30s).
  // Long-running document calls (tailor / apply-tailoring / export, which can
  // invoke the LLM gateway with its own 25-30s budgets) must pass the shared
  // LONG_REQUEST_TIMEOUT_MS instead of being aborted mid-flight.
  timeoutMs?: number;
  // External abort signal (e.g. TanStack Query's per-fetch signal). Linked to
  // the internal timeout controller so superseded requests (fast typing,
  // filter/page changes) never resolve over newer UI state.
  signal?: AbortSignal;
};

function toApiError(payload: unknown, status: number, fallback: string): ApiError {
  const p = (payload ?? {}) as Record<string, any>;
  const nested = (p.error ?? {}) as Record<string, any>;
  const message =
    (typeof nested.message === "string" && nested.message) ||
    (typeof p.detail === "string" && p.detail) ||
    (typeof p.message === "string" && p.message) ||
    fallback;
  const code =
    (typeof nested.code === "string" && nested.code) ||
    (typeof p.code === "string" && p.code) ||
    undefined;
  return { message, code, statusCode: status, details: p.details ?? nested };
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const url = `${apiConfig.baseUrl}${options.path}`;
  const timeoutMs = options.timeoutMs ?? apiConfig.timeout;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const unlink = linkSignal(options.signal, controller);

  // Use Supabase session token instead of localStorage
  const headers: Record<string, string> = {
    ...apiConfig.defaultHeaders,
    ...options.headers,
  };
  const authHeaders = await attachAuthToken(headers);

  try {
    let response = await fetch(url, {
      method: options.method,
      headers: authHeaders,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    unlink();

    // Diagnostic guard: an unhandled backend exception produces a response
    // with no CORS headers, which browsers misleadingly report as a CORS
    // failure. Surface the real status instead of a generic CORS symptom.
    if (
      !response.ok &&
      ![...response.headers.keys()].some(
        (k) => k.toLowerCase() === "access-control-allow-origin",
      ) &&
      response.status >= 500
    ) {
      console.error(
        `[api] ${options.method} ${options.path} failed with HTTP ${response.status} and no CORS headers — ` +
          `this is a backend exception, not a CORS misconfiguration.`,
      );
    }

    if (!response.ok) {
      // One authoritative 401 path: refresh the Supabase session once via the
      // existing interceptor and retry the original request. Prevents expired
      // access tokens from surfacing as 401 errors to feature code.
      // NOTE: the retry uses a FRESH AbortController + timeout. Reusing the
      // original signal left retried requests with no timeout at all (its
      // timer was already cleared), so a hung server hung the UI forever.
      if (response.status === 401) {
        const retried = await tryRefreshAndRetry(
          url,
          options.method,
          headers,
          options.body ? JSON.stringify(options.body) : undefined,
          timeoutMs,
          options.signal,
        );
        // A null retry (no refresh token) keeps the original 401 response so
        // normal error handling below reports a genuine auth failure.
        // Fall through to normal error handling for the retried response.
        if (retried) response = retried;
      }

      let errorData: ApiError;
      try {
        errorData = toApiError(
          await response.json(),
          response.status,
          response.statusText || "Request failed",
        );
      } catch {
        errorData = {
          message: response.statusText || "Request failed",
          statusCode: response.status,
        };
      }
      throw new ApiClientError(errorData);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    unlink();

    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        if (options.signal?.aborted) {
          throw error;
        }
        throw new ApiClientError({
          message: "Request timeout",
          statusCode: 408,
          code: "TIMEOUT",
        });
      }
      throw new ApiClientError({
        message: error.message,
        statusCode: 0,
        code: "NETWORK_ERROR",
      });
    }

    throw new ApiClientError({
      message: "An unexpected error occurred",
      statusCode: 0,
      code: "UNKNOWN_ERROR",
    });
  }
}

// Links an external abort signal (TanStack Query per-fetch signal) to the
// internal timeout controller. Returns an unlink cleanup for settled fetches.
function linkSignal(signal: AbortSignal | undefined, controller: AbortController) {
  if (!signal) return () => {};
  if (signal.aborted) controller.abort();
  else {
    const onAbort = () => controller.abort();
    signal.addEventListener("abort", onAbort, { once: true });
    return () => signal.removeEventListener("abort", onAbort);
  }
  return () => {};
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data: refreshed } = await supabase.auth.refreshSession();
    return refreshed?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

// Single authoritative 401 recovery shared by request() and requestBlob():
// refresh the Supabase session once (existing refresh token — no new token
// store) and retry the original fetch with a FRESH AbortController + timeout.
// A second 401 is a genuine auth failure and propagates normally. Returns
// null when no refresh token exists so callers keep the original response.
async function tryRefreshAndRetry(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string | undefined,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<Response | null> {
  const newToken = await refreshAccessToken();
  if (!newToken) return null;
  const retryController = new AbortController();
  const retryTimeoutId = setTimeout(() => retryController.abort(), timeoutMs);
  const unlink = linkSignal(signal, retryController);
  try {
    return await fetch(url, {
      method,
      headers: { ...headers, Authorization: `Bearer ${newToken}` },
      body,
      signal: retryController.signal,
    });
  } finally {
    clearTimeout(retryTimeoutId);
    unlink();
  }
}

export async function requestBlob(
  options: Omit<RequestOptions, "method"> & { method: "GET" },
): Promise<Blob> {
  const url = `${apiConfig.baseUrl}${options.path}`;
  const timeoutMs = options.timeoutMs ?? apiConfig.timeout;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const unlink = linkSignal(options.signal, controller);

  const headers: Record<string, string> = {
    ...apiConfig.defaultHeaders,
    ...options.headers,
  };
  const authHeaders = await attachAuthToken(headers);

  try {
    let response = await fetch(url, {
      method: options.method,
      headers: authHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    unlink();

    // Same 401 recovery as request(): without this, exports fail on expired
    // tokens even though every JSON call transparently recovers.
    if (response.status === 401) {
      const retried = await tryRefreshAndRetry(
        url,
        options.method,
        headers,
        undefined,
        timeoutMs,
        options.signal,
      );
      if (retried) response = retried;
    }

    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = toApiError(
          await response.json(),
          response.status,
          response.statusText || "Request failed",
        );
      } catch {
        errorData = {
          message: response.statusText || "Request failed",
          statusCode: response.status,
        };
      }
      throw new ApiClientError(errorData);
    }

    return await response.blob();
  } catch (error) {
    clearTimeout(timeoutId);
    unlink();

    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        if (options.signal?.aborted) {
          throw error;
        }
        throw new ApiClientError({
          message: "Request timeout",
          statusCode: 408,
          code: "TIMEOUT",
        });
      }
      throw new ApiClientError({
        message: error.message,
        statusCode: 0,
        code: "NETWORK_ERROR",
      });
    }

    throw new ApiClientError({
      message: "An unexpected error occurred",
      statusCode: 0,
      code: "UNKNOWN_ERROR",
    });
  }
}
