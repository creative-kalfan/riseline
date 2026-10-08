import { createContext, useContext } from "react";
import type { User, Session, Tokens, AuthStatus, AuthError, OnboardingProfile } from "./auth.types";

export interface AuthContextValue {
  // State
  user: User | null;
  session: Session | null;
  tokens: Tokens | null;
  status: AuthStatus;
  error: AuthError | null;
  isInitialized: boolean;
  profile: OnboardingProfile | null;
  isProfileLoading: boolean;
  profileFetchFailed: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  signInWithOAuth: (provider: "google" | "github") => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  fetchProfile: (force?: boolean) => Promise<void>;
  updateOnboardingStep: (step: number) => Promise<void>;
  updateProfile: (data: {
    current_role?: string;
    desired_role?: string;
    skills?: string[];
    location?: string;
    preferred_companies?: string[];
    salary_expectation_min?: number;
    salary_expectation_max?: number;
    experience?: string;
  }) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
