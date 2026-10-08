import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Sparkles,
  Target,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
  ListChecks,
  Gauge,
  Loader2,
  Plus,
  RefreshCw,
  Wand2,
  TrendingUp,
  ArrowRight,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-tooltip";
import { useVersions } from "@/hooks/api/useVersions";
import { getErrorMessage } from "@/utils/api-error";
import { formatDateTime } from "@/utils/date";
import { optimizationApi } from "@/api/optimization";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  OptimizationSuggestion,
  TailoringPlanItem,
  TailorResumeResponse,
} from "@/types/optimization";
import type { AtsAnalysisResult } from "@/api/ats";
import { buildAtsRequirementViews, atsRequirementDomId } from "@/lib/ats-evidence-view";
import { interpretAtsScore, summarizeRequirementCoverage } from "@/lib/ats-evidence-view";
import { partitionRecommendations } from "@/lib/ats-evidence-view";
import type { EvidenceLocationMap } from "@/lib/evidence-location";
import { AtsEvidenceList } from "@/components/resume/ats-evidence-list";
import { TailoringEvidencePanel } from "@/components/resume/tailoring-evidence-panel";

function TailoringPlanCard({ planItem }: { planItem: TailoringPlanItem }) {
  const actionColor =
    planItem.action === "REWRITE"
      ? "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10"
      : planItem.action === "EMPHASIZE"
        ? "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
        : planItem.action === "ALIGN"
          ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
          : "text-muted-foreground border-border/50 bg-muted/10";

  return (
    <div className="space-y-2 p-3 text-left rounded-lg border border-border/50 bg-surface/40 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="rounded-md border-border/60 bg-background/60 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider text-primary"
          >
            {planItem.section}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-md border-border/50 bg-muted/20 px-1.5 py-0 text-[9px] font-medium text-muted-foreground"
          >
            ATS Clean Layout
          </Badge>
        </div>
        <Badge
          variant="outline"
          className={`rounded text-[9.5px] font-semibold uppercase ${actionColor}`}
        >
          {planItem.action}
        </Badge>
      </div>

      {planItem.reasoning && (
        <p className="whitespace-normal break-words leading-relaxed text-[11px] text-muted-foreground [overflow-wrap:anywhere]">
          {planItem.reasoning}
        </p>
      )}

      {planItem.currentText && (
        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Current
          </span>
          <div className="whitespace-normal break-words text-xs text-muted-foreground/85 line-through decoration-destructive/60 rounded bg-destructive/5 border border-destructive/15 p-2 leading-relaxed [overflow-wrap:anywhere]">
            {planItem.currentText}
          </div>
        </div>
      )}

      {planItem.suggestedText && (
        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Tailored Text
          </span>
          <div className="whitespace-normal break-words text-xs font-medium text-foreground rounded bg-emerald-500/10 border border-emerald-500/20 p-2 leading-relaxed [overflow-wrap:anywhere]">
            {planItem.suggestedText}
          </div>
        </div>
      )}

      {planItem.keywordsAddressed && planItem.keywordsAddressed.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Keywords Addressed
          </span>
          <div className="flex flex-wrap gap-1">
            {planItem.keywordsAddressed.map((kw) => (
              <Badge
                key={kw}
                variant="secondary"
                className="rounded text-[9.5px] font-normal px-1.5 py-0 border border-border/60"
              >
                {kw}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaneSection({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 w-full">
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
        <h3 className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h3>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="min-w-0 w-full">{children}</div>
    </section>
  );
}

function ScoreCell({ label, score }: { label: string; score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score ?? 0)));
  return (
    <div className="min-w-0 space-y-1.5 rounded-lg workstation-instrument p-2 border border-border/60">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-medium">{label}</span>
        <span className="font-mono font-semibold text-foreground">{clamped}%</span>
      </div>
      <Progress value={clamped} className="h-1.5 bg-muted/60" />
    </div>
  );
}

function ChipList({
  items,
  tone,
  empty,
  onAddSkill,
}: {
  items: string[] | undefined;
  tone: "positive" | "negative" | "neutral";
  empty: string;
  onAddSkill?: (skill: string) => void;
}) {
  const list = items ?? [];
  if (list.length === 0) {
    return <div className="text-[11px] text-muted-foreground">{empty}</div>;
  }
  const toneClass =
    tone === "positive"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : tone === "negative"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
        : "border-border/60 bg-surface-elevated/40 text-foreground/80";
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((item) => (
        <Badge
          key={item}
          variant="outline"
          className={`rounded-md border px-2 py-0.5 text-[10px] font-medium flex items-center gap-1 ${toneClass}`}
        >
          <span>{item}</span>
          {onAddSkill && tone === "negative" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddSkill(item);
              }}
              title={`Add "${item}" to resume skills`}
              aria-label={`Add "${item}" to resume skills`}
              className="ml-0.5 rounded-full hover:bg-rose-500/20 p-0.5 text-rose-700 dark:text-rose-300 transition-colors shrink-0"
            >
              <Plus className="h-2.5 w-2.5 shrink-0" />
            </button>
          )}
        </Badge>
      ))}
    </div>
  );
}

