"use client";

/**
 * Proposal Review Card Component (Target 5.4).
 *
 * Provides an explicit review surface for improvement proposals:
 * - Current text vs Proposed wording
 * - Truthful evidence provenance & candidate evidence tagging
 * - Deterministic eligibility (ELIGIBLE / NEEDS_REVIEW / BLOCKED)
 * - Explicit Approve / Reject / Reset state management
 * - Zero resume mutation (Target 5.5 boundary)
 */

import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Lightbulb,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  ImprovementProposal,
  ProposalDecisionState,
  ProposalEligibility,
} from "@/api/improvement";
import { formatProvenanceLabel } from "@/lib/provenance-labels";
import {
  formatDecisionBadge,
  formatEligibilityBadge,
  isProposalApprovable,
} from "@/lib/proposal-review-helpers";

export function ProposalReviewCard({
  proposal,
  currentDecision,
  currentEligibility,
  eligibilityReasons,
  onApprove,
  onReject,
  onReset,
  onApply,
  isLoading = false,
}: {
  proposal: ImprovementProposal;
  currentDecision?: ProposalDecisionState | string | null;
  currentEligibility?: ProposalEligibility | string | null;
  eligibilityReasons?: string[];
  onApprove: (proposal: ImprovementProposal) => void;
  onReject: (proposal: ImprovementProposal) => void;
  onReset: (proposal: ImprovementProposal) => void;
  onApply?: (proposal: ImprovementProposal) => void;
  isLoading?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const decisionState: ProposalDecisionState =
    (currentDecision as ProposalDecisionState) ?? proposal.decision ?? "pending";
  const eligibility: ProposalEligibility =
    (currentEligibility as ProposalEligibility) ?? proposal.eligibility ?? "eligible";
  const reasons =
    eligibilityReasons ?? proposal.eligibility_reasons ?? proposal.eligibilityReasons ?? [];

  const decisionVisual = formatDecisionBadge(decisionState);
  const eligibilityVisual = formatEligibilityBadge(eligibility);
  const approvable = isProposalApprovable(
    eligibility,
    proposal.proposed_wording ?? proposal.proposedWording,
  );

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const proposedText = proposal.proposed_wording ?? proposal.proposedWording ?? "";
  const originalText = proposal.original_text ?? proposal.originalText ?? "";
  const provenance = proposal.provenance;
  const metricsPrompt = proposal.metrics_prompt ?? proposal.metricsPrompt;

  return (
    <div
      className={`rounded-lg border p-3 space-y-2.5 transition-colors ${
        decisionState === "approved"
          ? "border-emerald-500/40 bg-emerald-500/[0.03]"
          : decisionState === "rejected"
            ? "border-rose-500/30 bg-rose-500/[0.02]"
            : "border-primary/30 bg-primary/[0.02]"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header & Badges */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-[10px] font-semibold text-primary uppercase tracking-[0.11em] truncate">
            Improvement Proposal
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {provenance && (
            <Badge
              variant="outline"
              className="text-[9px] font-normal border-border/70 bg-background/60 text-muted-foreground"
            >
              {formatProvenanceLabel(provenance)}
            </Badge>
          )}

          {/* Eligibility Badge */}
          {eligibility === "blocked" ? (
            <Badge
              variant="outline"
              className={`text-[9px] font-semibold ${eligibilityVisual.className}`}
              title={eligibilityVisual.description}
            >
              <ShieldAlert className="mr-1 h-2.5 w-2.5" />
              {eligibilityVisual.label}
            </Badge>
          ) : eligibility === "needs_review" ? (
            <Badge
              variant="outline"
              className={`text-[9px] font-medium ${eligibilityVisual.className}`}
              title={eligibilityVisual.description}
            >
              <AlertTriangle className="mr-1 h-2.5 w-2.5" />
              {eligibilityVisual.label}
            </Badge>
          ) : null}

          {/* Decision State Badge */}
          <Badge
            variant="outline"
            className={`text-[9px] font-semibold ${decisionVisual.className}`}
            title={decisionVisual.description}
          >
            {decisionState === "approved" ? (
              <CheckCircle2 className="mr-1 h-2.5 w-2.5 text-emerald-500" />
            ) : decisionState === "rejected" ? (
              <XCircle className="mr-1 h-2.5 w-2.5 text-rose-500" />
            ) : (
              <HelpCircle className="mr-1 h-2.5 w-2.5 text-muted-foreground" />
            )}
            {decisionVisual.label}
          </Badge>

          {/* Copy Button */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-5 px-1 text-[10px] text-muted-foreground hover:text-foreground"
            title="Copy suggested wording"
            onClick={(e) => handleCopy(proposedText, e)}
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Target Section Info if available */}
      {proposal.target_section && (
        <div className="text-[10px] text-muted-foreground">
          <span className="font-semibold text-foreground/75">Target Section:</span>{" "}
          <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[9px]">
            {proposal.target_section}
          </code>
        </div>
      )}

      {/* Current vs Proposed Diff */}
      <div className="space-y-1.5">
        {originalText && (
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current text
            </div>
            <p className="text-[11px] italic text-muted-foreground/80 pl-1.5 border-l-2 border-muted/60 line-through opacity-85">
              “{originalText}”
            </p>
          </div>
        )}

        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider text-primary">
            Proposed wording
          </div>
          <p className="text-[11px] font-medium leading-relaxed text-foreground pl-1.5 py-1 bg-primary/[0.04] border-l-2 border-primary rounded-r">
            “{proposedText}”
          </p>
        </div>
      </div>

      {/* Rationale */}
      {proposal.rationale && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground/80">Why:</span> {proposal.rationale}
        </p>
      )}

      {/* Evidence sources */}
      {proposal.evidence_sources && proposal.evidence_sources.length > 0 && (
        <div className="text-[10px] text-muted-foreground space-y-0.5">
          <span className="font-semibold text-foreground/75">Evidence Source:</span>
          {proposal.evidence_sources.map((src, i) => (
            <p key={i} className="italic text-[10px] pl-1 border-l border-border/50">
              “{src}”
            </p>
          ))}
        </div>
      )}

      {/* Metrics Prompt Banner */}
      {metricsPrompt && (
        <div className="rounded border border-amber-500/30 bg-amber-500/10 p-1.5 text-[10px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
          <span>{metricsPrompt}</span>
        </div>
      )}

      {/* Blocked Reasons Banner */}
      {eligibility === "blocked" && reasons.length > 0 && (
        <div className="rounded border border-rose-500/30 bg-rose-500/10 p-1.5 text-[10px] text-rose-800 dark:text-rose-300 flex items-start gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <span className="font-semibold">Cannot approve proposal:</span>
            <ul className="list-disc list-inside mt-0.5 space-y-0.5">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-1 flex items-center justify-between gap-2 border-t border-border/40">
        <div className="text-[10px] text-muted-foreground italic">
          {decisionState === "approved"
            ? "Approved for future resume update"
            : decisionState === "rejected"
              ? "Rejected — will not be used"
              : eligibility === "blocked"
                ? "Approval blocked by safety validation"
                : "Awaiting candidate decision"}
        </div>

        <div className="flex items-center gap-1.5">
          {decisionState === "approved" ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isLoading}
                className="h-6 px-2 text-[10px] rounded-md hover:bg-muted"
                onClick={() => onReset(proposal)}
              >
                <RotateCcw className="mr-1 h-2.5 w-2.5" />
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isLoading}
                className="h-6 px-2 text-[10px] rounded-md text-destructive hover:bg-destructive/10"
                onClick={() => onReject(proposal)}
              >
                <XCircle className="mr-1 h-2.5 w-2.5" />
                Reject
              </Button>
              {onApply && (
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  disabled={isLoading}
                  className="h-6 px-2.5 text-[10px] rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                  onClick={() => onApply(proposal)}
                  title="Apply this approved improvement directly to a resume version"
                >
                  <Check className="mr-1 h-2.5 w-2.5" />
                  Apply
                </Button>
              )}
            </>
          ) : decisionState === "rejected" ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isLoading}
                className="h-6 px-2 text-[10px] rounded-md hover:bg-muted"
                onClick={() => onReset(proposal)}
              >
                <RotateCcw className="mr-1 h-2.5 w-2.5" />
                Reopen
              </Button>
              {approvable && (
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  disabled={isLoading}
                  className="h-6 px-2 text-[10px] rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onApprove(proposal)}
                >
                  <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                  Approve
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isLoading}
                className="h-6 px-2 text-[10px] rounded-md text-destructive hover:bg-destructive/10"
                onClick={() => onReject(proposal)}
              >
                <XCircle className="mr-1 h-2.5 w-2.5" />
                Reject
              </Button>
              <Button
                type="button"
                size="sm"
                variant="default"
                disabled={isLoading || !approvable}
                title={!approvable ? "Blocked by safety checks" : "Approve proposal"}
                className={`h-6 px-2.5 text-[10px] rounded-md ${
                  approvable
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                }`}
                onClick={() => onApprove(proposal)}
              >
                <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                Approve
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
