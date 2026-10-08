import { useAuthContext } from "./AuthContext";

export function useAuth() {
  const context = useAuthContext();

  return {
    // State
    user: context.user,
    session: context.session,
    tokens: context.tokens,
    status: context.status,
    error: context.error,
    isInitialized: context.isInitialized,
    isAuthenticated: context.status === "authenticated",
    isLoading: context.status === "loading",
    profile: context.profile,
    isProfileLoading: context.isProfileLoading,
    profileFetchFailed: context.profileFetchFailed,

    // Actions
    login: context.login,
    logout: context.logout,
    register: context.register,
    signInWithOAuth: context.signInWithOAuth,
    forgotPassword: context.forgotPassword,
    resetPassword: context.resetPassword,
    verifyEmail: context.verifyEmail,
    refreshToken: context.refreshToken,
    clearError: context.clearError,
    fetchProfile: context.fetchProfile,
    updateOnboardingStep: context.updateOnboardingStep,
    updateProfile: context.updateProfile,
    completeOnboarding: context.completeOnboarding,
  };
}
