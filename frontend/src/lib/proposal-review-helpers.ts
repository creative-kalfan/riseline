/**
 * Helper utilities for Proposal Review & Approval Workflow (Target 5.4).
 *
 * Deterministic helper functions for UI badge formatting, approvability checks,
 * and summary metrics calculation.
 */

import type {
  ImprovementProposal,
  ProposalDecision,
  ProposalDecisionState,
  ProposalEligibility,
} from "@/api/improvement";

export type DecisionBadgeVisual = {
  label: string;
  className: string;
  description: string;
};

export type EligibilityBadgeVisual = {
  label: string;
  className: string;
  description: string;
};

export function formatDecisionBadge(
  decision?: ProposalDecisionState | string | null,
): DecisionBadgeVisual {
  const dec = (decision ?? "pending").toLowerCase();
  switch (dec) {
    case "approved":
      return {
        label: "Approved",
        className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        description: "Approved for future resume update",
      };
    case "rejected":
      return {
        label: "Rejected",
        className: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
        description: "Rejected — resume will not use this proposal",
      };
    case "pending":
    default:
      return {
        label: "Pending review",
        className: "border-border/60 bg-muted/30 text-muted-foreground",
        description: "Pending candidate review and decision",
      };
  }
}

export function formatEligibilityBadge(
  eligibility?: ProposalEligibility | string | null,
): EligibilityBadgeVisual {
  const elig = (eligibility ?? "eligible").toLowerCase();
  switch (elig) {
    case "blocked":
      return {
        label: "Blocked",
        className: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
        description: "Cannot approve — evidence or safety validation is insufficient",
      };
    case "needs_review":
      return {
        label: "Needs Review",
        className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        description: "Review safety or metric prompt before approving",
      };
    case "eligible":
    default:
      return {
        label: "Eligible",
        className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        description: "Ready for review and approval",
      };
  }
}

export function isProposalApprovable(
  eligibility?: ProposalEligibility | string | null,
  proposedWording?: string | null,
): boolean {
  if (!proposedWording || !proposedWording.trim()) {
    return false;
  }
  const elig = (eligibility ?? "eligible").toLowerCase();
  return elig !== "blocked";
}

export function getProposalDecisionsSummary(
  proposals: ImprovementProposal[],
  decisionsMap?: Map<string, ProposalDecision> | null,
) {
  let approved = 0;
  let rejected = 0;
  let pending = 0;
  let blocked = 0;

  for (const prop of proposals) {
    const dec = decisionsMap?.get(prop.id)?.decision ?? prop.decision ?? "pending";
    const elig = decisionsMap?.get(prop.id)?.eligibility ?? prop.eligibility ?? "eligible";

    if (elig === "blocked") {
      blocked += 1;
    }

    if (dec === "approved") {
      approved += 1;
    } else if (dec === "rejected") {
      rejected += 1;
    } else {
      pending += 1;
    }
  }

  return {
    total: proposals.length,
    approved,
    rejected,
    pending,
    blocked,
    hasPendingSafe: pending > 0 && pending - blocked > 0,
  };
}
