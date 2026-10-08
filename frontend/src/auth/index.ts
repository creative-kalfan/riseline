// Types
export type {
  User,
  UserRole,
  Permission,
  Profile,
  Tokens,
  Session,
  AuthStatus,
  AuthErrorCode,
  AuthError,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from "./auth.types";

// Constants
export { AUTH_ROUTES, AUTH_ERROR_MESSAGES, TOKEN_REFRESH_BUFFER } from "./auth.constants";

// Configuration
export { authConfig, type AuthConfig } from "./auth.config";

// Storage (kept for potential future use, but not used for auth tokens)
export {
  storage,
  setStorage,
  getStorage,
  type IStorage,
  LocalStorageAdapter,
  SessionStorageAdapter,
  MemoryStorageAdapter,
} from "./storage";

// Service
export { authService, type AuthService } from "./auth.service";

// HTTP Interceptor
export {
  attachAuthToken,
  handleUnauthorized,
  retryRequest,
  isSessionExpiringSoon,
} from "./http-interceptor";

// Context and Provider
export { AuthContext, useAuthContext } from "./AuthContext";
export { AuthProvider } from "./AuthProvider";

// Hooks
export { useAuth } from "./useAuth";

// Route Guards
export { ProtectedRoute } from "./ProtectedRoute";
export { GuestRoute } from "./GuestRoute";

// Components
export { AuthLoadingSpinner } from "./components/AuthLoadingSpinner";
export { SocialAuthButtons } from "./components/SocialAuthButtons";
export { PermissionDeniedScreen } from "./components/PermissionDeniedScreen";
export { UnauthorizedScreen } from "./components/UnauthorizedScreen";
export { SessionExpiredDialog } from "./components/SessionExpiredDialog";
