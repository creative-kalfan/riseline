import React, { useState, useEffect } from "react";
import { Wand2, ShieldCheck, RotateCcw } from "lucide-react";

export function RefactorScene() {
  const [isOptimized, setIsOptimized] = useState(true);
  const [score, setScore] = useState(62);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOptimized) {
      // Animate score climb to 94
      let current = 62;
      const step = () => {
        if (current < 94) {
          current += 2;
          setScore(current);
          timer = setTimeout(step, 25);
        } else {
          setScore(94);
        }
      };
      step();
    } else {
      setScore(62);
    }
    return () => clearTimeout(timer);
  }, [isOptimized]);

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-2 sm:py-4">
      {/* Header */}
      <div className="text-center max-w-2xl mb-2.5 sm:mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#1A1916] text-[#45A875] border border-[#302E29] mb-2">
          <Wand2 className="w-3.5 h-3.5" />
          <span>Targeted Optimization</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#F3F0E8] tracking-tight">
          Sharpen what you did. Never invent what you didn't.
        </h2>
        <p className="text-xs sm:text-sm text-[#A8A49A] mt-1 leading-relaxed">
          CareerOS generates role-specific derived versions from your master profile — restructuring
          verified proof without fabricating experience.
        </p>
      </div>

      {/* Main Studio Viewport */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch max-w-4xl">
        {/* Left Side: Resume Document Preview Card */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-xl bg-[#1A1916] border border-[#302E29] p-3.5 sm:p-4.5 shadow-sm">
          <div>
            {/* Document Header */}
            <div className="flex items-center justify-between border-b border-[#302E29] pb-2.5 mb-3">
              <div>
                <div className="text-xs font-semibold text-[#F3F0E8] tracking-wide">
                  Target Derived Resume
                </div>
                <div className="text-[10px] text-[#A8A49A]">
                  Derived for: Staff Platform Engineer
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#45A875]/15 border border-[#45A875]/30 text-[#45A875] text-[10px] font-medium">
                Truth-Preserving
              </span>
            </div>

            {/* Document Body Lines */}
            <div className="space-y-2.5">
              <div className="text-[10px] font-medium text-[#A8A49A] uppercase tracking-wider">
                Experience — Senior Software Engineer
              </div>

              {/* Bullet Item 1 (Interactive transformation) */}
              <div
                className={`p-2.5 sm:p-3 rounded-lg border text-xs leading-relaxed transition-all duration-300 ${
                  isOptimized
                    ? "bg-[#11110F] border-[#45A875]/50 text-[#F3F0E8]"
                    : "bg-[#11110F]/70 border-[#302E29]/60 text-[#A8A49A]"
                }`}
              >
                {isOptimized ? (
                  <span>
                    <strong className="text-white">
                      Architected asynchronous ingestion services
                    </strong>{" "}
                    using <span className="text-[#315CFF] font-medium">Python & Redis workers</span>
                    , cutting p95 query latency by{" "}
                    <span className="text-[#45A875] font-semibold">42%</span> across high-volume
                    traffic.
                  </span>
                ) : (
                  <span>
                    Built backend APIs with Python and managed database queries for user requests.
                  </span>
                )}
              </div>

              {/* Bullet Item 2 */}
              <div className="p-2.5 sm:p-3 rounded-lg bg-[#11110F]/60 border border-[#302E29]/50 text-xs text-[#A8A49A] leading-relaxed">
                Tuned PostgreSQL indexing strategies and established automated CI suites with
                comprehensive Pytest coverage.
              </div>
            </div>
          </div>

          {/* Bottom Alignment Meter */}
          <div className="mt-3 pt-2.5 border-t border-[#302E29] flex items-center justify-between">
            <div>
              <div className="text-[10px] text-[#A8A49A]">Optimized Match Score</div>
              <div className="text-base sm:text-lg font-mono font-bold text-[#45A875]">
                {score}%
              </div>
            </div>
            <div className="w-28 sm:w-36 h-1.5 rounded-full bg-[#11110F] overflow-hidden">
              <div
                className="h-full bg-[#45A875] transition-all duration-500 rounded-full"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Diff Controls & Integrity Guarantee */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-3">
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#1A1916] border border-[#302E29] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[#A8A49A] uppercase tracking-wider">
                Live Bullet Comparison
              </span>
              <button
                onClick={() => setIsOptimized(!isOptimized)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#11110F] hover:bg-[#1A1916] text-[11px] font-medium text-[#F3F0E8] border border-[#302E29] transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-[#315CFF]" />
                {isOptimized ? "Show Generic Original" : "Show Optimized Bullet"}
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-[#A8A49A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E4573D] shrink-0" />
                <span className="font-medium text-[11px]">Original:</span>
                <span className="line-through opacity-70 truncate">
                  Unquantified description, buried criteria
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#45A875]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#45A875] shrink-0" />
                <span className="font-medium text-[11px]">Optimized:</span>
                <span className="truncate">Highlights verified asynchronous & database impact</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-[#11110F] border border-[#302E29] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#45A875] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-[#F3F0E8]">
                Strict Truth-Preserving Guarantee
              </div>
              <p className="text-[11px] text-[#A8A49A] mt-0.5 leading-relaxed">
                CareerOS never hallucinates employers, fake degrees, or unearned credentials. Every
                bullet is strictly grounded in candidate facts.
              </p>
            </div>
          </div>

          <div className="p-2 text-[11px] text-[#A8A49A] flex items-center justify-between">
            <span>Profile ready for job matching</span>
            <span className="text-[#315CFF] font-medium">Discovery Feed →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
