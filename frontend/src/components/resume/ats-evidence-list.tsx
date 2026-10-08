"use client";

/**
 * Target 4.4 — Interactive ATS Evidence Intelligence (requirement cards)
 *
 * Compact, evidence-first presentation of RequirementCoverage entries.
 * Every displayed field is copied verbatim from backend output; nothing is
 * invented, rewritten, or regenerated. Selecting a card drives the shared
 * `selectedRequirementId`, which makes the corresponding PDF evidence
 * highlight prominent (Target 4.3 overlay) while other highlights subdue.
 *
 * Candidate Evidence (interview flow) is permanently removed. A requirement
 * with no resume evidence is presented as an honest gap with an improvement
 * proposal — never an evidence interview prompt.
 */

import { useState, useMemo } from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AtsRequirementView } from "@/lib/ats-evidence-view";
import {
  atsRequirementDomId,
  classifyEvidenceKind,
  groupAtsIssuesByPriority,
  orderedNonEmptyIssueTiers,
  pickStrengths,
  resolveEvidenceLocationSummary,
  shouldExpandByDefault,
  toggleRequirementSelection,
} from "@/lib/ats-evidence-view";
import type { AtsIssueTier } from "@/lib/ats-evidence-view";
import type { EvidenceLocationMap } from "@/lib/evidence-location";
import { ProposalReviewCard } from "@/components/resume/proposal-review-card";
import {
  useBatchedImprovements,
  useRequirementImprovement,
  useProposalDecisions,
  useSetProposalDecision,
  useBulkProposalDecision,
  useApplyApprovedImprovements,
} from "@/hooks/api/useImprovement";
import { useToast } from "@/components/ui/use-tooltip";
import type {
  ImprovementAssessmentResponse,
  ImprovementProposal,
  ProposalDecision,
} from "@/api/improvement";
import { getProposalDecisionsSummary } from "@/lib/proposal-review-helpers";

// ---------------------------------------------------------------------------
// Status visuals
// ---------------------------------------------------------------------------

type StatusVisual = { icon: React.ElementType; className: string; label: string };

const STATUS_VISUALS: Record<AtsRequirementView["status"], StatusVisual> = {
  matched: { icon: CheckCircle2, className: "text-emerald-500", label: "Strong evidence" },
  partial: { icon: AlertTriangle, className: "text-amber-500", label: "Needs improvement" },
  weak: { icon: AlertTriangle, className: "text-yellow-500", label: "Weak evidence" },
  missing: { icon: XCircle, className: "text-rose-500", label: "No evidence found" },
  unknown: { icon: HelpCircle, className: "text-muted-foreground", label: "Analysis uncertain" },
};

