import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Lightbulb,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-tooltip";
import { tailoringEvidenceApi } from "@/api/optimization";
import { getErrorMessage } from "@/utils/api-error";
import type {
  TailoringOpportunitiesResponse,
  TailoringRespondResponse,
} from "@/types/tailoring-evidence";
import type { TailoringPlanItem } from "@/types/optimization";

/**
 * Friendly batch evidence discovery panel for Resume Studio.
 *
 * One compact interaction: the candidate selects every area they have
 * actually worked with, answers once in their own words, and CareerOS
 * re-tailors the resume and shows the before/after match. Skippable,
 * batched (never one question per skill), and free of auditor language —
 * all candidate-facing copy comes from the backend translation layer.
 */
export function TailoringEvidencePanel({
  resumeId,
  versionId,
  jobTitle,
  company,
  jobDescription,
  onApplyTailoring,
  isApplyingTailoring,
}: {
  resumeId: string;
  versionId?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  jobDescription?: string | null;
  onApplyTailoring?: (
    tailoredProfile: Record<string, unknown>,
    plan: TailoringPlanItem[],
    jobTitle?: string,
    company?: string,
    jobDescription?: string,
  ) => Promise<void>;
  isApplyingTailoring?: boolean;
}) {
  const { toast } = useToast();
  const [batch, setBatch] = useState<TailoringOpportunitiesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [freeText, setFreeText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<TailoringRespondResponse | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const loadedKeyRef = useRef<string | null>(null);

  const contextKey = `${resumeId}|${versionId ?? ""}|${(jobDescription ?? "").trim()}`;

  const load = useCallback(async () => {
    if (!jobDescription?.trim()) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await tailoringEvidenceApi.opportunities({
        resumeId,
        versionId: versionId ?? undefined,
        jobDescription,
        jobTitle: jobTitle ?? undefined,
        company: company ?? undefined,
      });
      setBatch(res);
    } catch (err) {
      setLoadError(getErrorMessage(err) || "Could not load suggestions");
    } finally {
      setIsLoading(false);
    }
  }, [resumeId, versionId, jobDescription, jobTitle, company]);

  useEffect(() => {
    if (loadedKeyRef.current === contextKey) return;
    loadedKeyRef.current = contextKey;
    setBatch(null);
    setSelected(new Set());
    setFreeText("");
    setResult(null);
    setDismissed(false);
    void load();
  }, [contextKey, load]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!batch || selected.size === 0 || !jobDescription?.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await tailoringEvidenceApi.respond({
        resumeId,
        versionId: versionId ?? undefined,
        jobDescription,
        jobTitle: jobTitle ?? undefined,
        company: company ?? undefined,
        opportunities: batch.opportunities,
        selectedIds: Array.from(selected),
        freeText,
      });
      setResult(res);
      if (res.facts.length > 0) {
        toast.success(res.successNote || "Thanks — re-tailoring with your experience.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err) || "Could not apply your experience");
    } finally {
      setIsSubmitting(false);
    }
  }, [batch, selected, freeText, resumeId, versionId, jobDescription, jobTitle, company, toast]);

  const handleApply = useCallback(async () => {
    if (!result || result.facts.length === 0 || !onApplyTailoring) return;
    setIsApplying(true);
    try {
      await onApplyTailoring(
        result.tailoredProfile,
        result.plan,
        jobTitle ?? undefined,
        company ?? undefined,
        jobDescription ?? undefined,
      );
      setDismissed(true);
    } catch {
      // Parent surfaces the apply error inline.
    } finally {
      setIsApplying(false);
    }
  }, [result, onApplyTailoring, jobTitle, company, jobDescription]);

  if (!jobDescription?.trim() || dismissed) {
    if (!dismissed) return null;
    return (
      <div className="w-full min-w-0">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 w-full rounded-lg text-[11px] text-muted-foreground hover:text-foreground"
          onClick={() => setDismissed(false)}
        >
          <Lightbulb className="h-3 w-3 shrink-0" />
          <span className="text-[11px] font-medium">Have more experience to add?</span>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full min-w-0 space-y-2 rounded-xl border border-border/60 p-3.5">
        <Skeleton className="h-4 w-2/3 rounded" />
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    );
  }

  if (loadError) {
    return null;
  }

  if (!batch || batch.opportunities.length === 0) {
    return null;
  }

  const busy = isSubmitting || isApplying || Boolean(isApplyingTailoring);
  const impact = result?.impact;

  return (
    <div className="w-full min-w-0 space-y-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-3.5 shadow-xs">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
        <span className="whitespace-normal break-words text-xs font-semibold text-foreground">
          {batch.heading || "A few things could make your match stronger"}
        </span>
      </div>

      {!result ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Select any you've touched:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {batch.opportunities.map((opp) => {
                const checked = selected.has(opp.id);
                const label = opp.displayLabel || opp.friendlyTitle;
                return (
                  <button
                    key={opp.id}
                    type="button"
                    onClick={() => toggle(opp.id)}
                    aria-pressed={checked}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                      checked
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border border-border/70 bg-background/80 text-foreground/80 hover:bg-background hover:text-foreground"
                    }`}
                  >
                    <span>{label}</span>
                    {checked && <Check className="h-3 w-3 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Your familiarity:
            </span>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
              {[
                { label: "Used directly", hint: "Yes, I've worked with some of them" },
                { label: "Related exposure", hint: "I have related exposure" },
                { label: "Help me figure out", hint: "Not sure / help me figure it out" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    if (selected.size === 0 && batch.opportunities.length > 0) {
                      // Auto-select all if user clicks a quick stance without picking chips yet
                      setSelected(new Set(batch.opportunities.map((o) => o.id)));
                    }
                    if (!freeText.includes(opt.hint)) {
                      setFreeText((prev) => (prev ? `${prev}. ${opt.hint}` : opt.hint));
                    }
                  }}
                  className="rounded-lg border border-border/60 bg-background/50 px-2 py-1.5 text-left text-[11px] font-medium text-foreground/90 transition-colors hover:border-primary/40 hover:bg-background"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {batch.inputLabel || "Tell us where you used them (projects, courses, or roles):"}
            </span>
            <Textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="e.g. Worked with them during an internship or built a project using similar workflows..."
              rows={2}
              disabled={busy}
              aria-label={batch.inputLabel}
              className="min-h-14 resize-y text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 flex-1 rounded-lg text-xs font-semibold"
              disabled={busy || selected.size === 0}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  <span>Working it in…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span>{batch.submitLabel || "Use my experience"}</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-lg text-[11px] text-muted-foreground"
              disabled={busy}
              onClick={() => setDismissed(true)}
            >
              {batch.skipLabel || "Skip for now"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {result.needsClarification ? (
            <div className="space-y-2.5">
              <p className="whitespace-normal break-words text-[11px] leading-relaxed text-foreground/90">
                {result.needsClarification}
              </p>
              <Textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder={batch.inputPlaceholder}
                rows={3}
                disabled={busy}
                aria-label={batch.inputLabel}
                className="min-h-16 resize-y text-xs"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 flex-1 rounded-lg text-xs font-semibold"
                  disabled={busy || selected.size === 0}
                  onClick={() => void handleSubmit()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                      <span>Working it in…</span>
                    </>
                  ) : (
                    <span>Try again</span>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-lg text-[11px] text-muted-foreground"
                  disabled={busy}
                  onClick={() => setDismissed(true)}
                >
                  {batch.skipLabel || "Skip for now"}
                </Button>
              </div>
            </div>
          ) : result.facts.length === 0 ? (
            <div className="space-y-2">
              <p className="whitespace-normal break-words text-[11px] leading-relaxed text-muted-foreground">
                {result.message ||
                  "No problem — we'll keep tailoring with your existing experience."}
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 rounded-lg text-[11px] text-muted-foreground"
                onClick={() => setDismissed(true)}
              >
                Dismiss
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {result.successNote && (
                <p className="whitespace-normal break-words text-[11px] font-medium text-foreground/90">
                  {result.successNote}
                </p>
              )}
              {impact && (
                <div className="space-y-2 rounded-lg border border-primary/20 bg-background/80 p-2.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-foreground">
                      <span>{Math.round(impact.baselineScore)}%</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {Math.round(impact.tailoredScore)}%
                      </span>
                    </div>
                    {impact.delta !== 0 && (
                      <Badge className="shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                        {impact.delta > 0 ? "+" : ""}
                        {Math.round(impact.delta)}% Match
                      </Badge>
                    )}
                  </div>
                  <Progress
                    value={Math.max(0, Math.min(100, Math.round(impact.tailoredScore)))}
                    className="h-1.5 bg-muted/60"
                  />
                  {impact.improvements.length > 0 && (
                    <ul className="space-y-1">
                      {impact.improvements.map((line) => (
                        <li
                          key={line}
                          className="flex min-w-0 items-start gap-1.5 text-[11px] text-foreground/90"
                        >
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span className="min-w-0 flex-1 break-words">{line}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {impact.explanation && (
                    <p className="whitespace-normal break-words text-[10.5px] leading-relaxed text-muted-foreground">
                      {impact.explanation}
                    </p>
                  )}
                </div>
              )}
              {onApplyTailoring ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-9 w-full rounded-lg text-xs font-semibold"
                  disabled={busy}
                  onClick={() => void handleApply()}
                >
                  {isApplying || isApplyingTailoring ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      <span>Compiling updated version…</span>
                    </>
                  ) : (
                    <span>Apply updated resume</span>
                  )}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-full rounded-lg text-[11px] text-muted-foreground"
                disabled={busy}
                onClick={() => setDismissed(true)}
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
