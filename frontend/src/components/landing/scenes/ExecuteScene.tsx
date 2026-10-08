import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export function ExecuteScene() {
  const steps = [
    { num: "01", name: "Deconstruct", desc: "Weighted JD criteria" },
    { num: "02", name: "Diagnose", desc: "Evidence & gap map" },
    { num: "03", name: "Optimize", desc: "Truth-preserving bullet" },
    { num: "04", name: "Discover", desc: "Ranked opportunities" },
    { num: "05", name: "Apply", desc: "Proven submissions" },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center px-4 sm:px-8 max-w-4xl mx-auto text-center py-4">
      {/* Category Eyebrow */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#1A1916] text-[#315CFF] border border-[#302E29] mb-3 sm:mb-4">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Career Intelligence</span>
      </div>

      {/* Primary Headline */}
      <h2 className="text-2xl sm:text-4xl lg:text-5xl font-semibold text-[#F3F0E8] tracking-tight leading-[1.12]">
        Stop sending resumes into the void.
        <br />
        <span className="text-[#315CFF]">Start applying with proof.</span>
      </h2>

      <p className="text-xs sm:text-sm lg:text-base text-[#A8A49A] max-w-xl mx-auto mt-3 sm:mt-4 leading-relaxed">
        CareerOS transforms application guesswork into a verifiable, evidence-backed strategy.
        Target roles where your experience genuinely shines.
      </p>

      {/* 5-Step Narrative Sequence */}
      <div className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 my-4 sm:my-6">
        {steps.map((s) => (
          <div
            key={s.num}
            className="p-2.5 sm:p-3 rounded-lg bg-[#1A1916] border border-[#302E29] flex flex-col items-center justify-center text-center shadow-xs"
          >
            <span className="text-[10px] font-mono font-medium text-[#315CFF]">{s.num}</span>
            <div className="text-[11px] sm:text-xs font-semibold text-[#F3F0E8] mt-0.5">
              {s.name}
            </div>
            <span className="text-[9px] sm:text-[10px] text-[#A8A49A] mt-0.5">{s.desc}</span>
          </div>
        ))}
      </div>

      {/* Call to Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <Link
          to="/signup"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#315CFF] px-7 py-3 text-sm font-medium text-[#F3F0E8] hover:bg-[#274BDB] transition shadow-md shadow-[#315CFF]/20"
        >
          <span>Analyze My Resume Free</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <Link
          to="/login"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#302E29] bg-[#1A1916] px-5 py-3 text-sm font-medium text-[#A8A49A] hover:text-[#F3F0E8] hover:border-[#A8A49A]/30 transition"
        >
          Sign In
        </Link>
      </div>

      {/* Trust Footnote */}
      <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-[#A8A49A] border-t border-[#302E29] pt-3 sm:pt-4 w-full max-w-xl">
        <span className="flex items-center gap-1.5 text-[#45A875]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Zero Experience Fabrication
        </span>
        <span className="text-[#302E29]">|</span>
        <span>Deterministic Matching</span>
        <span className="text-[#302E29]">|</span>
        <span>© {new Date().getFullYear()} CareerOS</span>
      </div>
    </div>
  );
}
