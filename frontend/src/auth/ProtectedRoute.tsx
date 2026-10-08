import { Navigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "./useAuth";
import { AUTH_ROUTES } from "./auth.constants";
import { AuthLoadingSpinner } from "./components/AuthLoadingSpinner.tsx";
import { PermissionDeniedScreen } from "./components/PermissionDeniedScreen.tsx";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  fallbackPath = AUTH_ROUTES.LOGIN,
}: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return <AuthLoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check permissions if required
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((permission) =>
      user.permissions.includes(permission as any),
    );

    if (!hasAllPermissions) {
      return <PermissionDeniedScreen requiredPermissions={requiredPermissions} />;
    }
  }

  return <>{children}</>;
}
