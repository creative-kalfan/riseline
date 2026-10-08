"use client";

import { useState, useEffect } from "react";
import { Check, AlertTriangle, Download, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-tooltip";
import type { ResumeVersion } from "@/types/version";

type FinalReviewProps = {
  version: ResumeVersion;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onReanalyze: () => void;
  isExporting?: boolean;
  isReanalyzing?: boolean;
};

export function FinalReview({
  version,
  onExportPdf,
  onExportDocx,
  onReanalyze,
  isExporting,
  isReanalyzing,
}: FinalReviewProps) {
  const { toast } = useToast();
  const [checks, setChecks] = useState({
    contact: false,
    education: false,
    skills: false,
    experience: false,
    projects: false,
    atsDone: false,
    noPending: true,
  });

  useEffect(() => {
    const content = version.content || {};
    const profile = (content as { profile?: Record<string, unknown> }).profile || {};
    const personal = (profile as { personal?: Record<string, unknown> }).personal || {};
    const education = (profile as { education?: unknown[] }).education || [];
    const skills = (profile as { skills?: Record<string, unknown> }).skills || {};
    const experience = (profile as { experience?: unknown[] }).experience || [];
    const projects = (profile as { projects?: unknown[] }).projects || [];
    setChecks({
      contact: !!(
        (personal as Record<string, unknown>).fullName ||
        (personal as Record<string, unknown>).email ||
        (personal as Record<string, unknown>).phone
      ),
      education: Array.isArray(education) && education.length > 0,
      skills: !!(skills.technical && skills.tools),
      experience: Array.isArray(experience) && experience.length > 0,
      projects: Array.isArray(projects) && projects.length > 0,
      atsDone: !!version.last_ats_score,
      noPending: true,
    });
  }, [version]);

  const warnings: string[] = [];
  if (!checks.atsDone) warnings.push("ATS analysis not completed");
  if (version.last_analyzed_at && version.updated_at > version.last_analyzed_at) {
    warnings.push("Resume changed since last ATS analysis");
  }

  const allPassed = Object.values(checks).every(Boolean);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Final Resume Check</h3>
        <div className="grid grid-cols-2 gap-3">
          <CheckItem label="Contact information" done={checks.contact} />
          <CheckItem label="Education" done={checks.education} />
          <CheckItem label="Skills" done={checks.skills} />
          <CheckItem label="Experience" done={checks.experience} />
          <CheckItem label="Projects" done={checks.projects} />
          <CheckItem label="ATS analysis completed" done={checks.atsDone} />
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-amber-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Warnings
          </h4>
          {warnings.map((w) => (
            <p key={w} className="text-sm text-amber-600 bg-amber-500/10 rounded-md p-2">
              {w}
            </p>
          ))}
          <Button variant="outline" size="sm" onClick={onReanalyze} disabled={isReanalyzing}>
            {isReanalyzing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Re-analyze
              </>
            )}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={onExportPdf} disabled={isExporting} className="flex-1">
          <FileText className="h-4 w-4 mr-2" /> Export PDF
        </Button>
        <Button onClick={onExportDocx} disabled={isExporting} variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" /> Export DOCX
        </Button>
      </div>

      {!allPassed && (
        <p className="text-xs text-muted-foreground">
          You can still export, but some items may need attention.
        </p>
      )}
    </div>
  );
}

function CheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border p-2 text-sm ${done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 bg-muted/20"}`}
    >
      {done ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
      )}
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
