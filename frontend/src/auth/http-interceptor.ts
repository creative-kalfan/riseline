import { supabase } from "../lib/supabase";

/**
 * HTTP Interceptor for authentication
 *
 * Attaches Supabase session token to API requests and handles 401 responses
 * by automatically refreshing the session.
 */

let refreshPromise: Promise<string | null> | null = null;

// In-memory access-token cache. Supabase persists the session in storage,
// but every `request()` awaited a storage `getSession()` read serially
// before its fetch (6+ reads on dashboard mount). The cache serves the hot
// path; `onAuthStateChange` invalidates it so refresh/logout stay correct.
let cachedToken: string | null = null;
let cachedExpMs = 0;
let tokenCacheSubscribed = false;

function cacheSessionToken(accessToken: string | null, expiresAtSec?: number | null) {
  cachedToken = accessToken;
  cachedExpMs = typeof expiresAtSec === "number" ? expiresAtSec * 1000 : 0;
}

function clearCachedToken() {
  cachedToken = null;
  cachedExpMs = 0;
}

function getFreshCachedToken(): string | null {
  if (!cachedToken) return null;
  // 60s clock-skew buffer; expiry itself is handled by the 401 refresh path.
  if (cachedExpMs && Date.now() > cachedExpMs - 60 * 1000) return null;
  return cachedToken;
}

function ensureTokenCacheSubscription() {
  if (tokenCacheSubscribed) return;
  tokenCacheSubscribed = true;
  try {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        clearCachedToken();
      } else if (session?.access_token) {
        cacheSessionToken(session.access_token, session.expires_at ?? null);
      }
    });
  } catch {
    // Subscription is an optimization; per-request fallback still works.
  }
}

/**
 * Attach Supabase session access token to request headers
 * @param headers - Existing headers object
 * @returns Headers with authorization token
 */
export async function attachAuthToken(headers: HeadersInit = {}): Promise<HeadersInit> {
  ensureTokenCacheSubscription();
  const cached = getFreshCachedToken();
  if (cached) {
    return {
      ...headers,
      Authorization: `Bearer ${cached}`,
    };
  }

  const { data } = await supabase.auth.getSession();
  cacheSessionToken(data.session?.access_token ?? null, data.session?.expires_at ?? null);

  if (!data.session?.access_token) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${data.session.access_token}`,
  };
}

/**
 * Handle 401 Unauthorized response
 * Attempts to refresh the Supabase session and retry the request
 * @param originalRequest - The original request that failed
 * @returns Retried request response or null if refresh failed
 */
export async function handleUnauthorized(
  originalRequest: () => Promise<Response>,
): Promise<Response | null> {
  // Prevent multiple concurrent refresh requests
  if (refreshPromise) {
    const token = await refreshPromise;
    if (token) {
      return originalRequest();
    }
    return null;
  }

  try {
    refreshPromise = refreshAccessToken();
    const token = await refreshPromise;

    if (!token) {
      handleSessionExpired();
      return null;
    }

    // Retry original request with fresh token
    return originalRequest();
  } catch (error) {
    handleSessionExpired();
    return null;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Refresh Supabase session
 * @returns New access token or null if refresh failed
 */
async function refreshAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    console.error("Token refresh failed:", error?.message);
    clearCachedToken();
    return null;
  }

  cacheSessionToken(data.session.access_token, data.session.expires_at ?? null);
  return data.session.access_token;
}

/**
 * Handle session expired - redirect to login
 */
function handleSessionExpired(): void {
  clearCachedToken();
  // Clear all auth data
  supabase.auth.signOut().catch(() => {});
  window.location.href = "/login";
}

/**
 * Retry failed request with exponential backoff
 * @param request - Request function to retry
 * @param maxRetries - Maximum number of retries
 * @param retryDelay - Initial delay in ms
 * @returns Response or throws error
 */
export async function retryRequest<T>(
  request: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await request();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof Error && "statusCode" in error) {
        const statusCode = (error as any).statusCode;
        if (statusCode >= 400 && statusCode < 500) {
          throw error;
        }
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError!;
}

/**
 * Check if token is about to expire by examining the Supabase session
 * @returns True if session expires within buffer time
 */
export async function isSessionExpiringSoon(): Promise<boolean> {
  ensureTokenCacheSubscription();
  if (cachedToken && cachedExpMs) {
    const buffer = 5 * 60 * 1000; // 5 minutes
    return cachedExpMs - Date.now() < buffer;
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session?.expires_at) return true;

  const buffer = 5 * 60 * 1000; // 5 minutes
  const expirationTime = data.session.expires_at * 1000;
  const currentTime = Date.now();

  return expirationTime - currentTime < buffer;
}
