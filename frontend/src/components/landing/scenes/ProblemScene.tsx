import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function ProblemScene() {
  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center px-4 sm:px-8 text-center max-w-4xl mx-auto py-4">
      {/* Category Eyebrow */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#1A1916] border border-[#302E29] text-[#A8A49A] mb-5 sm:mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E4573D]" />
        <span>The Core Problem</span>
      </div>

      {/* Main Punchy Copy */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#F3F0E8] leading-[1.12] max-w-3xl">
        You're not bad at your job.
        <br />
        <span className="text-[#E4573D]">
          You're just sending the same answer to 47 different questions.
        </span>
      </h1>

      <p className="text-sm sm:text-base lg:text-lg text-[#A8A49A] leading-relaxed max-w-xl mt-5 sm:mt-6">
        Every posting has distinct technical weights and evaluation priorities. Applying with one
        generic resume leaves your strongest relevant proof buried.
      </p>

      {/* Subtle secondary anchor */}
      <div className="mt-8 flex items-center justify-center">
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#A8A49A] hover:text-[#F3F0E8] transition group py-1.5 px-3 rounded-lg border border-transparent hover:border-[#302E29] hover:bg-[#1A1916]"
        >
          <span>Start optimizing with proof</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#315CFF] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
