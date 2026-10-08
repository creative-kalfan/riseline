import { Link } from "@tanstack/react-router";
import { Terminal, Shield, Cpu, Activity } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-border/80 bg-surface-elevated/40 text-xs text-muted-foreground">
      {/* Telemetry Status Strip */}
      <div className="border-b border-border/60 py-3 px-4 sm:px-6 lg:px-8 bg-surface/50">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4 font-mono text-[11px]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
              SYSTEM_STATUS: OPERATIONAL
            </span>
            <span className="hidden sm:inline text-muted-foreground/60">|</span>
            <span className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
              <Cpu className="w-3.5 h-3.5" />
              ENGINE: DETERMINISTIC_8_FACTOR
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              RLS_SCOPED // ZERO_HALLUCINATION
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold text-foreground">CareerOS</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            The AI Career Operating System. Deconstruct target roles, vectorize resume intelligence,
            and execute job applications with deterministic confidence.
          </p>
        </div>

        <div>
          <h4 className="font-mono text-[11px] font-bold text-foreground uppercase tracking-wider mb-3">
            Core Modules
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/login" className="hover:text-foreground transition">
                Resume Studio
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-foreground transition">
                ATS Diagnostics
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-foreground transition">
                Job Intelligence & Crawler
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-foreground transition">
                Application Pipeline
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-mono text-[11px] font-bold text-foreground uppercase tracking-wider mb-3">
            Access
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link
                to="/signup"
                className="text-primary hover:text-primary/80 font-medium transition"
              >
                Create Account
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-foreground transition">
                Sign In
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border/40 py-6 px-4 text-center text-[11px] text-muted-foreground font-mono">
        © {new Date().getFullYear()} CareerOS Studio. Built for candidates tired of guessing.
      </div>
    </footer>
  );
}
