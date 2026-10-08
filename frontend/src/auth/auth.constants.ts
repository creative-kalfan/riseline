export const AUTH_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
} as const;

export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_NOT_VERIFIED: "Please verify your email before logging in",
  TOKEN_EXPIRED: "Your session has expired. Please log in again.",
  REFRESH_TOKEN_EXPIRED: "Your session has expired. Please log in again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
} as const;

export const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry
