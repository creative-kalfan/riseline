import { Outlet, createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { AuthLoadingSpinner } from "../auth/components/AuthLoadingSpinner";
import { Compass, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized, isLoading, fetchProfile, profile, isProfileLoading, profileFetchFailed } =
    useAuth();

  // Handle redirect for already authenticated users.
  useEffect(() => {
    if (!isInitialized || isLoading || !isAuthenticated) return;

    // Profile query in flight — wait for it to resolve.
    if (isProfileLoading) return;

    // Profile never fetched (e.g., right after sign-in) — trigger the fetch
    // instead of assuming onboarding is incomplete.
    if (!profile) {
      fetchProfile();
      return;
    }

    // Profile resolved — safe to decide.
    if (profile.onboardingCompleted) {
      navigate({ to: "/dashboard", replace: true });
    } else {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [
    isInitialized,
    isLoading,
    isAuthenticated,
    fetchProfile,
    profile,
    isProfileLoading,
    navigate,
  ]);

  // Show loading while initializing
  if (!isInitialized || isLoading || (isAuthenticated && isProfileLoading)) {
    return <AuthLoadingSpinner />;
  }

  // If authenticated, show loading (redirect will happen in useEffect)
  // A failed profile fetch shows a retryable error instead of spinning forever.
  if (isAuthenticated) {
    if (!isProfileLoading && !profile && profileFetchFailed) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 text-center text-foreground">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <h2 className="text-base font-semibold">Couldn&apos;t load your profile</h2>
          <p className="max-w-xs text-xs text-muted-foreground">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => fetchProfile(true)}
            className="rounded-lg border-2 border-border bg-surface px-4 py-2 text-xs font-semibold transition hover:border-primary shadow-brutal-xs"
          >
            Retry
          </button>
        </div>
      );
    }
    return <AuthLoadingSpinner />;
  }

  return (
    <div className="relative min-h-dvh flex flex-col justify-between bg-background text-foreground selection:bg-primary/30 selection:text-foreground overflow-x-hidden">
      {/* Subtle textured grid backdrop */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(244, 247, 251, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(244, 247, 251, 0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 90%)",
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 w-full border-b-2 border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border-2 border-border flex items-center justify-center text-primary group-hover:border-primary transition shadow-brutal-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-foreground font-mono">
                CareerOS
              </span>
              <span className="hidden sm:inline text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-md bg-surface-elevated border border-border text-muted-foreground">
                Career Intelligence
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition py-1.5 px-3 rounded-lg hover:bg-surface-elevated border border-transparent hover:border-border"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </header>

      {/* Main Form + Context Stage */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Outlet />
      </main>

      {/* Trust Footnote */}
      <footer className="relative z-10 border-t-2 border-border py-4 px-4 text-center bg-surface/60">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5 text-success font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Zero Experience Fabrication
          </span>
          <span className="text-border">·</span>
          <span>Deterministic Matching</span>
          <span className="text-border">·</span>
          <span>Role-Specific Applications</span>
          <span className="text-border">·</span>
          <span>© {new Date().getFullYear()} CareerOS</span>
        </div>
      </footer>
    </div>
  );
}