/** Minimal section-name prettifier for Target 4.1 provenance paths. */
function prettySectionName(section?: string): string | undefined {
  if (!section) return undefined;
  const bracketIdx = section.indexOf("[");
  if (bracketIdx === -1) return section.charAt(0).toUpperCase() + section.slice(1);
  return section.charAt(0).toUpperCase() + section.slice(1, bracketIdx) + section.slice(bracketIdx);
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function AtsRequirementCard({
  view,
  selected,
  expanded,
  evidenceLocations,
  improvement,
  reportId,
  decisionsMap,
  onToggle,
  onApproveProposal,
  onRejectProposal,
  onResetProposal,
  onApplyProposal,
  isProposalActionLoading,
}: {
  view: AtsRequirementView;
  selected: boolean;
  expanded: boolean;
  evidenceLocations?: EvidenceLocationMap | null;
  improvement?: ImprovementAssessmentResponse | null;
  reportId?: string | null;
  decisionsMap?: Map<string, ProposalDecision>;
  onToggle: () => void;
  onApproveProposal?: (proposal: ImprovementProposal) => void;
  onRejectProposal?: (proposal: ImprovementProposal) => void;
  onResetProposal?: (proposal: ImprovementProposal) => void;
  onApplyProposal?: (proposal: ImprovementProposal) => void;
  isProposalActionLoading?: boolean;
}) {
  const visual = STATUS_VISUALS[view.status];
  const Icon = visual.icon;

  const isOpen = expanded || selected;
  const hasResumeEvidence = view.evidenceItems.length > 0;

  // Lazy fetch improvement for this single requirement if not supplied in batch
  const { data: singleImprovement } = useRequirementImprovement(
    reportId,
    view.id,
    Boolean(reportId && isOpen && !improvement),
  );

  const effectiveImprovement = improvement ?? singleImprovement;
  const proposal: ImprovementProposal | null =
    effectiveImprovement?.proposals?.[0] ??
    (effectiveImprovement?.proposed_wording || effectiveImprovement?.proposedWording
      ? {
          id: `prop-${view.id}`,
          requirement_id: view.id,
          proposed_wording: (effectiveImprovement.proposed_wording ??
            effectiveImprovement.proposedWording)!,
          rationale: effectiveImprovement.rationale,
          provenance: (effectiveImprovement.evidence_type ??
            effectiveImprovement.evidenceType) as string,
          original_text:
            effectiveImprovement.current_wording ?? effectiveImprovement.currentWording,
          metrics_prompt: null,
          safety_flags: effectiveImprovement.safety_flags ?? effectiveImprovement.safetyFlags ?? [],
        }
      : null);

  const hasDetails =
    Boolean(view.jdRequirement || view.explanation || view.evidenceSourceSection) ||
    view.status === "missing" ||
    hasResumeEvidence ||
    Boolean(proposal);

  const locationSummary = hasResumeEvidence
    ? resolveEvidenceLocationSummary(evidenceLocations ?? null, view.id)
    : null;

  const proposalDecision = proposal ? decisionsMap?.get(proposal.id) : undefined;

  return (
    <div
      id={atsRequirementDomId(view.requirement)}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      aria-label={`${view.requirement}: ${visual.label}`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`w-full cursor-pointer rounded-lg border px-2.5 py-2 text-left transition-colors ${
        selected
          ? "border-primary/50 bg-primary/[0.05]"
          : "border-border/50 bg-surface-elevated/30 hover:border-border hover:bg-surface-elevated/60"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${visual.className}`} aria-hidden="true" />
        <span
          className="min-w-0 flex-1 truncate text-xs font-medium"
          title={`${view.requirement} — ${visual.label}`}
        >
          {view.requirement}
        </span>
        {proposalDecision && proposalDecision.decision === "approved" && (
          <Badge
            variant="outline"
            className="shrink-0 rounded border-emerald-500/40 bg-emerald-500/10 px-1 py-px text-[9px] font-semibold text-emerald-600 dark:text-emerald-400"
          >
            Approved
          </Badge>
        )}
        {proposalDecision && proposalDecision.decision === "rejected" && (
          <Badge
            variant="outline"
            className="shrink-0 rounded border-rose-500/40 bg-rose-500/10 px-1 py-px text-[9px] font-semibold text-rose-600 dark:text-rose-400"
          >
            Rejected
          </Badge>
        )}
        {(view.importance === "critical" || view.importance === "high") && !proposalDecision && (
          <span className="shrink-0 rounded border border-border/60 bg-background/60 px-1 py-px font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
            {view.importance}
          </span>
        )}
        {hasDetails && (
          <ChevronDown
            className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        )}
      </div>

      {isOpen && (
        <div className="mt-2 space-y-2 border-t border-border/40 pt-2">
          {view.status === "missing" ? (
            // Missing means missing — never fabricate evidence or coordinates.
            <p className="text-[11px] leading-relaxed text-foreground/80">
              No resume evidence was found for this requirement.
            </p>
          ) : view.evidenceItems.length > 0 ? (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Resume evidence found
              </div>
              {view.evidenceItems.map((item, i) => (
                <p key={i} className="mt-1 text-[11px] italic leading-relaxed text-foreground/85">
                  “{item}”
                </p>
              ))}
            </div>
          ) : null}

          {locationSummary && !locationSummary.canHighlight && view.status !== "missing" && (
            // Target 4.2 rule: never pretend a location exists.
            <p className="text-[11px] text-muted-foreground">Location unavailable</p>
          )}
          {locationSummary?.canHighlight && (
            <p className="text-[11px] text-muted-foreground">
              {classifyEvidenceKind(view.evidenceSourceSection) ?? "Source"}
              {view.evidenceSourceSection ? (
                <span className="ml-1 opacity-70">
                  ({prettySectionName(view.evidenceSourceSection)})
                </span>
              ) : null}
              {" · "}Page {locationSummary.pages.join(", ")}
              {locationSummary.confidence && (
                <span className="ml-1.5 font-mono text-[9px] uppercase opacity-70">
                  {locationSummary.confidence}
                </span>
              )}
            </p>
          )}

          {/* TARGET 5.4 GROUNDED PROPOSAL REVIEW SURFACE & ACTIONS */}
          {proposal && (proposal.proposed_wording || proposal.proposedWording) && (
            <ProposalReviewCard
              proposal={proposal}
              currentDecision={proposalDecision?.decision ?? proposal.decision}
              currentEligibility={proposalDecision?.eligibility ?? proposal.eligibility}
              eligibilityReasons={
                proposalDecision?.eligibility_reasons ?? proposal.eligibility_reasons
              }
              onApprove={(p) => onApproveProposal?.(p)}
              onReject={(p) => onRejectProposal?.(p)}
              onReset={(p) => onResetProposal?.(p)}
              onApply={(p) => onApplyProposal?.(p)}
              isLoading={isProposalActionLoading}
            />
          )}

          {view.jdRequirement && (
            <p className="text-[11px] leading-relaxed text-foreground/80">
              <span className="font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                JD:{" "}
              </span>
              {view.jdRequirement}
            </p>
          )}

          {view.explanation && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-semibold uppercase tracking-[0.12em]">
                {view.status === "missing" ? "Why it matters:" : "Why:"}{" "}
              </span>
              {view.explanation}
            </p>
          )}

          {view.recommendation && (
            <p className="text-[11px] leading-relaxed text-foreground/85">
              <span className="font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Recommendation ({view.recommendation.priority}):{" "}
              </span>
              {view.recommendation.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

function RequirementGroup({
  title,
  views,
  selectedRequirementId,
  expandedIds,
  evidenceLocations,
  improvementMap,
  reportId,
  decisionsMap,
  onToggle,
  onApproveProposal,
  onRejectProposal,
  onResetProposal,
  onApplyProposal,
  isProposalActionLoading,
}: {
  title: string;
  views: AtsRequirementView[];
  selectedRequirementId?: string | null;
  expandedIds: Set<string>;
  evidenceLocations?: EvidenceLocationMap | null;
  improvementMap?: Map<string, ImprovementAssessmentResponse>;
  reportId?: string | null;
  decisionsMap?: Map<string, ProposalDecision>;
  onToggle: (id: string) => void;
  onApproveProposal?: (proposal: ImprovementProposal) => void;
  onRejectProposal?: (proposal: ImprovementProposal) => void;
  onResetProposal?: (proposal: ImprovementProposal) => void;
  onApplyProposal?: (proposal: ImprovementProposal) => void;
  isProposalActionLoading?: boolean;
}) {
  if (views.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </div>
      {views.map((view) => (
        <AtsRequirementCard
          key={view.id}
          view={view}
          selected={selectedRequirementId === view.id}
          expanded={expandedIds.has(view.id)}
          evidenceLocations={evidenceLocations}
          improvement={improvementMap?.get(view.id)}
          reportId={reportId}
          decisionsMap={decisionsMap}
          onToggle={() => onToggle(view.id)}
          onApproveProposal={onApproveProposal}
          onRejectProposal={onRejectProposal}
          onResetProposal={onResetProposal}
          onApplyProposal={onApplyProposal}
          isProposalActionLoading={isProposalActionLoading}
        />
      ))}
    </div>
  );
}

const TIER_TITLES: Record<AtsIssueTier, string> = {
  critical: "Critical issues",
  high: "High-priority issues",
  medium: "Medium-priority issues",
  low: "Low-priority issues",
};

/** Compact strength row — selectable without duplicating evidence detail. */
function StrengthRow({
  view,
  selected,
  onToggle,
}: {
  view: AtsRequirementView;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
        selected
          ? "border-primary/50 bg-primary/[0.05]"
          : "border-transparent hover:border-border/60 hover:bg-surface-elevated/40"
      }`}
    >
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{view.requirement}</span>
    </button>
  );
}

export function AtsEvidenceList({
  views,
  selectedRequirementId,
  onSelectRequirement,
  evidenceLocations,
  resumeId,
  reportId,
  improvementList,
}: {
  views: AtsRequirementView[];
  selectedRequirementId?: string | null;
  onSelectRequirement?: (id: string | null) => void;
  evidenceLocations?: EvidenceLocationMap | null;
  resumeId?: string | null;
  reportId?: string | null;
  improvementList?: ImprovementAssessmentResponse[];
}) {
  // Default expansion: high-priority issues only. Matched stays collapsed.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(views.filter(shouldExpandByDefault).map((v) => v.id)),
  );

  // Fetch batched improvements + decisions for the active report
  const { data: batchImprovementsData } = useBatchedImprovements(reportId);
  const { data: decisionsData } = useProposalDecisions(reportId);
  const { toast } = useToast();
  const setDecisionMutation = useSetProposalDecision(reportId);
  const bulkDecisionMutation = useBulkProposalDecision(reportId);
  const applyMutation = useApplyApprovedImprovements(reportId, resumeId);

  const improvementMap = useMemo(() => {
    const list = batchImprovementsData?.assessments ?? improvementList ?? [];
    const map = new Map<string, ImprovementAssessmentResponse>();
    for (const item of list) {
      const key = item.requirement_id ?? item.requirementId;
      if (key) {
        map.set(key, item);
      }
    }
    return map;
  }, [batchImprovementsData, improvementList]);

  const decisionsMap = useMemo(() => {
    const list = decisionsData?.decisions ?? [];
    const map = new Map<string, ProposalDecision>();
    for (const d of list) {
      const key = d.proposal_id ?? d.proposalId;
      if (key) {
        map.set(key, d);
      }
    }
    return map;
  }, [decisionsData]);

  // Collect all proposals across all improvements
  const allProposals = useMemo(() => {
    const list: ImprovementProposal[] = [];
    for (const ass of improvementMap.values()) {
      if (ass.proposals && ass.proposals.length > 0) {
        list.push(...ass.proposals);
      } else if (ass.proposed_wording ?? ass.proposedWording) {
        list.push({
          id: `prop-${ass.requirement_id ?? ass.requirementId}`,
          requirement_id: ass.requirement_id ?? ass.requirementId,
          proposed_wording: (ass.proposed_wording ?? ass.proposedWording)!,
          rationale: ass.rationale,
          provenance: (ass.evidence_type ?? ass.evidenceType) as string,
          original_text: ass.current_wording ?? ass.currentWording,
          safety_flags: ass.safety_flags ?? ass.safetyFlags ?? [],
        });
      }
    }
    return list;
  }, [improvementMap]);

  const summary = useMemo(
    () => getProposalDecisionsSummary(allProposals, decisionsMap),
    [allProposals, decisionsMap],
  );

  const handleToggle = (id: string) => {
    const next = toggleRequirementSelection(selectedRequirementId ?? null, id);
    onSelectRequirement?.(next);
    setExpandedIds((prev) => {
      const s = new Set(prev);
      if (next === null) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const handleApproveProposal = (proposal: ImprovementProposal) => {
    setDecisionMutation.mutate({
      proposalId: proposal.id,
      decision: "approved",
      proposal,
    });
  };

  const handleRejectProposal = (proposal: ImprovementProposal) => {
    setDecisionMutation.mutate({
      proposalId: proposal.id,
      decision: "rejected",
      proposal,
    });
  };

  const handleResetProposal = (proposal: ImprovementProposal) => {
    setDecisionMutation.mutate({
      proposalId: proposal.id,
      decision: "pending",
      proposal,
    });
  };

  const handleBulkApproveSafe = () => {
    bulkDecisionMutation.mutate({
      action: "approve_all_safe",
      proposals: allProposals,
    });
  };

  const handleBulkRejectAll = () => {
    bulkDecisionMutation.mutate({
      action: "reject_all",
      proposals: allProposals,
    });
  };

  const handleApplyProposal = async (proposal: ImprovementProposal) => {
    try {
      const res = await applyMutation.mutateAsync({
        proposal_ids: [proposal.id],
        create_derived_version: true,
      });
      toast.success(res.message || "Applied improvement to resume version!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to apply improvement to resume.";
      toast.error(msg);
    }
  };

  const handleApplyAllApproved = async () => {
    try {
      const res = await applyMutation.mutateAsync({
        create_derived_version: true,
      });
      toast.success(res.message || `Applied ${res.applied_count} approved improvement(s)!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to apply approved improvements.";
      toast.error(msg);
    }
  };

  if (!views.length) return null;

  // Target 4.6 hierarchy: critical → high → medium → low issues, then a
  // capped Strengths section. All grouping derives from backend importance.
  const tiers = orderedNonEmptyIssueTiers(groupAtsIssuesByPriority(views));
  const strengths = pickStrengths(views);

  return (
    <div className="space-y-3" data-testid="ats-evidence-list">
      {/* Target 5.4 / 5.5 Bulk Decision & Apply Toolbar */}
      {allProposals.length > 0 && (
        <div className="rounded-lg border border-border/70 bg-surface-elevated/40 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/85">
              Improvement Proposals ({summary.total})
            </span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {summary.approved} approved
              </span>
              <span className="text-muted-foreground opacity-60">·</span>
              <span className="text-muted-foreground font-medium">{summary.pending} pending</span>
              <span className="text-muted-foreground opacity-60">·</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {summary.rejected} rejected
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={bulkDecisionMutation.isPending || !summary.hasPendingSafe}
              className="h-6 px-2 text-[10px] rounded-md font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              onClick={handleBulkApproveSafe}
              title="Approve all safe proposals that have no blocking validation errors"
            >
              Approve safe proposals
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={bulkDecisionMutation.isPending || summary.pending === 0}
              className="h-6 px-2 text-[10px] rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleBulkRejectAll}
              title="Reject all pending proposals"
            >
              Reject all pending
            </Button>
            {summary.approved > 0 && (
              <Button
                type="button"
                size="sm"
                variant="default"
                disabled={applyMutation.isPending}
                className="h-6 px-2.5 text-[10px] rounded-md font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs ml-auto"
                onClick={handleApplyAllApproved}
                title="Apply all approved improvements into a new immutable resume version"
              >
                <Check className="mr-1 h-3 w-3" />
                Apply {summary.approved} approved
              </Button>
            )}
          </div>
        </div>
      )}

      {tiers.map(({ tier, views: tierViews }) => (
        <RequirementGroup
          key={tier}
          title={`${TIER_TITLES[tier]} (${tierViews.length})`}
          views={tierViews}
          selectedRequirementId={selectedRequirementId}
          expandedIds={expandedIds}
          evidenceLocations={evidenceLocations}
          improvementMap={improvementMap}
          reportId={reportId}
          decisionsMap={decisionsMap}
          onToggle={handleToggle}
          onApproveProposal={handleApproveProposal}
          onRejectProposal={handleRejectProposal}
          onResetProposal={handleResetProposal}
          onApplyProposal={handleApplyProposal}
          isProposalActionLoading={
            setDecisionMutation.isPending ||
            bulkDecisionMutation.isPending ||
            applyMutation.isPending
          }
        />
      ))}

      {strengths.length > 0 && (
        <div className="space-y-1.5">
          <div className="px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Strengths ({strengths.length})
          </div>
          {strengths.map((view) => (
            <StrengthRow
              key={view.id}
              view={view}
              selected={selectedRequirementId === view.id}
              onToggle={() => handleToggle(view.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
