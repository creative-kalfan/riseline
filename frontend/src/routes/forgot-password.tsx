import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { ArrowRight, AlertCircle, Loader2, Compass, ArrowLeft, MailCheck } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password · CareerOS" },
      { name: "description", content: "Reset your CareerOS account password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      // Error is set in context
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col justify-between bg-background text-foreground selection:bg-primary/30 selection:text-foreground overflow-x-hidden">
      {/* Subtle grid backdrop */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(243, 240, 232, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(243, 240, 232, 0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 90%)",
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 w-full border-b-2 border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-md bg-surface-elevated border-2 border-border flex items-center justify-center text-primary group-hover:border-primary transition shadow-brutal-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-foreground font-mono">
                CareerOS
              </span>
              <span className="hidden sm:inline text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-elevated border-2 border-border text-muted-foreground font-mono uppercase">
                Career Intelligence
              </span>
            </div>
          </Link>
          <Link
            to="/login"
            className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition py-1.5 px-3 rounded-md hover:bg-surface-elevated flex items-center gap-1.5 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </header>

      {/* Center Stage */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg border-2 border-border bg-surface p-6 sm:p-8 shadow-brutal">
            <div className="mb-6 text-left">
              <h1 className="text-xl font-bold tracking-tight text-foreground font-mono">
                Reset password
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter your account email and we'll send you a secure reset link.
              </p>
            </div>

            {sent ? (
              <div className="space-y-4">
                <div className="rounded-md border-2 border-emerald-500/40 bg-emerald-500/10 px-4 py-3.5 text-xs text-emerald-400 flex items-start gap-2.5 font-mono">
                  <MailCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Check your email for a password reset link to access your workspace.</span>
                </div>
                <Link
                  to="/login"
                  className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary-hover active:translate-x-[1px] active:translate-y-[1px] text-sm font-semibold text-primary-foreground border-2 border-border shadow-brutal-sm transition cursor-pointer"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary-hover active:translate-x-[1px] active:translate-y-[1px] text-sm font-semibold text-primary-foreground border-2 border-border shadow-brutal-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send reset link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t-2 border-border text-center text-xs text-muted-foreground font-mono">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
