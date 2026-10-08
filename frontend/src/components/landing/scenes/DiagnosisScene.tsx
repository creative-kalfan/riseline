import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

interface RequirementItem {
  id: string;
  name: string;
  category: "verified" | "weak" | "missing";
  detail: string;
}

export function DiagnosisScene() {
  const [selectedRole, setSelectedRole] = useState<"swe" | "ai" | "fullstack">("swe");

  const roleData: Record<
    "swe" | "ai" | "fullstack",
    {
      title: string;
      companyType: string;
      score: number;
      requirements: RequirementItem[];
      summary: string;
    }
  > = {
    swe: {
      title: "Backend Platform Engineer",
      companyType: "Distributed Systems & Cloud",
      score: 62,
      requirements: [
        {
          id: "1",
          name: "Python 3.11+ & AsyncIO",
          category: "verified",
          detail: "Found in Experience Section (3 yrs verified)",
        },
        {
          id: "2",
          name: "PostgreSQL Schema Tuning",
          category: "verified",
          detail: "Found in Query tuning & indexing bullets",
        },
        {
          id: "3",
          name: "High-Throughput RESTful APIs",
          category: "verified",
          detail: "Found in API Gateway development",
        },
        {
          id: "4",
          name: "Redis Caching & Queue Workers",
          category: "weak",
          detail: "Mentioned casually without quantified impact",
        },
        {
          id: "5",
          name: "Kubernetes Production Ingress",
          category: "missing",
          detail: "Zero occurrence across current resume",
        },
      ],
      summary:
        "Critical gap: Missing orchestrator evidence and unquantified queue metrics lower your match probability.",
    },
    ai: {
      title: "AI Systems Engineer",
      companyType: "LLM Infrastructure & Evaluation",
      score: 58,
      requirements: [
        {
          id: "1",
          name: "FastAPI / Python Services",
          category: "verified",
          detail: "Verified backend service architecture",
        },
        {
          id: "2",
          name: "Vector Search & Retrieval",
          category: "weak",
          detail: "Present in personal project, absent in work roles",
        },
        {
          id: "3",
          name: "Deterministic Gateways",
          category: "missing",
          detail: "Missing explicit gateway design evidence",
        },
        {
          id: "4",
          name: "Pytest & Integration Suites",
          category: "verified",
          detail: "Strong test coverage documented",
        },
        {
          id: "5",
          name: "Latency Benchmarks",
          category: "missing",
          detail: "No quantitative benchmarking mentioned",
        },
      ],
      summary:
        "High rejection risk: Core infrastructure keywords missing from production experience.",
    },
    fullstack: {
      title: "Senior Fullstack Engineer",
      companyType: "SaaS Product & Web Architecture",
      score: 64,
      requirements: [
        {
          id: "1",
          name: "TypeScript & Modern React (v19)",
          category: "verified",
          detail: "Strong frontend component architecture",
        },
        {
          id: "2",
          name: "TanStack Router & Query State",
          category: "weak",
          detail: "Generic React query listed, needs exact library match",
        },
        {
          id: "3",
          name: "Design Systems & Tailwind",
          category: "verified",
          detail: "Verified token system implementation",
        },
        {
          id: "4",
          name: "Postgres RLS Policies",
          category: "verified",
          detail: "Documented security role policies",
        },
        {
          id: "5",
          name: "Playwright E2E Pipelines",
          category: "missing",
          detail: "Testing limited to unit tests",
        },
      ],
      summary: "E2E testing gap and missing router keywords reduce candidate match confidence.",
    },
  };

  const current = roleData[selectedRole];

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-1 sm:py-2">
      {/* Header */}
      <div className="text-center max-w-xl mb-1.5 sm:mb-2.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1A1916] text-[#E4573D] border border-[#302E29] mb-1">
          <ShieldAlert className="w-3 h-3" />
          <span>Evidence Mapping</span>
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#F3F0E8] tracking-tight leading-tight">
          See why your resume isn't getting interviews.
        </h2>
        <p className="text-[11px] sm:text-xs text-[#A8A49A] mt-0.5 leading-normal max-w-lg mx-auto">
          CareerOS maps your resume against target requirements — identifying what is proven, what
          is weak, and what is missing.
        </p>
      </div>

      {/* Role Picker */}
      <div className="flex items-center gap-1 mb-2 p-0.5 bg-[#1A1916] border border-[#302E29] rounded-lg">
        {(["swe", "ai", "fullstack"] as const).map((key) => {
          const labels = {
            swe: "Backend Platform",
            ai: "AI Systems",
            fullstack: "Fullstack SaaS",
          };
          return (
            <button
              key={key}
              onClick={() => setSelectedRole(key)}
              className={`px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium transition cursor-pointer ${
                selectedRole === key
                  ? "bg-[#11110F] text-[#F3F0E8] border border-[#302E29]"
                  : "text-[#A8A49A] hover:text-[#F3F0E8]"
              }`}
            >
              {labels[key]}
            </button>
          );
        })}
      </div>

      {/* Diagnostic Dashboard Card */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 bg-[#1A1916] border border-[#302E29] rounded-xl p-3 sm:p-3.5 shadow-xs max-w-3xl">
        {/* Left Column: Requirements Matrix */}
        <div className="lg:col-span-8 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between border-b border-[#302E29] pb-1.5">
            <div>
              <span className="text-[9px] font-medium text-[#A8A49A] uppercase tracking-wider">
                Target Requirements
              </span>
              <h3 className="text-xs font-semibold text-[#F3F0E8] flex items-center gap-1.5 mt-0.5">
                {current.title}
                <span className="text-[9px] font-normal px-1.5 py-0.2 rounded bg-[#11110F] border border-[#302E29] text-[#A8A49A]">
                  {current.companyType}
                </span>
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-[#A8A49A]">Evidence Mapped</span>
              <div className="text-[11px] font-mono font-medium text-[#F3F0E8]">5 Criteria</div>
            </div>
          </div>

          {/* Requirements List */}
          <div className="space-y-1 sm:space-y-1.5">
            {current.requirements.map((req, idx) => (
              <div
                key={req.id}
                className={`items-start justify-between gap-2 p-1.5 sm:p-2 rounded-lg bg-[#11110F]/80 border border-[#302E29]/60 ${
                  idx > 3 ? "hidden sm:flex" : "flex"
                }`}
              >
                <div className="flex items-start gap-1.5 min-w-0">
                  {req.category === "verified" && (
                    <CheckCircle2 className="w-3 h-3 text-[#45A875] mt-0.5 shrink-0" />
                  )}
                  {req.category === "weak" && (
                    <AlertTriangle className="w-3 h-3 text-[#E4573D] mt-0.5 shrink-0" />
                  )}
                  {req.category === "missing" && (
                    <XCircle className="w-3 h-3 text-[#E4573D] mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-[11px] font-medium text-[#F3F0E8] flex items-center gap-1.5">
                      <span className="truncate">{req.name}</span>
                      <span
                        className={`text-[8px] sm:text-[9px] font-medium uppercase px-1 py-0.2 rounded shrink-0 ${
                          req.category === "verified"
                            ? "bg-[#45A875]/15 text-[#45A875] border border-[#45A875]/30"
                            : "bg-[#E4573D]/15 text-[#E4573D] border border-[#E4573D]/30"
                        }`}
                      >
                        {req.category}
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-[#A8A49A] mt-0.5 truncate">
                      {req.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Diagnostic Alignment Score */}
        <div className="lg:col-span-4 flex flex-col justify-between p-3 sm:p-4 rounded-lg bg-[#11110F] border border-[#302E29]">
          <div className="space-y-2 sm:space-y-3">
            <span className="text-[10px] font-medium text-[#A8A49A] uppercase tracking-wider block">
              Baseline Alignment
            </span>

            {/* Score Display */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-[#E4573D]">
                {current.score}%
              </span>
              <span className="text-[11px] text-[#A8A49A]">Generic Fit</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-[#1A1916] overflow-hidden">
              <div
                className="h-full bg-[#E4573D] transition-all duration-500 rounded-full"
                style={{ width: `${current.score}%` }}
              />
            </div>

            <p className="text-[11px] text-[#A8A49A] leading-relaxed">{current.summary}</p>
          </div>

          <div className="pt-3 border-t border-[#302E29] text-[11px] text-[#A8A49A]">
            <div className="flex items-center justify-between">
              <span>Next Stage</span>
              <span className="text-[#315CFF] font-medium">Safe Refactor →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
