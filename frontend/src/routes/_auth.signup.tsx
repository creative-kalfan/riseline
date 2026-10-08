import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { SocialAuthButtons } from "../auth/components/SocialAuthButtons";
import {
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  FileCheck2,
  CheckCircle2,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/_auth/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up · CareerOS" },
      {
        name: "description",
        content:
          "Create your CareerOS profile to build your verified career intelligence workspace.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const {
    register,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    fetchProfile,
    profile,
    isProfileLoading,
  } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Handle redirect after signup
  useEffect(() => {
    if (isAuthenticated && !isProfileLoading) {
      if (profile) {
        if (profile.onboardingCompleted) {
          navigate({ to: "/dashboard", replace: true });
        } else {
          navigate({ to: "/onboarding", replace: true });
        }
      } else {
        // Fetch profile if not loaded
        fetchProfile();
      }
    }
  }, [isAuthenticated, isProfileLoading, profile, fetchProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register(email, password, name);
      // Profile will be fetched in the useEffect above
    } catch {
      // Error is set in context
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
      {/* Left Column: Positioning & Conversion Framing (Secondary on Mobile) */}
      <div className="lg:col-span-7 flex flex-col justify-center text-left pt-2 lg:pt-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-surface-elevated border-2 border-border text-muted-foreground mb-4 w-fit font-mono uppercase tracking-wider shadow-brutal-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Career Workspace</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.14]">
          Build once.
          <br />
          <span className="text-primary">Apply with intent.</span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4 max-w-lg">
          Create your CareerOS profile and turn your experience into a career system you can
          continuously improve.
        </p>

        {/* 3 Core Value Proofs */}
        <div className="mt-6 sm:mt-8 space-y-3.5 max-w-lg">
          <div className="flex items-start gap-3 text-xs sm:text-sm text-muted-foreground">
            <div className="mt-0.5 rounded-md p-1.5 bg-surface-elevated border-2 border-border text-primary shrink-0 shadow-brutal-xs">
              <FileCheck2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Don't start from a blank page.</span>{" "}
              Turn your existing background into a structured intelligence base.
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs sm:text-sm text-muted-foreground">
            <div className="mt-0.5 rounded-md p-1.5 bg-surface-elevated border-2 border-border text-primary shrink-0 shadow-brutal-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Zero experience fabrication.</span>{" "}
              Suggests truthful bullet refinements based solely on your real achievements.
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs sm:text-sm text-muted-foreground">
            <div className="mt-0.5 rounded-md p-1.5 bg-surface-elevated border-2 border-border text-primary shrink-0 shadow-brutal-xs">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Role-specific derived versions.</span>{" "}
              Master resume stays untouched while you adapt to specific openings.
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Signup Form Card (Primary on Mobile) */}
      <div className="lg:col-span-5 w-full max-w-md mx-auto lg:mx-0">
        <div className="rounded-lg border-2 border-border bg-surface p-6 sm:p-8 shadow-brutal">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
              Create your profile
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Start building your structured career intelligence system
            </p>
          </div>

          <SocialAuthButtons className="mb-6" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-md border-2 border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive flex items-center gap-2 font-mono"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error.message}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-foreground font-mono">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                required
                className="flex h-11 w-full rounded-md border-2 border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-foreground font-mono">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="flex h-11 w-full rounded-md border-2 border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-foreground font-mono">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min. 6 characters)"
                  required
                  minLength={6}
                  className="flex h-11 w-full rounded-md border-2 border-border bg-background px-3.5 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary-hover active:translate-x-[1px] active:translate-y-[1px] text-sm font-semibold text-primary-foreground border-2 border-border shadow-brutal-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating profile...</span>
                </>
              ) : (
                <>
                  <span>Create my CareerOS profile</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t-2 border-border text-center text-xs text-muted-foreground font-mono">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <span>Sign in</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
