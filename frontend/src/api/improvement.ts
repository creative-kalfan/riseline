import { request } from "../utils/request";

export type ProposalDecisionState = "pending" | "approved" | "rejected";
export type ProposalEligibility = "eligible" | "needs_review" | "blocked";

export type ImprovementProposal = {
  id: string;
  requirement_id?: string;
  requirementId?: string;
  target_section?: string | null;
  targetSection?: string | null;
  target_entry_id?: string | null;
  targetEntryId?: string | null;
  provenance?: string | null;
  original_text?: string | null;
  originalText?: string | null;
  proposed_wording: string;
  proposedWording?: string;
  rationale?: string | null;
  diff_summary?: string | null;
  diffSummary?: string | null;
  metrics_prompt?: string | null;
  metricsPrompt?: string | null;
  evidence_sources?: string[];
  evidenceSources?: string[];
  safety_flags?: string[];
  safetyFlags?: string[];
  confidence?: number;
  ai_generated?: boolean;
  aiGenerated?: boolean;
  decision?: ProposalDecisionState;
  eligibility?: ProposalEligibility;
  eligibility_reasons?: string[];
  eligibilityReasons?: string[];
  decided_at?: string | null;
  decidedAt?: string | null;
};

export type ProposalDecision = {
  id: string;
  resume_id?: string;
  resumeId?: string;
  report_id?: string;
  reportId?: string;
  proposal_id?: string;
  proposalId?: string;
  requirement_id?: string;
  requirementId?: string;
  decision: ProposalDecisionState;
  eligibility: ProposalEligibility;
  eligibility_reasons?: string[];
  eligibilityReasons?: string[];
  target_section?: string | null;
  targetSection?: string | null;
  target_entry_id?: string | null;
  targetEntryId?: string | null;
  original_text?: string | null;
  originalText?: string | null;
  proposed_wording?: string | null;
  proposedWording?: string | null;
  rationale?: string | null;
  diff_summary?: string | null;
  diffSummary?: string | null;
  metrics_prompt?: string | null;
  metricsPrompt?: string | null;
  provenance?: string | null;
  evidence_sources?: string[];
  evidenceSources?: string[];
  safety_flags?: string[];
  safetyFlags?: string[];
  confidence?: number;
  decided_at?: string | null;
  decidedAt?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

export type ListProposalDecisionsResponse = {
  success: boolean;
  decisions: ProposalDecision[];
  summary?: {
    approved?: number;
    rejected?: number;
    pending?: number;
  };
};

export type ApprovedProposal = {
  proposal_id?: string;
  proposalId?: string;
  requirement_id?: string;
  requirementId?: string;
  target_section?: string | null;
  targetSection?: string | null;
  target_entry_id?: string | null;
  targetEntryId?: string | null;
  original_text?: string | null;
  originalText?: string | null;
  proposed_wording: string;
  proposedWording?: string;
  rationale?: string | null;
  diff_summary?: string | null;
  diffSummary?: string | null;
  metrics_prompt?: string | null;
  metricsPrompt?: string | null;
  provenance?: string | null;
  evidence_sources?: string[];
  evidenceSources?: string[];
  safety_flags?: string[];
  safetyFlags?: string[];
  confidence?: number;
  approved_at?: string | null;
  approvedAt?: string | null;
};

export type ApprovedChangeSet = {
  id: string;
  resume_id?: string;
  resumeId?: string;
  report_id?: string;
  reportId?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  proposals: ApprovedProposal[];
  total_approved?: number;
  totalApproved?: number;
  total_pending?: number;
  totalPending?: number;
  total_rejected?: number;
  totalRejected?: number;
  status: string;
};

export type BulkDecisionResponse = {
  success: boolean;
  action: string;
  updated_count?: number;
  updatedCount?: number;
  approved_count?: number;
  approvedCount?: number;
  rejected_count?: number;
  rejectedCount?: number;
  skipped_blocked_count?: number;
  skippedBlockedCount?: number;
  decisions: ProposalDecision[];
};

export type ImprovementAssessmentResponse = {
  requirement_id?: string;
  requirementId?: string;
  classification: string;
  confidence: number;
  existing_evidence?: string[];
  existingEvidence?: string[];
  evidence_source?: string;
  evidenceSource?: string;
  evidence_type?: string;
  evidenceType?: string;
  current_wording?: string;
  currentWording?: string;
  proposed_wording?: string;
  proposedWording?: string;
  rationale?: string;
  safety_flags?: string[];
  safetyFlags?: string[];
  ai_generated?: boolean;
  aiGenerated?: boolean;
  proposals?: ImprovementProposal[];
};

export type AssessImprovementResponse = {
  success: boolean;
  fallback_used?: boolean;
  fallbackUsed?: boolean;
  message?: string;
  provider_used?: string | null;
  providerUsed?: string | null;
  model_used?: string | null;
  modelUsed?: string | null;
  assessments: ImprovementAssessmentResponse[];
};

export type ImprovementApi = {
  assessImprovements: (reportId: string) => Promise<AssessImprovementResponse>;
  getRequirementImprovement: (
    reportId: string,
    requirementId: string,
  ) => Promise<ImprovementAssessmentResponse>;
  getProposalDecisions: (reportId: string) => Promise<ListProposalDecisionsResponse>;
  setProposalDecision: (
    reportId: string,
    proposalId: string,
    data: { decision: ProposalDecisionState; proposal?: ImprovementProposal },
  ) => Promise<ProposalDecision>;
  bulkProposalDecision: (
    reportId: string,
    data: { action: "approve_all_safe" | "reject_all"; proposals: ImprovementProposal[] },
  ) => Promise<BulkDecisionResponse>;
  getApprovedChangeSet: (reportId: string) => Promise<ApprovedChangeSet>;
  applyApprovedImprovements: (
    reportId: string,
    data?: ApplyApprovedImprovementsRequest,
  ) => Promise<ApplyApprovedImprovementsResponse>;
};

export const improvementApi: ImprovementApi = {
  assessImprovements: async (reportId: string) => {
    return request<AssessImprovementResponse>({
      method: "POST",
      path: `/api/improvement/ats/${reportId}/assess`,
    });
  },

  getRequirementImprovement: async (reportId: string, requirementId: string) => {
    return request<ImprovementAssessmentResponse>({
      method: "GET",
      path: `/api/improvement/ats/${reportId}/requirements/${encodeURIComponent(requirementId)}`,
    });
  },

  getProposalDecisions: async (reportId: string) => {
    return request<ListProposalDecisionsResponse>({
      method: "GET",
      path: `/api/improvement/ats/${reportId}/decisions`,
    });
  },

  setProposalDecision: async (
    reportId: string,
    proposalId: string,
    data: { decision: ProposalDecisionState; proposal?: ImprovementProposal },
  ) => {
    return request<ProposalDecision>({
      method: "POST",
      path: `/api/improvement/ats/${reportId}/proposals/${encodeURIComponent(proposalId)}/decision`,
      body: {
        decision: data.decision,
        proposal: data.proposal
          ? {
              id: data.proposal.id,
              requirement_id: data.proposal.requirement_id ?? data.proposal.requirementId,
              target_section: data.proposal.target_section ?? data.proposal.targetSection,
              target_entry_id: data.proposal.target_entry_id ?? data.proposal.targetEntryId,
              provenance: data.proposal.provenance,
              original_text: data.proposal.original_text ?? data.proposal.originalText,
              proposed_wording: data.proposal.proposed_wording ?? data.proposal.proposedWording,
              rationale: data.proposal.rationale,
              diff_summary: data.proposal.diff_summary ?? data.proposal.diffSummary,
              metrics_prompt: data.proposal.metrics_prompt ?? data.proposal.metricsPrompt,
              evidence_sources: data.proposal.evidence_sources ?? data.proposal.evidenceSources,
              safety_flags: data.proposal.safety_flags ?? data.proposal.safetyFlags,
              confidence: data.proposal.confidence,
              ai_generated: data.proposal.ai_generated ?? data.proposal.aiGenerated,
            }
          : undefined,
      },
    });
  },

  bulkProposalDecision: async (
    reportId: string,
    data: { action: "approve_all_safe" | "reject_all"; proposals: ImprovementProposal[] },
  ) => {
    return request<BulkDecisionResponse>({
      method: "POST",
      path: `/api/improvement/ats/${reportId}/proposals/bulk-decision`,
      body: {
        action: data.action,
        proposals: data.proposals.map((p) => ({
          id: p.id,
          requirement_id: p.requirement_id ?? p.requirementId,
          target_section: p.target_section ?? p.targetSection,
          target_entry_id: p.target_entry_id ?? p.targetEntryId,
          provenance: p.provenance,
          original_text: p.original_text ?? p.originalText,
          proposed_wording: p.proposed_wording ?? p.proposedWording,
          rationale: p.rationale,
          diff_summary: p.diff_summary ?? p.diffSummary,
          metrics_prompt: p.metrics_prompt ?? p.metricsPrompt,
          evidence_sources: p.evidence_sources ?? p.evidenceSources,
          safety_flags: p.safety_flags ?? p.safetyFlags,
          confidence: p.confidence,
          ai_generated: p.ai_generated ?? p.aiGenerated,
        })),
      },
    });
  },

  getApprovedChangeSet: async (reportId: string) => {
    return request<ApprovedChangeSet>({
      method: "GET",
      path: `/api/improvement/ats/${reportId}/change-set`,
    });
  },

  applyApprovedImprovements: async (reportId: string, data?: ApplyApprovedImprovementsRequest) => {
    return request<ApplyApprovedImprovementsResponse>({
      method: "POST",
      path: `/api/improvement/ats/${reportId}/apply`,
      body: {
        version_id: data?.version_id ?? data?.versionId,
        proposal_ids: data?.proposal_ids ?? data?.proposalIds,
        create_derived_version: data?.create_derived_version ?? data?.createDerivedVersion ?? true,
        version_name: data?.version_name ?? data?.versionName,
      },
    });
  },
};

export type ApplyApprovedImprovementsRequest = {
  version_id?: string | null;
  versionId?: string | null;
  proposal_ids?: string[] | null;
  proposalIds?: string[] | null;
  create_derived_version?: boolean;
  createDerivedVersion?: boolean;
  version_name?: string | null;
  versionName?: string | null;
};

export type AppliedProposalSummary = {
  proposal_id: string;
  proposalId?: string;
  requirement_id: string;
  requirementId?: string;
  target_section?: string | null;
  targetSection?: string | null;
  original_text?: string | null;
  originalText?: string | null;
  applied_text: string;
  appliedText?: string;
  provenance?: string | null;
  summary?: string | null;
  status: string;
};

export type ApplyApprovedImprovementsResponse = {
  success: boolean;
  resume_id: string;
  resumeId?: string;
  report_id: string;
  reportId?: string;
  version_id: string;
  versionId?: string;
  version_name: string;
  versionName?: string;
  is_new_version: boolean;
  isNewVersion?: boolean;
  applied_count: number;
  appliedCount?: number;
  applied_proposals: AppliedProposalSummary[];
  appliedProposals?: AppliedProposalSummary[];
  message: string;
};
