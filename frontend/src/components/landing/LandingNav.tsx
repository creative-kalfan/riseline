import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass } from "lucide-react";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-md bg-surface-elevated border-2 border-border flex items-center justify-center text-primary group-hover:border-primary transition shadow-brutal-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-foreground font-mono">CareerOS</span>
            <span className="hidden sm:inline text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-elevated border-2 border-border text-muted-foreground font-mono uppercase">
              Career Intelligence
            </span>
          </div>
        </Link>

        {/* Action CTAs */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-md px-3 py-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition font-mono"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-primary-foreground border-2 border-border shadow-brutal-xs hover:bg-primary-hover active:translate-x-[1px] active:translate-y-[1px] transition whitespace-nowrap"
          >
            <span>Create Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
