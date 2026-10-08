import { XCircle, CheckCircle, ArrowRight } from "lucide-react";

export function BrokenSearchComparison() {
  return (
    <div className="w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-mono font-semibold text-primary uppercase tracking-widest">
          SYSTEMIC COMPARISON
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-2 tracking-tight">
          Stop treating job hunting like a lottery ticket.
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Submitting 400 uncalibrated resumes into ATS filters is statistically hopeless. CareerOS
          replaces random volume with engineered precision.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Old Broken Way */}
        <div className="rounded-2xl border border-rose-900/50 bg-surface/80 p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div>
                <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">
                  THE SPRAY & PRAY PARADIGM
                </span>
                <h3 className="text-lg font-bold text-foreground mt-0.5">Generic PDF Blasting</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-rose-950/60 text-rose-300 border border-rose-800/60 font-semibold">
                ~2% Response
              </span>
            </div>

            <ul className="mt-5 space-y-3.5 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  Sending the same master resume to 50 companies with wildly different tech stacks.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  Zero feedback: Rejections happen in complete silence with no actionable diagnostic
                  signal.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Chaotic desktop clutter with 30 disjointed Word docs and PDF variants.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  Generic AI bots rewriting your resume with fake buzzwords that fail technical
                  interviews.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50 text-[11px] font-mono text-rose-400/90">
            RESULT: Exhaustion, impostor syndrome, 6+ month search cycles.
          </div>
        </div>

        {/* The CareerOS Way */}
        <div className="rounded-2xl border border-primary/60 bg-surface/90 p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between shadow-xl ring-1 ring-primary/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  THE CAREEROS OPERATING SYSTEM
                </span>
                <h3 className="text-lg font-bold text-foreground mt-0.5">
                  Target-Calibrated Execution
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-semibold">
                High-Signal Match
              </span>
            </div>

            <ul className="mt-5 space-y-3.5 text-xs sm:text-sm text-foreground/90 font-medium">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Deterministic 8-factor matching against verified job descriptions before applying.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Two-Pane Resume Studio with version-safe derived tailoring per specific role.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Zero-hallucination guardrails: Your factual timeline is preserved with zero
                  invented credentials.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  End-to-end pipeline management: from JD ingestion to vector PDF export and
                  interview tracking.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-[11px] font-mono text-emerald-400">
              RESULT: Higher conversion, clear leverage, interview readiness.
            </span>
            <a
              href="/signup"
              className="text-xs font-bold text-primary hover:text-primary/80 inline-flex items-center gap-1 transition"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
