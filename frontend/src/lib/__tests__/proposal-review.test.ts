import { describe, it, expect } from "vitest";
import {
  formatDecisionBadge,
  formatEligibilityBadge,
  isProposalApprovable,
  getProposalDecisionsSummary,
} from "@/lib/proposal-review-helpers";
import type { ImprovementProposal, ProposalDecision } from "@/api/improvement";

describe("Proposal Review Helpers (Target 5.4)", () => {
  describe("formatDecisionBadge", () => {
    it("returns Approved formatting for approved state", () => {
      const visual = formatDecisionBadge("approved");
      expect(visual.label).toBe("Approved");
      expect(visual.className).toContain("emerald");
      expect(visual.description).toContain("Approved for future");
    });

    it("returns Rejected formatting for rejected state", () => {
      const visual = formatDecisionBadge("rejected");
      expect(visual.label).toBe("Rejected");
      expect(visual.className).toContain("rose");
      expect(visual.description).toContain("Rejected");
    });

    it("defaults to Pending review for null/undefined/pending", () => {
      const visual1 = formatDecisionBadge("pending");
      const visual2 = formatDecisionBadge(null);
      expect(visual1.label).toBe("Pending review");
      expect(visual2.label).toBe("Pending review");
    });
  });

  describe("formatEligibilityBadge", () => {
    it("returns Blocked formatting when blocked", () => {
      const visual = formatEligibilityBadge("blocked");
      expect(visual.label).toBe("Blocked");
      expect(visual.className).toContain("rose");
      expect(visual.description).toContain("Cannot approve");
    });

    it("returns Needs Review formatting when needs_review", () => {
      const visual = formatEligibilityBadge("needs_review");
      expect(visual.label).toBe("Needs Review");
      expect(visual.className).toContain("amber");
    });

    it("returns Eligible formatting when eligible", () => {
      const visual = formatEligibilityBadge("eligible");
      expect(visual.label).toBe("Eligible");
      expect(visual.className).toContain("emerald");
    });
  });

  describe("isProposalApprovable", () => {
    it("returns true for eligible proposals with valid proposed wording", () => {
      expect(isProposalApprovable("eligible", "Built microservices using Docker.")).toBe(true);
    });

    it("returns true for needs_review proposals with valid proposed wording", () => {
      expect(isProposalApprovable("needs_review", "Built microservices using Docker.")).toBe(true);
    });

    it("returns false for blocked proposals", () => {
      expect(isProposalApprovable("blocked", "Built microservices using Docker.")).toBe(false);
    });

    it("returns false when proposed wording is empty or whitespace", () => {
      expect(isProposalApprovable("eligible", "")).toBe(false);
      expect(isProposalApprovable("eligible", "   ")).toBe(false);
      expect(isProposalApprovable("eligible", null)).toBe(false);
    });
  });

  describe("getProposalDecisionsSummary", () => {
    it("correctly aggregates decision counts and identifies pending safe proposals", () => {
      const proposals: ImprovementProposal[] = [
        {
          id: "p1",
          requirement_id: "Docker",
          proposed_wording: "Docker bullet",
          decision: "approved",
          eligibility: "eligible",
        },
        {
          id: "p2",
          requirement_id: "TypeScript",
          proposed_wording: "TS bullet",
          decision: "rejected",
          eligibility: "eligible",
        },
        {
          id: "p3",
          requirement_id: "AWS",
          proposed_wording: "AWS bullet",
          decision: "pending",
          eligibility: "eligible",
        },
        {
          id: "p4",
          requirement_id: "Kubernetes",
          proposed_wording: "K8s bullet",
          decision: "pending",
          eligibility: "blocked",
        },
      ];

      const summary = getProposalDecisionsSummary(proposals);

      expect(summary.total).toBe(4);
      expect(summary.approved).toBe(1);
      expect(summary.rejected).toBe(1);
      expect(summary.pending).toBe(2);
      expect(summary.blocked).toBe(1);
      expect(summary.hasPendingSafe).toBe(true);
    });

    it("overrides with decisionsMap when provided", () => {
      const proposals: ImprovementProposal[] = [
        {
          id: "p1",
          requirement_id: "Docker",
          proposed_wording: "Docker bullet",
          decision: "pending",
          eligibility: "eligible",
        },
      ];

      const decisionsMap = new Map<string, ProposalDecision>([
        [
          "p1",
          {
            id: "dec-1",
            decision: "approved",
            eligibility: "eligible",
          },
        ],
      ]);

      const summary = getProposalDecisionsSummary(proposals, decisionsMap);
      expect(summary.approved).toBe(1);
      expect(summary.pending).toBe(0);
      expect(summary.hasPendingSafe).toBe(false);
    });
  });
});
