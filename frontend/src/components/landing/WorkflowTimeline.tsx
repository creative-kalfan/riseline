import { useState } from "react";
import { Target, FileSearch, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

interface Step {
  id: number;
  icon: React.ReactNode;
  tag: string;
  title: string;
  subtitle: string;
  problem: string;
  solution: string;
  telemetry: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    icon: <Target className="w-5 h-5 text-blue-400" />,
    tag: "PHASE 01 // TARGETING",
    title: "Deconstruct the Target Role",
    subtitle: "Turn ambiguous job postings into structured technical requirements.",
    problem:
      "Recruiter job descriptions are filled with buzzwords, unstated prerequisites, and hidden automated filters.",
    solution:
      "CareerOS parses the job description, extracts exact required technologies, experience weightings, and core competency vectors.",
    telemetry: "OUTPUT: 14 HARD SKILLS // 4 DOMAIN REQUIREMENTS // SALARY RANGE",
  },
  {
    id: 2,
    icon: <FileSearch className="w-5 h-5 text-purple-400" />,
    tag: "PHASE 02 // PARSING",
    title: "Deterministic Resume Extraction",
    subtitle: "8-factor profile vectorization preserving structural integrity.",
    problem:
      "Most AI resume tools blindly rewrite your history and hallucinate technologies you have never touched.",
    solution:
      "Our Python parsing engine breaks your resume into immutable career achievements, skills, and timeline nodes without altering your truth.",
    telemetry: "OUTPUT: 100% FACTUAL FIDELITY // LOSSLESS PROFILE GRAPH",
  },
  {
    id: 3,
    icon: <Sparkles className="w-5 h-5 text-amber-400" />,
    tag: "PHASE 03 // DIAGNOSTICS",
    title: "Continuous ATS Gap Analysis",
    subtitle: "Real-time scoring across role match, resume match, and experience overlap.",
    problem:
      "You hit submit without knowing whether your resume scored 30% or 90% in the employer's ATS parser.",
    solution:
      "View exact keyword matches, missing semantic phrases, and experience deficits before you send a single application.",
    telemetry: "OUTPUT: 8-FACTOR MATCH VECTOR // IDENTIFIED REJECTION RISKS",
  },
  {
    id: 4,
    icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
    tag: "PHASE 04 // STUDIO",
    title: "Version-Safe Two-Pane Optimization",
    subtitle: "Derived versions created specifically for target opportunities.",
    problem:
      "Editing your master resume constantly leaves you with 40 chaotic files named 'Resume_Final_v3_Google.pdf'.",
    solution:
      "Maintain one Master Resume. CareerOS generates derived versions per job, applying surgical bullet-point refactors with diff previews.",
    telemetry: "OUTPUT: MASTER PRESERVED // TARGET-OPTIMIZED DERIVED VERSION",
  },
  {
    id: 5,
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    tag: "PHASE 05 // EXECUTION",
    title: "Application Execution & Pipeline",
    subtitle: "Export clean vector PDFs and manage stages from applied to offer.",
    problem:
      "Tracking 30 applications across spreadsheets and email threads leads to missed follow-ups and lost leverage.",
    solution:
      "Export crisp, ATS-compliant PDFs and track every application in a unified command center with timeline intelligence.",
    telemetry: "OUTPUT: VECTOR PDF RENDER // CONVERTED PIPELINE TELEMETRY",
  },
];

export function WorkflowTimeline() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const current = STEPS[activeStep];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pb-6">
        {STEPS.map((step, idx) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(idx)}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition ${
              activeStep === idx
                ? "bg-surface-elevated border-primary/80 shadow-md ring-1 ring-primary/30"
                : "bg-surface/50 border-border/60 hover:bg-surface hover:border-border"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                0{step.id}
              </span>
              <div className="p-1 rounded-md bg-surface-instrument border border-border/40">
                {step.icon}
              </div>
            </div>
            <span className="text-xs font-bold text-foreground line-clamp-1">{step.title}</span>
            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {step.tag.split("//")[1]}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/80 bg-surface/90 backdrop-blur-sm p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <span className="text-xs font-mono font-bold text-primary tracking-wider uppercase">
              {current.tag}
            </span>
            <h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">
              {current.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{current.subtitle}</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-surface-instrument border border-border/60 font-mono text-[11px] text-emerald-400 self-start lg:self-auto">
            {current.telemetry}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-rose-950/70 bg-rose-950/20 p-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              THE CONVENTIONAL FAILURE MODE
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
              {current.problem}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-950/70 bg-emerald-950/20 p-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              THE CAREEROS SYSTEMIC ADVANTAGE
            </div>
            <p className="text-xs sm:text-sm text-foreground/90 mt-2 leading-relaxed font-medium">
              {current.solution}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
          <div className="text-xs text-muted-foreground font-mono">
            PHASE {activeStep + 1} OF {STEPS.length}
          </div>
          <button
            onClick={() => setActiveStep((prev) => (prev + 1) % STEPS.length)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition cursor-pointer"
          >
            Next Phase: {STEPS[(activeStep + 1) % STEPS.length].title}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
