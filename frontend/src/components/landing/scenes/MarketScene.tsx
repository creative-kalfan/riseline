import React, { useState } from "react";
import { Compass, Building2, CheckCircle, Filter } from "lucide-react";

interface OpportunityNode {
  id: string;
  role: string;
  companyType: string;
  source: string;
  matchScore: number;
  location: string;
  reasons: string[];
}

const OPPORTUNITIES: OpportunityNode[] = [
  {
    id: "1",
    role: "Staff Backend Infrastructure Engineer",
    companyType: "Cloud Platform & Ingestion",
    source: "Verified Job Feed",
    matchScore: 94,
    location: "Remote (US / EU)",
    reasons: [
      "Exact match: Python AsyncIO + PostgreSQL query tuning",
      "Derived resume satisfies 100% of required technical criteria",
    ],
  },
  {
    id: "2",
    role: "Platform Architecture Engineer",
    companyType: "Distributed Systems Security",
    source: "Company Portal",
    matchScore: 91,
    location: "Hybrid / New York",
    reasons: [
      "Strong match: Redis caching and API worker pipelines",
      "One-click tailored version ready for submission",
    ],
  },
  {
    id: "3",
    role: "High-Throughput Services Lead",
    companyType: "High-Growth Data SaaS",
    source: "Direct Posting",
    matchScore: 88,
    location: "Remote (Global)",
    reasons: [
      "Matched 5 of 6 core infrastructure criteria",
      "Minor gap: Kubernetes ingress highlighted in analysis",
    ],
  },
];

export function MarketScene() {
  const [selectedOpp, setSelectedOpp] = useState<OpportunityNode>(OPPORTUNITIES[0]);

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-2 sm:py-4">
      {/* Header */}
      <div className="text-center max-w-2xl mb-2.5 sm:mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#1A1916] text-[#315CFF] border border-[#302E29] mb-2">
          <Compass className="w-3.5 h-3.5" />
          <span>Opportunity Discovery</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#F3F0E8] tracking-tight">
          Target opportunities where your proof is strongest.
        </h2>
        <p className="text-xs sm:text-sm text-[#A8A49A] mt-1 leading-relaxed">
          CareerOS connects your verified profile to active roles — ranking openings by technical
          alignment and proof completeness.
        </p>
      </div>

      {/* Main Interactive Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch max-w-4xl">
        {/* Left Side: Discovered Opportunities List */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between pb-0.5 px-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#A8A49A]">
              <Filter className="w-3 h-3 text-[#315CFF]" />
              <span>Ranked by Verified Match</span>
            </div>
            <span className="text-[11px] text-[#45A875] font-medium">3 High-Fit Matches</span>
          </div>

          {OPPORTUNITIES.map((opp, idx) => {
            const isSelected = selectedOpp.id === opp.id;
            return (
              <button
                key={opp.id}
                onClick={() => setSelectedOpp(opp)}
                className={`w-full text-left p-2 sm:p-2.5 rounded-xl border transition cursor-pointer items-start justify-between gap-3 ${
                  idx > 1 ? "hidden sm:flex" : "flex"
                } ${
                  isSelected
                    ? "bg-[#1A1916] border-[#315CFF]/60 shadow-sm"
                    : "bg-[#1A1916]/60 border-[#302E29]/60 hover:border-[#302E29]"
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-[#A8A49A] shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-medium text-[#F3F0E8] truncate">
                      {opp.companyType}
                    </span>
                    <span className="text-[9px] text-[#A8A49A]">({opp.source})</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-[#F3F0E8] truncate">
                    {opp.role}
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-[#A8A49A]">{opp.location}</p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-medium ${
                      opp.matchScore >= 90
                        ? "bg-[#45A875]/15 text-[#45A875] border border-[#45A875]/30"
                        : "bg-[#11110F] text-[#F3F0E8] border border-[#302E29]"
                    }`}
                  >
                    {opp.matchScore}% Match
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Selected Opportunity Inspector */}
        <div className="lg:col-span-5 rounded-xl bg-[#1A1916] border border-[#302E29] p-3.5 sm:p-4.5 flex flex-col justify-between shadow-sm">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#302E29] pb-2">
              <span className="text-[10px] font-medium text-[#A8A49A] uppercase tracking-wider">
                Application Readiness
              </span>
              <span className="text-xs font-mono font-medium text-[#45A875]">
                {selectedOpp.matchScore}% Verified Fit
              </span>
            </div>

            <div>
              <div className="text-[11px] text-[#315CFF] font-medium">
                {selectedOpp.companyType}
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-[#F3F0E8] mt-0.5">
                {selectedOpp.role}
              </h3>
              <p className="text-[10px] text-[#A8A49A]">{selectedOpp.location}</p>
            </div>

            <div className="space-y-1.5 pt-1.5 border-t border-[#302E29] text-[11px]">
              {selectedOpp.reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[#A8A49A]">
                  <CheckCircle className="w-3.5 h-3.5 text-[#45A875] mt-0.5 shrink-0" />
                  <span className="leading-tight">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#302E29] text-[11px] text-[#A8A49A] flex items-center justify-between">
            <span>Ready for one-click submission</span>
            <span className="text-[#315CFF] font-medium">Final Decision →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
