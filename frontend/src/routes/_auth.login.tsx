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
  ShieldCheck,
  Target,
  Cpu,
} from "lucide-react";

export const Route = createFileRoute("/_auth/login")({
  head: () => ({
    meta: [
      { title: "Sign In · CareerOS" },
      {
        name: "description",
        content: "Sign in to access your CareerOS intelligence workspace.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Navigate optimistically on session: _app owns the profile behind the
  // shell (single-flight fetch) and redirects to onboarding when the
  // profile resolves as incomplete. Waiting here for profile added a full
  // serial leg (600-2500ms on cold Render) before first dashboard paint.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (profile) {
      if (profile.onboardingCompleted) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        navigate({ to: "/onboarding", replace: true });
      }
    } else {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isAuthenticated, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      // Profile will be fetched in the useEffect above
    } catch {
      // Error is set in context
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
      {/* Left Column: Contextual Positioning & Narrative (Secondary on Mobile) */}
      <div className="lg:col-span-7 flex flex-col justify-center text-left pt-2 lg:pt-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-surface-elevated border-2 border-border text-muted-foreground mb-4 w-fit font-mono uppercase tracking-wider shadow-brutal-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Career Workspace</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.14]">
          Your next application
          <br />
          <span className="text-primary">starts here.</span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3 sm:mt-4 max-w-lg">
          Pick up where you left off. Your career profile, resume versions, job matches, and
          application strategy are waiting.
        </p>

        {/* 3 Core Value Proofs */}
        <div className="mt-6 sm:mt-8 space-y-3.5 max-w-lg">
          <div className="flex items-start gap-3 text-xs sm:text-sm text-muted-foreground">
            <div className="mt-0.5 rounded-md p-1.5 bg-surface-elevated border-2 border-border text-primary shrink-0 shadow-brutal-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-foreground">One verified profile.</span> Never
              rewrite your experience from scratch for each opportunity.
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs sm:text-sm text-muted-foreground">
            <div className="mt-0.5 rounded-md p-1.5 bg-surface-elevated border-2 border-border text-primary shrink-0 shadow-brutal-xs">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Targeted role versions.</span> Safe,
              truth-preserving tailoring matching exact job requirements.
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs sm:text-sm text-muted-foreground">
            <div className="mt-0.5 rounded-md p-1.5 bg-surface-elevated border-2 border-border text-primary shrink-0 shadow-brutal-xs">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Deterministic gap analysis.</span> Know
              your evidence match score before recruiters open your PDF.
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form Card (Primary on Mobile) */}
      <div className="lg:col-span-5 w-full max-w-md mx-auto lg:mx-0">
        <div className="rounded-lg border-2 border-border bg-surface p-6 sm:p-8 shadow-brutal-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
              Sign in to CareerOS
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Access your career intelligence workspace</p>
          </div>

          <SocialAuthButtons className="mb-6" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-md border-2 border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive flex items-center gap-2 font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error.message}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-foreground font-mono uppercase tracking-wider">
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
                className="flex h-10 w-full rounded-md border-2 border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-foreground font-mono uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors font-mono"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="flex h-10 w-full rounded-md border-2 border-border bg-surface-elevated px-3 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary-hover active:opacity-90 text-sm font-semibold text-primary-foreground transition border-2 border-primary shadow-brutal-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-mono uppercase tracking-wider"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Continue to CareerOS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t-2 border-border text-center text-xs text-muted-foreground">
            New to CareerOS?{" "}
            <Link
              to="/signup"
              className="font-semibold text-primary hover:underline transition-colors inline-flex items-center gap-1 font-mono"
            >
              <span>Create your career profile</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
