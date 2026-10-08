export { apiClient } from "./client";
export type { ApiClient } from "./client";

export { apiConfig } from "./config";
export type { ApiConfig } from "./config";

export { authApi } from "./auth.ts";
export { resumeApi } from "./resume.ts";
export { atsApi } from "./ats.ts";
export { jobsApi } from "./jobs.ts";
export { recommendationsApi } from "./recommendations.ts";
export { applicationsApi } from "./applications.ts";
export { interviewPrepApi } from "./interview-prep.ts";
export { dashboardApi } from "./dashboard.ts";
export { notificationsApi } from "./notifications.ts";
export { copilotApi } from "./copilot.ts";
export { improvementApi } from "./improvement.ts";

export type { AuthApi } from "./auth.ts";
export type { ResumeApi } from "./resume.ts";
export type { AtsApi } from "./ats.ts";
export type { JobsApi } from "./jobs.ts";
export type { RecommendationsApi } from "./recommendations.ts";
export type { ApplicationsApi } from "./applications.ts";
export type { InterviewPrepApi } from "./interview-prep.ts";
export type { DashboardApi } from "./dashboard.ts";
export type { NotificationsApi } from "./notifications.ts";
export type { CopilotApi } from "./copilot.ts";
export type {
  ImprovementApi,
  ImprovementProposal,
  ProposalDecision,
  ProposalDecisionState,
  ProposalEligibility,
  ListProposalDecisionsResponse,
  ApprovedProposal,
  ApprovedChangeSet,
  BulkDecisionResponse,
  ImprovementAssessmentResponse,
  AssessImprovementResponse,
  ApplyApprovedImprovementsRequest,
  AppliedProposalSummary,
  ApplyApprovedImprovementsResponse,
} from "./improvement.ts";
export type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationStatusRequest,
  ApplicationStatus,
  ApplicationStage,
} from "../types/application.ts";
