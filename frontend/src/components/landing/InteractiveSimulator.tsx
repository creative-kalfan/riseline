import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Layers,
} from "lucide-react";

interface RoleScenario {
  id: string;
  roleTitle: string;
  companyTier: string;
  jdSnippet: string;
  baselineScore: number;
  optimizedScore: number;
  missingSkills: string[];
  matchedSkills: string[];
  diffPreview: {
    original: string;
    optimized: string;
    impact: string;
  };
}

const SCENARIOS: RoleScenario[] = [
  {
    id: "fullstack",
    roleTitle: "Staff Full-Stack Architect",
    companyTier: "High-Growth Fintech / Series B+",
    jdSnippet:
      "Seeking a Staff Architect with deep expertise in distributed event-driven systems, Next.js/TanStack state orchestration, PostgreSQL RLS, and high-throughput Redis queues.",
    baselineScore: 48,
    optimizedScore: 95,
    missingSkills: ["Event-Driven Architecture", "PostgreSQL RLS", "High-Throughput Redis"],
    matchedSkills: ["TypeScript", "FastAPI", "TanStack Router", "React 19"],
    diffPreview: {
      original:
        "Built backend APIs with Python and managed database queries for user application tracking.",
      optimized:
        "Architected distributed event-driven ingestion pipeline with Redis & ARQ, reducing ATS scoring latency by 64% with PostgreSQL RLS security.",
      impact: "+47% ATS Semantic Alignment",
    },
  },
  {
    id: "ai-engineer",
    roleTitle: "Senior AI Systems Engineer",
    companyTier: "Enterprise AI Platform",
    jdSnippet:
      "Looking for an engineer experienced with LLM Provider Fallbacks, structured Pydantic JSON extraction, deterministic evaluation pipelines, and token latency minimization.",
    baselineScore: 52,
    optimizedScore: 96,
    missingSkills: ["LLM Gateway Fallback", "Deterministic Eval", "Pydantic Structured Output"],
    matchedSkills: ["Python 3.11", "Vector Search", "FastAPI", "Prompt Engineering"],
    diffPreview: {
      original: "Integrated OpenAI API to generate suggestions for resume sections.",
      optimized:
        "Engineered multi-provider LLM Gateway with automatic rate-limit fallback and strict Pydantic JSON schemas, eliminating parse failures.",
      impact: "+44% ATS Semantic Alignment",
    },
  },
  {
    id: "product-lead",
    roleTitle: "Principal Product Manager",
    companyTier: "B2B SaaS Unicorn",
    jdSnippet:
      "Needs a product leader who has designed intent-driven onboarding, activation metric funnels, deterministic user workflows, and reduced job seeker drop-off.",
    baselineScore: 44,
    optimizedScore: 92,
    missingSkills: ["Intent-Driven Onboarding", "Funnel Cohort Diagnostics", "Activation Velocity"],
    matchedSkills: ["Roadmapping", "B2B SaaS UX", "User Research", "Agile Execution"],
    diffPreview: {
      original: "Led sprint planning and coordinated feature launches with engineering teams.",
      optimized:
        "Spearheaded two-pane intent-first workspace architecture, lifting candidate funnel activation by 38% while cutting time-to-first-apply in half.",
      impact: "+48% ATS Semantic Alignment",
    },
  },
];

