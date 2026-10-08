import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { improvementApi } from "@/api/improvement";
import type {
  ImprovementAssessmentResponse,
  AssessImprovementResponse,
  ProposalDecisionState,
  ProposalDecision,
  ListProposalDecisionsResponse,
  ApprovedChangeSet,
  BulkDecisionResponse,
  ImprovementProposal,
  ApplyApprovedImprovementsRequest,
  ApplyApprovedImprovementsResponse,
} from "@/api/improvement";

export const improvementQueryKeys = {
  all: ["improvement"] as const,
  improvement: (reportId: string, requirementId?: string) =>
    ["improvement", reportId, requirementId] as const,
  batchImprovements: (reportId: string) => ["improvement", "batch", reportId] as const,
  decisions: (reportId: string) => ["improvement", "decisions", reportId] as const,
  changeSet: (reportId: string) => ["improvement", "changeSet", reportId] as const,
};

export function useBatchedImprovements(reportId?: string | null, enabled: boolean = true) {
  return useQuery<AssessImprovementResponse>({
    queryKey: improvementQueryKeys.batchImprovements(reportId ?? ""),
    queryFn: () => improvementApi.assessImprovements(reportId!),
    enabled: Boolean(reportId && enabled),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRequirementImprovement(
  reportId?: string | null,
  requirementId?: string | null,
  enabled: boolean = true,
) {
  return useQuery<ImprovementAssessmentResponse>({
    queryKey: improvementQueryKeys.improvement(reportId ?? "", requirementId ?? ""),
    queryFn: () => improvementApi.getRequirementImprovement(reportId!, requirementId!),
    enabled: Boolean(reportId && requirementId && enabled),
    staleTime: 1000 * 60 * 5,
  });
}

// ---------------------------------------------------------------------------
// Target 5.4 — Proposal Review & Approved Change Set Hooks
// ---------------------------------------------------------------------------

export function useProposalDecisions(reportId?: string | null, enabled: boolean = true) {
  return useQuery<ListProposalDecisionsResponse>({
    queryKey: improvementQueryKeys.decisions(reportId ?? ""),
    queryFn: () => improvementApi.getProposalDecisions(reportId!),
    enabled: Boolean(reportId && enabled),
    staleTime: 1000 * 60 * 5,
  });
}

export function useApprovedChangeSet(reportId?: string | null, enabled: boolean = true) {
  return useQuery<ApprovedChangeSet>({
    queryKey: improvementQueryKeys.changeSet(reportId ?? ""),
    queryFn: () => improvementApi.getApprovedChangeSet(reportId!),
    enabled: Boolean(reportId && enabled),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSetProposalDecision(reportId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation<
    ProposalDecision,
    Error,
    { proposalId: string; decision: ProposalDecisionState; proposal?: ImprovementProposal }
  >({
    mutationFn: ({ proposalId, decision, proposal }) => {
      if (!reportId) {
        throw new Error("Report ID is required to set proposal decision.");
      }
      return improvementApi.setProposalDecision(reportId, proposalId, {
        decision,
        proposal,
      });
    },
    onSuccess: () => {
      if (reportId) {
        queryClient.invalidateQueries({
          queryKey: improvementQueryKeys.decisions(reportId),
        });
        queryClient.invalidateQueries({
          queryKey: improvementQueryKeys.changeSet(reportId),
        });
        queryClient.invalidateQueries({
          queryKey: improvementQueryKeys.batchImprovements(reportId),
        });
      }
    },
  });
}

export function useBulkProposalDecision(reportId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation<
    BulkDecisionResponse,
    Error,
    { action: "approve_all_safe" | "reject_all"; proposals: ImprovementProposal[] }
  >({
    mutationFn: ({ action, proposals }) => {
      if (!reportId) {
        throw new Error("Report ID is required to set bulk proposal decisions.");
      }
      return improvementApi.bulkProposalDecision(reportId, {
        action,
        proposals,
      });
    },
    onSuccess: () => {
      if (reportId) {
        queryClient.invalidateQueries({
          queryKey: improvementQueryKeys.decisions(reportId),
        });
        queryClient.invalidateQueries({
          queryKey: improvementQueryKeys.changeSet(reportId),
        });
        queryClient.invalidateQueries({
          queryKey: improvementQueryKeys.batchImprovements(reportId),
        });
      }
    },
  });
}

export function useApplyApprovedImprovements(reportId?: string | null, resumeId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation<
    ApplyApprovedImprovementsResponse,
    Error,
    ApplyApprovedImprovementsRequest | undefined
  >({
    mutationFn: (data) => {
      if (!reportId) {
        throw new Error("Report ID is required to apply approved improvements.");
      }
      return improvementApi.applyApprovedImprovements(reportId, data);
    },
    onSuccess: () => {
      if (reportId) {
        queryClient.invalidateQueries({
          queryKey: improvementQueryKeys.decisions(reportId),
        });
        queryClient.invalidateQueries({
          queryKey: improvementQueryKeys.changeSet(reportId),
        });
        queryClient.invalidateQueries({
          queryKey: improvementQueryKeys.batchImprovements(reportId),
        });
      }
      if (resumeId) {
        queryClient.invalidateQueries({
          queryKey: ["resumes", resumeId, "versions"],
        });
        queryClient.invalidateQueries({
          queryKey: ["versions", "list", resumeId],
        });
        queryClient.invalidateQueries({
          queryKey: ["resumes", resumeId],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["resume_versions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["versions"],
      });
    },
  });
}
