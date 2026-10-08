import { env } from "../config/env";

export const authConfig = {
  // Session configuration
  session: {
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
    extendOnActivity: true,
  },

  // Routes
  routes: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
    verifyEmail: "/verify-email",
    dashboard: "/dashboard",
  },

  // API endpoints (to be connected later)
  endpoints: {
    login: "/auth/login",
    logout: "/auth/logout",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    verifyEmail: "/auth/verify-email",
    refreshToken: "/auth/refresh",
    me: "/auth/me",
  },

  // Feature flags
  features: {
    enableEmailVerification: true,
    enableTwoFactor: false,
    enableRememberMe: true,
    enableSessionManagement: true,
  },
} as const;

export type AuthConfig = typeof authConfig;
