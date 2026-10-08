import React, { useState } from "react";
import { FileSearch, CheckCircle2 } from "lucide-react";

interface ExtractedCriterion {
  id: string;
  category: string;
  label: string;
  weight: string;
  evidenceType: string;
}

const EXTRACTED_CRITERIA: ExtractedCriterion[] = [
  {
    id: "1",
    category: "Core Backend",
    label: "Python 3.11+ & AsyncIO Architecture",
    weight: "25%",
    evidenceType: "Must-Have Requirement",
  },
  {
    id: "2",
    category: "Data Systems",
    label: "PostgreSQL Query Tuning & Indexing",
    weight: "20%",
    evidenceType: "Verified Work Experience",
  },
  {
    id: "3",
    category: "Distributed",
    label: "Redis Caching & Queue Workers (ARQ)",
    weight: "15%",
    evidenceType: "Pipeline Evidence",
  },
  {
    id: "4",
    category: "API Design",
    label: "High-Throughput RESTful APIs",
    weight: "15%",
    evidenceType: "Production Metrics",
  },
  {
    id: "5",
    category: "Infrastructure",
    label: "Kubernetes Containerization",
    weight: "15%",
    evidenceType: "DevOps Competency",
  },
  {
    id: "6",
    category: "Testing",
    label: "Pytest Integration Suites",
    weight: "10%",
    evidenceType: "Quality Standard",
  },
];

export function SignalScene() {
  const [activeCriterion, setActiveCriterion] = useState<string>("1");

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-1 sm:py-2">
      {/* Header */}
      <div className="text-center max-w-xl mb-2 sm:mb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1A1916] text-[#315CFF] border border-[#302E29] mb-1.5">
          <FileSearch className="w-3 h-3" />
          <span>Requirement Extraction</span>
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#F3F0E8] tracking-tight leading-tight">
          Deconstruct the job description first.
        </h2>
        <p className="text-[11px] sm:text-xs text-[#A8A49A] mt-1 leading-normal max-w-lg mx-auto">
          CareerOS parses postings into structured evaluation criteria — weighting required skills,
          architecture patterns, and domain competencies.
        </p>
      </div>

      {/* Structured Deconstruction Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 items-stretch max-w-3xl">
        {/* Left: Raw Job Posting Context (Desktop/Tablet) */}
        <div className="hidden sm:flex lg:col-span-5 rounded-xl bg-[#1A1916] border border-[#302E29] p-3 sm:p-3.5 flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-[#302E29] pb-1.5 mb-2">
              <div>
                <span className="text-[9px] font-medium text-[#A8A49A] uppercase tracking-wider">
                  Target Posting
                </span>
                <h3 className="text-xs font-semibold text-[#F3F0E8]">Staff Platform Engineer</h3>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-[#11110F] text-[#A8A49A] border border-[#302E29]">
                Raw Input
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-[#A8A49A] leading-relaxed">
              <p className="p-2 rounded-lg bg-[#11110F] border border-[#302E29]/60 font-mono text-[10px] sm:text-[11px] text-[#A8A49A]">
                "Looking for a Backend Platform Engineer to scale our ingestion pipeline using
                Python, PostgreSQL, and Redis workers..."
              </p>
              <div className="p-2 rounded-lg bg-[#11110F] border border-[#302E29]/60 text-[10px] sm:text-[11px]">
                <span className="text-[#F3F0E8] font-medium block mb-0.5">
                  Key Evaluation Priorities:
                </span>
                <ul className="space-y-0.5 text-[#A8A49A]">
                  <li>• Async programming & throughput</li>
                  <li>• Query optimization & indexing</li>
                  <li>• Background worker pipelines</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-[#302E29] flex items-center justify-between text-[10px] text-[#A8A49A]">
            <span>6 Target Priorities</span>
            <span className="text-[#315CFF] font-medium">Weighted for Scoring</span>
          </div>
        </div>

        {/* Right: Extracted Evaluation Criteria */}
        <div className="lg:col-span-7 rounded-xl bg-[#1A1916] border border-[#302E29] p-3 sm:p-3.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-[#302E29] pb-1.5 mb-2">
              <h3 className="text-xs font-semibold text-[#F3F0E8]">Weighted Evaluation Criteria</h3>
              <span className="text-[10px] text-[#A8A49A]">Deconstructed Matrix</span>
            </div>

            {/* Criteria List */}
            <div className="space-y-1 sm:space-y-1.5">
              {EXTRACTED_CRITERIA.map((criterion) => {
                const isSelected = activeCriterion === criterion.id;
                return (
                  <button
                    key={criterion.id}
                    onClick={() => setActiveCriterion(criterion.id)}
                    className={`w-full text-left p-1.5 sm:p-2 rounded-lg border transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-[#11110F] border-[#315CFF]/60"
                        : "bg-[#11110F]/60 border-[#302E29]/60 hover:border-[#302E29]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CheckCircle2
                        className={`w-3 h-3 shrink-0 ${isSelected ? "text-[#315CFF]" : "text-[#A8A49A]/60"}`}
                      />
                      <div className="truncate">
                        <div className="text-[10px] sm:text-[11px] font-medium text-[#F3F0E8] truncate">
                          {criterion.label}
                        </div>
                        <span className="text-[9px] text-[#A8A49A]">{criterion.evidenceType}</span>
                      </div>
                    </div>

                    <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-mono font-medium bg-[#1A1916] border border-[#302E29] text-[#F3F0E8]">
                      {criterion.weight}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-[#302E29] text-[10px] text-[#A8A49A] flex items-center justify-between">
            <span>Criteria ready for evidence mapping</span>
            <span className="text-[#315CFF] font-medium">Automatic Matching →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
