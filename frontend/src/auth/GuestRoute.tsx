import { Navigate } from "@tanstack/react-router";
import { useAuth } from "./useAuth";
import { AUTH_ROUTES } from "./auth.constants";
import { AuthLoadingSpinner } from "./components/AuthLoadingSpinner";

interface GuestRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function GuestRoute({ children, redirectTo = "/dashboard" }: GuestRouteProps) {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return <AuthLoadingSpinner />;
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