function AtsAnalysisSummary({
  analysis,
  selectedAtsIssue,
  onSelectIssue,
  evidenceLocations,
  resumeId,
  reportId,
  onAddSkill,
}: {
  analysis: AtsAnalysisResult;
  selectedAtsIssue?: string | null;
  onSelectIssue?: (id: string | null) => void;
  evidenceLocations?: EvidenceLocationMap | null;
  resumeId?: string;
  reportId?: string | null;
  onAddSkill?: (skill: string) => void;
}) {
  const views = useMemo(() => buildAtsRequirementViews(analysis), [analysis]);
  const overall = Math.round(analysis.overall_score ?? 0);
  const scoreBand = interpretAtsScore(overall);
  const coverage = useMemo(() => summarizeRequirementCoverage(views), [views]);
  const matchedKw = analysis.matched_keywords ?? [];
  const missingKw = analysis.missing_keywords ?? [];
  const partialKw = analysis.partial_keywords ?? [];
  const matchedSkills = analysis.matched_skills ?? [];
  const missingSkills = analysis.missing_skills ?? [];
  const partialSkills = analysis.partial_skills ?? [];

  const { general: generalRecs } = useMemo(
    () => partitionRecommendations(analysis, views),
    [analysis, views],
  );
  const high = generalRecs.filter((r) => r.priority === "high").map((r) => r.text);
  const medium = generalRecs.filter((r) => r.priority === "medium").map((r) => r.text);
  const low = generalRecs.filter((r) => r.priority === "low").map((r) => r.text);
  const flat = generalRecs.filter((r) => r.priority === "general").map((r) => r.text);

  const explanation = analysis.analysis_explanation;
  const templateRating = analysis.template_analysis?.compatibility_rating;

  return (
    <div className="space-y-3">
      <Card className="workstation-panel rounded-xl border border-border/80 p-3.5 shadow-xs">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Gauge className="h-4 w-4 shrink-0 text-primary" />
            <span className="whitespace-normal break-words text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
              ATS Match Score
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap font-mono text-xl font-bold text-foreground drop-shadow-[0_0_8px_var(--color-primary)]">
            {overall}%
          </span>
        </div>
        <p className="mb-2 whitespace-normal break-words text-[11px] font-semibold text-foreground/90">
          {scoreBand.label}
        </p>
        <Progress value={overall} className="h-2 bg-muted/80" />
        {coverage.importantTotal > 0 && (
          <p className="mt-2 whitespace-normal break-words text-[11px] text-muted-foreground font-medium">
            {coverage.importantAddressed} of {coverage.importantTotal} key requirements addressed
          </p>
        )}
        {explanation?.overall && (
          <p className="mt-2 whitespace-normal break-words text-[11px] text-muted-foreground leading-relaxed">
            {explanation.overall}
          </p>
        )}
        {templateRating && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ListChecks className="h-3 w-3 text-primary" />
            <span>{templateRating}</span>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ScoreCell label="Keywords" score={analysis.keyword_match_score} />
        <ScoreCell label="Skills" score={analysis.skills_match_score} />
        <ScoreCell label="Experience" score={analysis.experience_relevance_score} />
        <ScoreCell label="Qualifications" score={analysis.qualification_match_score} />
        <ScoreCell label="Structure" score={analysis.structure_format_score} />
      </div>

      {views.length > 0 ? (
        <AtsEvidenceList
          key={views.map((v) => v.id).join("|")}
          views={views}
          selectedRequirementId={selectedAtsIssue}
          onSelectRequirement={onSelectIssue}
          evidenceLocations={evidenceLocations}
          resumeId={resumeId}
          reportId={reportId}
        />
      ) : (
        <>
          <p className="rounded-xl border border-border/40 p-2.5 text-[11px] text-muted-foreground">
            Not enough structured requirements were detected.
          </p>
          {(matchedKw.length > 0 || missingKw.length > 0 || partialKw.length > 0) && (
            <div className="space-y-2 rounded-xl border border-border/40 p-2.5">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span>Matched Keywords ({matchedKw.length})</span>
                </div>
                <ChipList items={matchedKw} tone="positive" empty="No matched keywords yet." />
              </div>
              {partialKw.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <ListChecks className="h-3 w-3" />
                    <span>Partial Keywords ({partialKw.length})</span>
                  </div>
                  <ChipList items={partialKw} tone="neutral" empty="No partial matches." />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <XCircle className="h-3 w-3 text-rose-500" />
                  <span>Missing Keywords ({missingKw.length})</span>
                </div>
                <ChipList
                  items={missingKw}
                  tone="negative"
                  empty="No missing keywords — great match."
                  onAddSkill={onAddSkill}
                />
              </div>
            </div>
          )}

          {(matchedSkills.length > 0 || missingSkills.length > 0 || partialSkills.length > 0) && (
            <div className="space-y-2 rounded-xl border border-border/40 p-2.5">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span>Matched Skills ({matchedSkills.length})</span>
                </div>
                <ChipList items={matchedSkills} tone="positive" empty="No matched skills yet." />
              </div>
              {partialSkills.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <ListChecks className="h-3 w-3" />
                    <span>Partial Skills ({partialSkills.length})</span>
                  </div>
                  <ChipList
                    items={partialSkills}
                    tone="neutral"
                    empty="No partial skill matches."
                  />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <XCircle className="h-3 w-3 text-rose-500" />
                  <span>Missing Skills ({missingSkills.length})</span>
                </div>
                <ChipList
                  items={missingSkills}
                  tone="negative"
                  empty="No missing skills."
                  onAddSkill={onAddSkill}
                />
              </div>
            </div>
          )}
        </>
      )}

      {(high.length > 0 || medium.length > 0 || low.length > 0 || flat.length > 0) && (
        <div className="space-y-2 rounded-xl border border-border/40 p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>ATS Recommendations</span>
          </div>
          {high.length > 0 && (
            <ul className="space-y-1 text-xs">
              {high.map((r) => (
                <li key={`h-${r}`} className="flex min-w-0 items-start gap-1.5">
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-full border-rose-500/40 bg-rose-500/10 px-1.5 py-0 text-[9px] text-rose-700 dark:text-rose-300"
                  >
                    High
                  </Badge>
                  <span className="min-w-0 flex-1 break-words text-foreground/90">{r}</span>
                </li>
              ))}
            </ul>
          )}
          {medium.length > 0 && (
            <ul className="space-y-1 text-xs">
              {medium.map((r) => (
                <li key={`m-${r}`} className="flex min-w-0 items-start gap-1.5">
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-full border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[9px] text-amber-700 dark:text-amber-300"
                  >
                    Med
                  </Badge>
                  <span className="min-w-0 flex-1 break-words text-foreground/90">{r}</span>
                </li>
              ))}
            </ul>
          )}
          {low.length > 0 && (
            <ul className="space-y-1 text-xs">
              {low.map((r) => (
                <li key={`l-${r}`} className="flex min-w-0 items-start gap-1.5">
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-full border-sky-500/40 bg-sky-500/10 px-1.5 py-0 text-[9px] text-sky-700 dark:text-sky-300"
                  >
                    Low
                  </Badge>
                  <span className="min-w-0 flex-1 break-words text-foreground/90">{r}</span>
                </li>
              ))}
            </ul>
          )}
          {high.length === 0 && medium.length === 0 && low.length === 0 && flat.length > 0 && (
            <ul className="list-disc space-y-1 pl-4 text-xs text-foreground/90">
              {flat.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function LeftPane({
  currentId,
  currentVersionId,
  targetJobTitle,
  targetCompany,
  targetJobDescription,
  hasAnalysis,
  onApplySuggestion,
  onRunOptimization,
  onOpenATSDialog,
  atsAnalysis,
  isAnalyzing,
  analyzeError,
  selectedAtsIssue,
  onSelectIssue,
  evidenceLocations,
  reportId,
  isGeneratingOptimization,
  generateOptimizationError,
  onSelectVersion,
  activeSuggestions,
  activeSessionId,
  onAddSkill,
  onApplyTailoring,
  isApplyingTailoring,
  applyTailoringError,
  onRetryApplyTailoring,
}: {
  currentId: string;
  currentVersionId: string | null;
  targetJobTitle?: string | null;
  targetCompany?: string | null;
  targetJobDescription?: string | null;
  hasAnalysis: boolean;
  onApplySuggestion?: (suggestion: OptimizationSuggestion, sessionId?: string) => void;
  onRunOptimization?: () => void;
  onOpenATSDialog?: () => void;
  atsAnalysis?: AtsAnalysisResult | null;
  isAnalyzing?: boolean;
  analyzeError?: string | null;
  selectedAtsIssue?: string | null;
  onSelectIssue?: (id: string | null) => void;
  evidenceLocations?: EvidenceLocationMap | null;
  reportId?: string | null;
  isGeneratingOptimization?: boolean;
  generateOptimizationError?: string | null;
  onSelectVersion?: (versionId: string) => void;
  activeSuggestions?: OptimizationSuggestion[] | null;
  activeSessionId?: string | null;
  onAddSkill?: (skill: string) => void;
  onApplyTailoring?: (
    tailoredProfile: Record<string, unknown>,
    plan: TailoringPlanItem[],
    jobTitle?: string,
    company?: string,
    jobDescription?: string,
  ) => Promise<void>;
  isApplyingTailoring?: boolean;
  // Error from the last apply-tailoring attempt (owned by the Studio page,
  // which performs the apply). Rendered inline with a manual Retry — a failed
  // auto-apply must never look like a finished +0% "no improvement" result.
  applyTailoringError?: string | null;
  onRetryApplyTailoring?: () => void;
}) {
  const {
    data: versionsData,
    isLoading: versionsLoading,
    isError: versionsIsError,
    error: versionsError,
    refetch: refetchVersions,
  } = useVersions(currentId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tailorResult, setTailorResult] = useState<TailorResumeResponse | null>(null);
  const [tailoringStep, setTailoringStep] = useState<
    "idle" | "analyzing" | "synthesizing" | "compiling"
  >("idle");
  const tailoredContextsRef = useRef(new Set<string>());
  const appliedContextsRef = useRef(new Set<string>());

  const tailorMutation = useMutation({
    mutationFn: (data: {
      resumeId: string;
      versionId?: string;
      jobDescription: string;
      jobTitle?: string;
      company?: string;
    }) => optimizationApi.tailor(data),
    onSuccess: (res) => {
      if (res.success) {
        setTailorResult(res);
        toast.success(res.message || "Whole resume tailored successfully!");
      }
    },
    onError: (err: any) => {
      toast.error(err instanceof Error ? err.message : "Whole resume tailoring failed");
    },
  });

  useEffect(() => {
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;
    if (tailorMutation.isPending) {
      setTailoringStep("analyzing");
      t1 = setTimeout(() => {
        setTailoringStep("synthesizing");
      }, 3000);
      t2 = setTimeout(() => {
        setTailoringStep("compiling");
      }, 8000);
    } else {
      setTailoringStep("idle");
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [tailorMutation.isPending]);

  const versions = versionsData?.versions ?? [];

  const hasJobContext = Boolean(targetJobTitle?.trim() || targetJobDescription?.trim());
  const tailoringContextKey = `${currentId}|${targetJobTitle?.trim() || ""}|${targetCompany?.trim() || ""}|${targetJobDescription?.trim() || ""}`;
  const isTailoring = tailorMutation.isPending || Boolean(isApplyingTailoring);

  const currentVersion = useMemo(() => {
    return versions.find((v) => v.id === currentVersionId);
  }, [versions, currentVersionId]);

  // Guard on versionsLoading: while versions are in-flight isCurrentVersionTailored
  // must stay false so State 3 (tailor button) remains stable and does not
  // disappear the moment the loaded data resolves the tailored version — the
  // documented P0 two-state swap.
  const isCurrentVersionTailored = Boolean(
    !versionsLoading &&
    currentVersion &&
    !currentVersion.is_master &&
    currentVersion.job_description &&
    currentVersion.job_description.trim() === targetJobDescription?.trim(),
  );

  const handleStartTailoring = useCallback(() => {
    if (!targetJobDescription?.trim()) {
      toast.error("Job description is required for tailoring");
      return;
    }
    tailorMutation.reset();
    tailorMutation.mutate({
      resumeId: currentId,
      versionId: currentVersionId || undefined,
      jobDescription: targetJobDescription,
      jobTitle: targetJobTitle || undefined,
      company: targetCompany || undefined,
    });
  }, [
    currentId,
    currentVersionId,
    targetJobDescription,
    targetJobTitle,
    targetCompany,
    tailorMutation,
    toast,
  ]);

  const handleApplyProposal = useCallback(async () => {
    if (!tailorResult || !onApplyTailoring) return;
    try {
      await onApplyTailoring(
        tailorResult.tailoredProfile,
        tailorResult.plan,
        targetJobTitle || undefined,
        targetCompany || undefined,
        targetJobDescription || undefined,
      );
      setTailorResult(null);
    } catch {
      // applyTailoringError is tracked by parent
    }
  }, [tailorResult, onApplyTailoring, targetJobTitle, targetCompany, targetJobDescription]);

  const handleDiscardProposal = useCallback(() => {
    setTailorResult(null);
    tailorMutation.reset();
  }, [tailorMutation]);

  // If opening Studio with target JD and an existing tailored version already exists,
  // select it so the user directly sees the derived artifact.
  useEffect(() => {
    if (!hasJobContext || isApplyingTailoring || versionsLoading || versionsIsError) return;
    const existing = versions.find(
      (version) =>
        !version.is_master &&
        version.target_job_title === targetJobTitle &&
        version.target_company === targetCompany &&
        version.job_description === targetJobDescription,
    );
    if (existing && existing.id !== currentVersionId) {
      onSelectVersion?.(existing.id);
      tailoredContextsRef.current.add(tailoringContextKey);
    }
  }, [
    hasJobContext,
    isApplyingTailoring,
    versions,
    versionsLoading,
    versionsIsError,
    currentVersionId,
    targetJobTitle,
    targetCompany,
    targetJobDescription,
    tailoringContextKey,
    onSelectVersion,
  ]);

  useEffect(() => {
    if (!selectedAtsIssue) return;
    const frame = requestAnimationFrame(() => {
      document
        .getElementById(atsRequirementDomId(selectedAtsIssue))
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedAtsIssue]);

  return (
    <ScrollArea className="h-full w-full min-w-0 scroll-area-constrained">
      <div className="min-w-0 w-full min-h-full p-4 space-y-6 [overflow-wrap:anywhere]">
        {hasJobContext ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] p-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Target className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-foreground/90">
                  {targetJobTitle}
                </div>
                {targetCompany && (
                  <div className="truncate text-[10px] text-muted-foreground">{targetCompany}</div>
                )}
              </div>
            </div>
            {/* Job header: Change stays mounted in every state so the user can
                always switch jobs (no-op when no dialog handler is wired). */}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px] font-medium text-primary hover:text-primary hover:bg-primary/10 shrink-0"
              onClick={onOpenATSDialog}
            >
              <span className="text-[11px] font-medium">Change</span>
            </Button>
          </div>
        ) : (
          <Card className="glass rounded-2xl border-border/60 p-4 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary mb-3">
              <Target className="h-5 w-5" />
            </div>
            <div className="text-xs font-semibold mb-1">No job target set</div>
            <div className="whitespace-normal break-words text-[11px] text-muted-foreground leading-relaxed">
              Compare your resume with a job to unlock ATS analysis and AI suggestions.
            </div>
            {onOpenATSDialog && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-8 w-full rounded-lg text-xs font-medium"
                onClick={onOpenATSDialog}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs font-medium">Add job description</span>
              </Button>
            )}
          </Card>
        )}

        {hasJobContext && (
          <div className="w-full min-w-0 space-y-3">
            {/* Whole Resume Tailoring Section */}
            <div className="w-full min-w-0 space-y-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Wand2 className="h-4 w-4 shrink-0 text-primary" />
                  <span className="whitespace-normal break-words text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                    Intelligent Whole-Resume Tailoring
                  </span>
                </div>
                {tailorResult ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-500/30 bg-emerald-500/10 text-[9px] font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    +{Math.round(tailorResult.scoreComparison.delta)}% ATS Projected
                  </Badge>
                ) : isCurrentVersionTailored ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-primary/30 bg-primary/10 text-[9px] font-semibold text-primary"
                  >
                    Tailored Active
                  </Badge>
                ) : null}
              </div>

              {/* Progress State while Tailoring */}
              {(tailorMutation.isPending || isApplyingTailoring) && (
                <div className="space-y-2 rounded-lg border border-primary/20 bg-background/80 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    <span>
                      {isApplyingTailoring
                        ? "Compiling derived PDF artifact & creating version…"
                        : tailoringStep === "analyzing"
                          ? "Analyzing job description requirements…"
                          : tailoringStep === "synthesizing"
                            ? "Aligning candidate evidence across whole resume…"
                            : "Synthesizing unified tailored proposal…"}
                    </span>
                  </div>
                  <Progress
                    value={
                      isApplyingTailoring
                        ? 85
                        : tailoringStep === "analyzing"
                          ? 30
                          : tailoringStep === "synthesizing"
                            ? 65
                            : 90
                    }
                    className="h-1.5 bg-primary/10"
                  />
                </div>
              )}

              {/* Tailor Mutation Failure */}
              {tailorMutation.isError && !tailorMutation.isPending && (
                <Card className="glass rounded-xl border-rose-500/30 bg-rose-500/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    <div className="space-y-1 text-left">
                      <div className="text-xs font-medium text-rose-700 dark:text-rose-300">
                        Tailoring failed
                      </div>
                      <div className="text-[11px] leading-relaxed text-muted-foreground">
                        {getErrorMessage(tailorMutation.error)}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1.5 h-7 rounded-md text-[11px]"
                        onClick={handleStartTailoring}
                        disabled={tailorMutation.isPending}
                      >
                        <RefreshCw className="h-3 w-3 shrink-0" />
                        <span className="text-[11px] font-medium">Retry tailoring</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Apply Tailoring Failure */}
              {applyTailoringError && !isApplyingTailoring && (
                <Card className="glass rounded-xl border-rose-500/30 bg-rose-500/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    <div className="space-y-1 text-left">
                      <div className="text-xs font-medium text-rose-700 dark:text-rose-300">
                        Couldn’t compile the tailored version
                      </div>
                      <div className="text-[11px] leading-relaxed text-muted-foreground">
                        {applyTailoringError} Your original resume was not changed.
                      </div>
                      {onRetryApplyTailoring && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1.5 h-7 rounded-md text-[11px]"
                          onClick={onRetryApplyTailoring}
                          disabled={isApplyingTailoring}
                        >
                          <RefreshCw className="h-3 w-3 shrink-0" />
                          <span className="text-[11px] font-medium">Retry compile</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* State 1: Proposal Ready for Review */}
              {tailorResult && !isApplyingTailoring && (
                <div className="space-y-3 pt-1">
                  {tailorResult.limitedAlignment && (
                    <div
                      data-testid="limited-alignment-advisory"
                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-800 dark:text-amber-200 text-left"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="text-[11px] font-semibold">Role Fit Advisory</div>
                          <p className="whitespace-normal break-words text-[10.5px] leading-relaxed text-amber-700/90 dark:text-amber-300/90">
                            {tailorResult.alignmentMessage ||
                              "Limited alignment found; consider whether this resume is a strong fit for this role."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Projected ATS Score Comparison */}
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/20 bg-background/80 p-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Projected ATS Score
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-foreground">
                          <span>{Math.round(tailorResult.scoreComparison.baselineScore)}%</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {Math.round(tailorResult.scoreComparison.tailoredScore)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    {tailorResult.scoreComparison.delta >= 0 && (
                      <Badge className="shrink-0 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10.5px] font-bold whitespace-nowrap">
                        +{Math.round(tailorResult.scoreComparison.delta)}% Match
                      </Badge>
                    )}
                  </div>

                  <div className="text-[10.5px] text-muted-foreground px-0.5 flex flex-wrap justify-between gap-x-3 gap-y-0.5">
                    <span>
                      Keywords Matched:{" "}
                      <strong className="text-foreground">
                        {tailorResult.scoreComparison.matchedKeywordsCount}
                      </strong>
                    </span>
                    <span>
                      Missing:{" "}
                      <strong className="text-foreground">
                        {tailorResult.scoreComparison.missingKeywordsCount}
                      </strong>
                    </span>
                  </div>

                  {/* Section-Level Proposed Changes Preview */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary flex items-center justify-between">
                      <span>Proposed Document Changes</span>
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {tailorResult.plan.length}{" "}
                        {tailorResult.plan.length === 1 ? "change" : "changes"}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {tailorResult.plan.map((item, idx) => (
                        <TailoringPlanCard key={`${item.section}-${idx}`} planItem={item} />
                      ))}
                    </div>
                  </div>

                  <Badge className="w-full justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-300">
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Verified Candidate Facts Only • No
                    Unsupported Claims
                  </Badge>

                  {/* One Clear Primary Action to Apply Whole-Resume Tailoring */}
                  <div className="space-y-1.5 pt-1">
                    <Button
                      type="button"
                      size="default"
                      className="w-full h-9 rounded-lg text-xs font-semibold shadow-xs bg-primary hover:bg-primary/90 text-white gap-2"
                      onClick={handleApplyProposal}
                      disabled={isApplyingTailoring}
                    >
                      <Wand2 className="h-4 w-4 shrink-0 text-white" />
                      <span className="text-white font-medium text-xs">Apply Tailored Resume</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full h-7 text-[11px] text-muted-foreground hover:text-foreground"
                      onClick={handleDiscardProposal}
                      disabled={isApplyingTailoring}
                    >
                      <XCircle className="h-3 w-3 shrink-0" />
                      <span className="text-[11px] font-medium">Discard Proposal</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* State 2: Tailored Version Active — same solid card as State 3 so the
                  render never swaps to a clipped/empty variant when versions load */}
              {!tailorResult && !tailorMutation.isPending && isCurrentVersionTailored && (
                <div className="w-full min-w-0 space-y-2.5">
                  <p className="text-xs text-muted-foreground whitespace-normal break-words leading-relaxed">
                    Tailor your entire resume to match this role. CareerOS maps job requirements and crafts high-impact bullet points.
                  </p>
                  <Button
                    type="button"
                    className="w-full h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                    disabled={isTailoring}
                    onClick={handleStartTailoring}
                  >
                    {isTailoring ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white shrink-0" />
                        <span className="text-white">Analyzing &amp; Tailoring...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-white shrink-0" />
                        <span className="text-white">Re-Tailor Resume for this Role</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* State 3: Ready to Tailor — stays mounted during pending so the button is never blank */}
              {!tailorResult && !isCurrentVersionTailored && (
                <div className="w-full min-w-0 space-y-2.5">
                  <p className="text-xs text-muted-foreground whitespace-normal break-words leading-relaxed">
                    Tailor your entire resume to match this role. CareerOS maps job requirements and crafts high-impact bullet points.
                  </p>
                  <Button
                    type="button"
                    className="w-full h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    disabled={isTailoring}
                    onClick={handleStartTailoring}
                  >
                    {isTailoring ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white shrink-0" />
                        <span className="text-white">Analyzing &amp; Tailoring...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-white shrink-0" />
                        <span className="text-white">Tailor Resume for this Role</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            {/* Friendly batch evidence discovery: one collective check-in
                for high-value gaps, then re-tailor + before/after impact.
                Optional and skippable; reuses the apply-tailoring path. */}
            <TailoringEvidencePanel
              resumeId={currentId}
              versionId={currentVersionId}
              jobTitle={targetJobTitle}
              company={targetCompany}
              jobDescription={targetJobDescription}
              onApplyTailoring={onApplyTailoring}
              isApplyingTailoring={isApplyingTailoring}
            />
          </div>
        )}

        {hasJobContext ? (
          <PaneSection icon={Gauge} title="ATS Analysis">
            {isAnalyzing ? (
              <div className="space-y-2">
                <p className="whitespace-normal break-words text-[11px] text-muted-foreground" aria-live="polite">
                  {targetJobTitle?.trim()
                    ? `Analyzing your resume against ${targetJobTitle.trim()}${
                        targetCompany?.trim() ? ` at ${targetCompany.trim()}` : ""
                      }…`
                    : "Analyzing your resume against the job description…"}
                </p>
                <Skeleton className="h-3 w-2/3 rounded" />
                <Skeleton className="h-7 w-full rounded-xl" />
                <div className="grid grid-cols-2 gap-1.5">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg sm:col-span-2" />
                </div>
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : analyzeError ? (
              <Card className="glass rounded-2xl border-rose-500/30 bg-rose-500/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
                      ATS analysis failed
                    </div>
                    <div className="text-[11px] leading-relaxed text-muted-foreground">
                      {analyzeError}
                    </div>
                    {onOpenATSDialog && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1.5 h-7 rounded-md text-[11px]"
                        onClick={onOpenATSDialog}
                      >
                        <Gauge className="h-3 w-3 shrink-0" />
                        <span className="text-[11px] font-medium">Try again</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ) : atsAnalysis ? (
              <AtsAnalysisSummary
                analysis={atsAnalysis}
                selectedAtsIssue={selectedAtsIssue}
                onSelectIssue={onSelectIssue}
                evidenceLocations={evidenceLocations}
                resumeId={currentId}
                reportId={reportId}
                onAddSkill={onAddSkill}
              />
            ) : (
              <Card className="rounded-lg border-2 border-dashed border-border bg-surface p-4 text-center shadow-brutal-xs">
                <div className="text-xs text-muted-foreground">
                  No ATS analysis yet. Open the analyzer to compare this resume against the job
                  description.
                </div>
                {onOpenATSDialog && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 h-8.5 w-full rounded-md text-xs font-bold border-2 border-border shadow-brutal-xs"
                    onClick={onOpenATSDialog}
                  >
                    <Gauge className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs font-bold">Run ATS Analysis</span>
                  </Button>
                )}
              </Card>
            )}
          </PaneSection>
        ) : (
          <PaneSection icon={Gauge} title="ATS Analysis">
            <Card className="rounded-lg border-2 border-dashed border-border bg-surface p-4 text-center shadow-brutal-xs">
              <div className="text-xs text-muted-foreground">
                Add a target job to analyze your resume against.
              </div>
              {onOpenATSDialog && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 h-8.5 w-full rounded-md text-xs font-bold border-2 border-border shadow-brutal-xs"
                  onClick={onOpenATSDialog}
                >
                  <Target className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs font-bold">Set Target Job</span>
                </Button>
              )}
            </Card>
          </PaneSection>
        )}

        <PaneSection icon={FileText} title="Resume Versions">
          {versionsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg border-2 border-border" />
              ))}
            </div>
          ) : versionsIsError && versions.length === 0 ? (
            <Card className="rounded-lg border-2 border-rose-500 bg-rose-500/10 p-3.5 shadow-brutal-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                    Couldn’t load versions
                  </div>
                  <div className="text-[11px] leading-relaxed text-muted-foreground">
                    {getErrorMessage(versionsError)}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1.5 h-7 rounded-md text-[11px] font-bold border-2 border-border shadow-brutal-xs"
                    onClick={() => void refetchVersions()}
                  >
                    <RefreshCw className="h-3 w-3 shrink-0" />
                    <span className="text-[11px] font-bold">Retry</span>
                  </Button>
                </div>
              </div>
            </Card>
          ) : versions.length === 0 ? (
            <Card className="rounded-lg border-2 border-border bg-surface p-4 text-center shadow-brutal-xs">
              <div className="text-xs text-muted-foreground font-medium">No versions yet.</div>
            </Card>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div
                  key={v.id}
                  onClick={() => onSelectVersion?.(v.id)}
                  className={`rounded-lg border-2 p-3 transition-all cursor-pointer select-none ${
                    v.id === currentVersionId
                      ? "border-primary bg-surface-elevated shadow-brutal-primary-xs"
                      : "border-border bg-surface hover:border-border hover:bg-surface-elevated shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold text-foreground">{v.version_name}</div>
                      <div className="mt-0.5 truncate text-[10.5px] font-mono text-muted-foreground">
                        {formatDateTime(v.updated_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {v.is_master && (
                        <Badge variant="secondary" className="rounded-sm text-[9px] font-mono font-bold uppercase border border-border">
                          Master
                        </Badge>
                      )}
                      {v.last_ats_score != null && (
                        <span className="shrink-0 rounded-sm border border-primary/40 bg-primary/10 text-primary px-1.5 py-0.5 font-mono font-bold text-[10px]">
                          ATS {Math.round(v.last_ats_score)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PaneSection>
      </div>
    </ScrollArea>
  );
}
