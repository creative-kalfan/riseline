import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AuthContext } from "./AuthContext";
import type {
  AuthContextValue,
  User,
  Session,
  Tokens,
  AuthStatus,
  AuthError,
  OnboardingProfile,
} from "./auth.types";
import { authService } from "./auth.service";
import { supabase } from "../lib/supabase";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState<AuthError | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  // Mirrors profileFetchFailedRef for rendering: when the profile request
  // fails, layouts must show a retryable error — never an endless spinner.
  const [profileFetchFailed, setProfileFetchFailed] = useState(false);
  // Guards against an infinite profile-fetch loop: if the profile request
  // fails (e.g. transient 401 during token refresh), a `profile === null`
  // gate must not retrigger the fetch indefinitely.
  const profileFetchFailedRef = useRef(false);
  // Single-flight guard: concurrent callers (init + layout + login effects)
  // share one in-flight GET /api/profile/me instead of firing 2-3x.
  const profilePromiseRef = useRef<Promise<void> | null>(null);

  const fetchProfile = useCallback(async (force?: boolean): Promise<void> => {
    if (profileFetchFailedRef.current && !force) return;
    if (profilePromiseRef.current && !force) return profilePromiseRef.current;
    setIsProfileLoading(true);
    const promise = (async (): Promise<void> => {
      try {
        const profileData = await authService.getProfile();
        profileFetchFailedRef.current = false;
        setProfileFetchFailed(false);
        setProfile(profileData);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        profileFetchFailedRef.current = true;
        setProfileFetchFailed(true);
        setProfile(null);
      } finally {
        setIsProfileLoading(false);
        profilePromiseRef.current = null;
      }
    })();
    profilePromiseRef.current = promise;
    return promise;
  }, []);

  // Initialize auth state from Supabase session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setStatus("loading");

        let result: any;
        try {
          result = await authService.getSession();
        } catch (e) {
          result = null;
        }

        if (result) {
          setTokens(result.tokens);
          setUser(result.user);
          setSession(result.session);
          setStatus("authenticated");
          fetchProfile();
        } else {
          setStatus("unauthenticated");
        }
      } catch (err) {
        setStatus("unauthenticated");
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [fetchProfile]);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (supabaseSession) {
          // Map directly from the event session — no extra getSession()
          // storage read. TOKEN_REFRESHED must never blank the UI, so the
          // global status goes straight to authenticated, never loading.
          if (supabaseSession.user) {
            const {
              user: mappedUser,
              tokens: mappedTokens,
              session: mappedSession,
            } = mapSessionDirect(supabaseSession);
            setTokens(mappedTokens);
            setUser(mappedUser);
            setSession(mappedSession);
            setStatus("authenticated");
            setError(null);
          }
        }
      } else if (event === "SIGNED_OUT") {
        setTokens(null);
        setUser(null);
        setSession(null);
        setProfile(null);
        profileFetchFailedRef.current = false;
        profilePromiseRef.current = null;
        setProfileFetchFailed(false);
        setStatus("unauthenticated");
        setError(null);
      } else if (event === "USER_UPDATED") {
        if (supabaseSession?.user) {
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          } catch {
            // Ignore
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper to map session directly without service call
  function mapSessionDirect(sbSession: any) {
    const metadata = sbSession.user?.user_metadata as Record<string, unknown> | undefined;
    const mappedUser: User = {
      id: sbSession.user.id,
      email: sbSession.user.email ?? "",
      name:
        (metadata?.full_name as string) ||
        (metadata?.name as string) ||
        sbSession.user.email?.split("@")[0] ||
        "User",
      avatar: metadata?.avatar_url as string | undefined,
      role: "user",
      permissions: [],
      emailVerified: !!sbSession.user.email_confirmed_at,
      createdAt: sbSession.user.created_at ?? new Date().toISOString(),
      updatedAt: sbSession.user.updated_at ?? new Date().toISOString(),
    };
    const mappedTokens: Tokens = {
      accessToken: sbSession.access_token,
      refreshToken: sbSession.refresh_token,
      expiresIn: sbSession.expires_in ?? 3600,
      refreshExpiresIn: 60 * 60 * 24 * 30,
    };
    const mappedSession: Session = {
      id: sbSession.user.id,
      userId: sbSession.user.id,
      createdAt: sbSession.user.created_at ?? new Date().toISOString(),
      expiresAt: sbSession.expires_at
        ? new Date(sbSession.expires_at * 1000).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    return { user: mappedUser, tokens: mappedTokens, session: mappedSession };
  }

  const login = useCallback(async (email: string, password: string) => {
    try {
      setStatus("loading");
      setError(null);

      const response = await authService.login({ email, password });

      setTokens(response.tokens);
      setUser(response.user);
      setSession(response.session);
      setStatus("authenticated");
    } catch (err: any) {
      const authError: AuthError = {
        code: err?.code || "INVALID_CREDENTIALS",
        message: err?.message || "Invalid email or password",
        statusCode: err?.statusCode || 401,
      };
      setError(authError);
      setStatus("error");
      throw authError;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Supabase manages its own session cleanup
      // No need to manually clear storage

      // Clear state
      setTokens(null);
      setUser(null);
      setSession(null);
      setProfile(null);
      profileFetchFailedRef.current = false;
      profilePromiseRef.current = null;
      setProfileFetchFailed(false);
      setStatus("unauthenticated");
      setError(null);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      setStatus("loading");
      setError(null);

      const response = await authService.register({ email, password, name });

      // Supabase manages its own session persistence
      // No need to manually store tokens

      setTokens(response.tokens);
      setUser(response.user);
      setStatus("authenticated");
    } catch (err: any) {
      const authError: AuthError = {
        code: err?.code || "UNKNOWN_ERROR",
        message: err?.message || "Registration failed. Please try again.",
        statusCode: err?.statusCode || 400,
      };
      setError(authError);
      setStatus("error");
      throw authError;
    }
  }, []);

  const signInWithOAuth = useCallback(async (provider: "google" | "github") => {
    // Initiates the Supabase OAuth redirect. On success the browser leaves
    // the app; on return the onAuthStateChange listener above establishes
    // the session (SIGNED_IN). Only failures reach the code below.
    try {
      setStatus("loading");
      setError(null);
      await authService.signInWithOAuth(provider);
    } catch (err: any) {
      const authError: AuthError = {
        code: err?.code || "UNKNOWN_ERROR",
        message: err?.message || `Failed to sign in with ${provider}. Please try again.`,
        statusCode: err?.statusCode || 400,
      };
      setError(authError);
      setStatus("error");
      throw authError;
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setStatus("loading");
      setError(null);
      await authService.forgotPassword({ email });
    } catch (err: any) {
      const authError: AuthError = {
        code: err?.code || "UNKNOWN_ERROR",
        message: err?.message || "Failed to send reset email. Please try again.",
        statusCode: err?.statusCode || 400,
      };
      setError(authError);
      setStatus("error");
      throw authError;
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    try {
      setStatus("loading");
      setError(null);
      await authService.resetPassword({ token, password });
    } catch (err: any) {
      const authError: AuthError = {
        code: err?.code || "UNKNOWN_ERROR",
        message: err?.message || "Failed to reset password. Please try again.",
        statusCode: err?.statusCode || 400,
      };
      setError(authError);
      setStatus("error");
      throw authError;
    }
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    try {
      setStatus("loading");
      setError(null);
      await authService.verifyEmail({ token });
    } catch (err: any) {
      const authError: AuthError = {
        code: err?.code || "UNKNOWN_ERROR",
        message: err?.message || "Failed to verify email. Please try again.",
        statusCode: err?.statusCode || 400,
      };
      setError(authError);
      setStatus("error");
      throw authError;
    }
  }, []);

  const refreshToken = useCallback(async () => {
    if (!tokens?.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await authService.refreshToken(tokens.refreshToken);

      // Supabase manages its own session persistence
      // No need to manually store tokens

      setTokens(response.tokens);
    } catch (err) {
      // Refresh failed, logout
      await logout();
      throw err;
    }
  }, [tokens?.refreshToken, logout]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateOnboardingStep = useCallback(async (step: number) => {
    try {
      await authService.updateOnboardingStep(step);
      setProfile((prev) => ({
        onboardingCompleted: prev?.onboardingCompleted ?? false,
        onboardingStep: step,
      }));
    } catch (err) {
      console.error("Failed to update onboarding step:", err);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(
    async (data: {
      current_role?: string;
      desired_role?: string;
      skills?: string[];
      location?: string;
      preferred_companies?: string[];
      salary_expectation_min?: number;
      salary_expectation_max?: number;
      experience?: string;
    }) => {
      try {
        await authService.updateProfile(data);
      } catch (err) {
        console.error("Failed to update profile:", err);
        throw err;
      }
    },
    [],
  );

  const completeOnboarding = useCallback(async () => {
    try {
      await authService.completeOnboarding();
      setProfile((prev) => ({
        onboardingCompleted: true,
        onboardingStep: 10,
      }));
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      throw err;
    }
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      session,
      tokens,
      status,
      error,
      isInitialized,
      profile,
      isProfileLoading,
      profileFetchFailed,
      login,
      logout,
      register,
      signInWithOAuth,
      forgotPassword,
      resetPassword,
      verifyEmail,
      refreshToken,
      clearError,
      fetchProfile,
      updateOnboardingStep,
      updateProfile,
      completeOnboarding,
    }),
    [
      user,
      session,
      tokens,
      status,
      error,
      isInitialized,
      profile,
      isProfileLoading,
      profileFetchFailed,
      login,
      logout,
      register,
      signInWithOAuth,
      forgotPassword,
      resetPassword,
      verifyEmail,
      refreshToken,
      clearError,
      fetchProfile,
      updateOnboardingStep,
      updateProfile,
      completeOnboarding,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
