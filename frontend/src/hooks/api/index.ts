// Feature-specific API hooks
export { useJobs, useJob, jobsQueryKeys } from "./useJobs";
export { useSearchJobs } from "./useSearchJobs";
export { useSaveJob } from "./useSaveJob";
export { useMatchJobs } from "./useMatchJobs";
export { useSavedJobs } from "./useSavedJobs";

export {
  useResumes,
  useResume,
  useCreateResume,
  useUpdateResume,
  useDeleteResume,
  useParseResume,
  useUploadResume,
  resumeQueryKeys,
} from "./useResumes";

export { useAnalyzeResume, atsQueryKeys } from "./useATS";

export {
  useDashboardTelemetry,
  mapTelemetryToTimeline,
  dashboardTelemetryQueryKey,
} from "./useDashboardTelemetry";

export {
  useGenerateOptimization,
  useAcceptSuggestion,
  useRejectSuggestion,
  useReanalyze,
  useOptimizationSessions,
  useOptimizationHistory,
  optimizationQueryKeys,
} from "./useOptimization";

export {
  useApplications,
  useApplication,
  useApplicationStats,
  useCreateApplication,
  useUpdateApplicationStatus,
  useDeleteApplication,
  applicationQueryKeys,
} from "./useApplications";

export {
  useNotifications,
  useUnreadNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  NOTIFICATIONS_QUERY_KEY,
  NOTIFICATIONS_UNREAD_KEY,
  NOTIFICATIONS_PREFERENCES_KEY,
} from "./useNotifications";

export {
  useBatchedImprovements,
  useRequirementImprovement,
  useProposalDecisions,
  useApprovedChangeSet,
  useSetProposalDecision,
  useBulkProposalDecision,
  useApplyApprovedImprovements,
  improvementQueryKeys,
} from "./useImprovement";

export {
  useInterviewPrepSessions,
  useInterviewPrepSession,
  useGenerateInterviewPrep,
  useRegenerateInterviewPrep,
  useUpdatePrepQuestion,
  interviewPrepQueryKeys,
} from "./useInterviewPrep";
