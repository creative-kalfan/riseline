// User and Session Models

export type UserRole = "user" | "admin" | "moderator";

export type Permission =
  | "resume:read"
  | "resume:write"
  | "resume:delete"
  | "ats:analyze"
  | "jobs:search"
  | "jobs:save"
  | "applications:read"
  | "applications:write"
  | "applications:delete"
  | "dashboard:read"
  | "notifications:read"
  | "notifications:write"
  | "copilot:use"
  | "settings:read"
  | "settings:write";

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
};

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

export type Session = {
  id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
};

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated" | "error";

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "TOKEN_EXPIRED"
  | "REFRESH_TOKEN_EXPIRED"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export type AuthError = {
  code: AuthErrorCode;
  message: string;
  statusCode: number;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  name: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  password: string;
};

export type VerifyEmailRequest = {
  token: string;
};

export type OnboardingProfile = {
  onboardingCompleted: boolean;
  onboardingStep: number;
};

export type AuthContextValue = {
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
};