export function InteractiveSimulator() {
  const [selectedId, setSelectedId] = useState<string>("fullstack");
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [hasApplied, setHasApplied] = useState<boolean>(true);

  const scenario = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];

  const handleRoleChange = (id: string) => {
    setSelectedId(id);
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setHasApplied(true);
    }, 450);
  };

  const toggleApply = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setHasApplied((prev) => !prev);
    }, 300);
  };

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-surface/90 backdrop-blur-sm p-5 sm:p-7 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
              <Layers className="w-3.5 h-3.5" />
              LIVE TELEMETRY LAB
            </span>
            <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
              SELECT TARGET ROLE TO SIMULATE ALIGNMENT
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1.5 tracking-tight">
            See how CareerOS turns a 45% rejection into a 95% match
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-surface-elevated/80 p-1 rounded-xl border border-border/60">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleRoleChange(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedId === s.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              }`}
            >
              {s.roleTitle.split(" ")[1] || s.roleTitle}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-xl border border-border/70 bg-surface-elevated/50 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                TARGET JOB SPECIFICATION
              </span>
              <span className="text-[10px] text-muted-foreground">{scenario.companyTier}</span>
            </div>
            <h4 className="text-sm font-bold text-foreground mt-2">{scenario.roleTitle}</h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed bg-surface/80 p-3 rounded-lg border border-border/40 font-sans">
              "{scenario.jdSnippet}"
            </p>

            <div className="mt-4 pt-3 border-t border-border/40">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block mb-2">
                Identified Competency Gaps:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {scenario.missingSkills.map((sk) => (
                  <span
                    key={sk}
                    className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md border transition ${
                      hasApplied
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
                        : "bg-amber-950/40 text-amber-300 border-amber-800/60"
                    }`}
                  >
                    {hasApplied ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                    )}
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface-elevated/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted-foreground">ATS MATCH PROJECTION</span>
              <span className="text-xs font-mono font-bold text-foreground">
                {hasApplied
                  ? `${scenario.optimizedScore}% (INTERVIEW TARGET)`
                  : `${scenario.baselineScore}% (HIGH REJECTION RISK)`}
              </span>
            </div>
            <div className="w-full h-3 bg-surface rounded-full overflow-hidden border border-border/60 relative">
              <div
                className={`h-full transition-all duration-700 rounded-full ${
                  hasApplied
                    ? "bg-gradient-to-r from-primary to-emerald-500"
                    : "bg-gradient-to-r from-rose-500 to-amber-500"
                }`}
                style={{
                  width: `${hasApplied ? scenario.optimizedScore : scenario.baselineScore}%`,
                }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground mt-2">
              <span>Baseline: {scenario.baselineScore}%</span>
              <span className="text-emerald-400 font-bold">
                {hasApplied
                  ? `+${scenario.optimizedScore - scenario.baselineScore}% Alignment Lift`
                  : "Needs Studio Tailoring"}
              </span>
              <span>Target: 90%+</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-border/80 bg-background/90 p-4 sm:p-5 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground tracking-wide">
                  RESUME STUDIO TARGETED REFACTORING
                </span>
              </div>
              <button
                onClick={toggleApply}
                disabled={isOptimizing}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium border border-border bg-surface-elevated hover:bg-surface text-foreground transition cursor-pointer"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isOptimizing ? "animate-spin text-primary" : ""}`}
                />
                {hasApplied ? "View Raw Baseline" : "Apply AI Refactor"}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Generic Uncalibrated Bullet (Will get skipped by recruiters)
                </span>
                <div className="mt-1.5 text-xs text-muted-foreground p-3 rounded-lg border border-rose-950/60 bg-rose-950/20 font-mono leading-relaxed line-through decoration-rose-400/50">
                  {scenario.diffPreview.original}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    CareerOS Derived Version Refactor (Target-aligned metrics)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-700/50 text-emerald-300 font-medium">
                    {scenario.diffPreview.impact}
                  </span>
                </div>
                <div
                  className={`mt-1.5 text-xs p-3 rounded-lg border transition-all duration-300 font-mono leading-relaxed ${
                    hasApplied
                      ? "border-emerald-700/60 bg-emerald-950/30 text-foreground font-medium shadow-inner"
                      : "border-border/60 bg-surface/50 text-muted-foreground/80 opacity-60"
                  }`}
                >
                  {scenario.diffPreview.optimized}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-surface-elevated/60 border border-border/60 rounded-lg p-2.5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span className="leading-tight text-[11px]">
                <strong className="text-foreground">Deterministic Guardrails:</strong> CareerOS
                preserves your real career history and never invents employers, fake dates, or
                hallucinated credentials.
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Ready to see this on your own resume?
            </div>
            <a
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-xs"
            >
              Analyze My Resume Against A Job
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
