"use client";

import { useRef } from "react";
import { FileText, PenLine, Upload, LayoutTemplate, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerItem } from "@/lib/motion";

function SetupChoiceCard({
  pathCode,
  title,
  description,
  icon: Icon,
  ctaText,
  ctaIcon: CtaIcon,
  primary = false,
  onClick,
}: {
  pathCode: string;
  title: string;
  description: string;
  icon: React.ElementType;
  ctaText: string;
  ctaIcon: React.ElementType;
  primary?: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 300, damping: 25 });
  const springY = useSpring(rotateY, { stiffness: 300, damping: 25 });
  const reducedMotion = useReducedMotion();

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rotateY.set(((e.clientX - cx) / (rect.width / 2)) * 3.5);
    rotateX.set(-((e.clientY - cy) / (rect.height / 2)) * 3.5);
  }

  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      variants={staggerItem}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ perspective: "1000px", rotateX: springX, rotateY: springY }}
      className="h-full"
    >
      <Card
        onClick={onClick}
        className={`workstation-panel workstation-panel-hover group relative flex flex-col h-full overflow-hidden rounded-xl border p-6 shadow-elevation-1 cursor-pointer select-none transition-colors ${
          primary
            ? "border-primary/40 bg-surface-elevated/80 hover:border-primary/70"
            : "border-border/80 bg-surface/80 hover:border-primary/40"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/80">
            {pathCode}
          </span>
          {primary && (
            <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              Recommended
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center gap-3.5">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border transition-transform group-hover:scale-105 ${
              primary
                ? "border-primary/40 bg-primary/15 text-primary shadow-xs"
                : "border-border/80 bg-surface-instrument text-muted-foreground group-hover:text-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          </div>
        </div>

        <p className="mt-3.5 text-xs text-muted-foreground leading-relaxed flex-1">{description}</p>

        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
            <CtaIcon className="h-3.5 w-3.5" />
            {ctaText}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </Card>
    </motion.div>
  );
}

export function ResumeSetupChoices() {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14"
    >
      <motion.div variants={staggerItem} className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface-instrument px-3 py-1 text-xs text-muted-foreground font-mono mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span>ONBOARDING WORKSTATION // RESUME INGESTION</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
          Create Your <span className="text-gradient">Resume Document</span>
        </h1>
        <p className="mt-2.5 text-xs text-muted-foreground sm:text-sm max-w-xl mx-auto leading-relaxed">
          Select an ingestion method to initialize your master document in Resume Studio.
        </p>
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-3">
        <SetupChoiceCard
          pathCode="[PATH // 01]"
          title="Upload Existing Resume"
          description="Import your PDF or DOCX resume. CareerOS parses your structure, extract skills, and prepares ATS alignment."
          icon={FileText}
          ctaText="Upload PDF / DOCX"
          ctaIcon={Upload}
          primary={true}
          onClick={() => navigate({ to: "/resumes/setup", search: { mode: "upload" } })}
        />

        <SetupChoiceCard
          pathCode="[PATH // 02]"
          title="Build from Scratch"
          description="Step-by-step guided questionnaire for new graduates, career changers, or building a clean master profile."
          icon={PenLine}
          ctaText="Guided Builder"
          ctaIcon={PenLine}
          onClick={() => navigate({ to: "/resumes/setup", search: { mode: "build" } })}
        />

        <SetupChoiceCard
          pathCode="[PATH // 03]"
          title="Start from Template"
          description="Select from verified ATS-ready, recruiter-tested layouts with typography and layout presets."
          icon={LayoutTemplate}
          ctaText="Template Gallery"
          ctaIcon={LayoutTemplate}
          onClick={() => navigate({ to: "/resumes/templates" })}
        />
      </div>
    </motion.div>
  );
}
