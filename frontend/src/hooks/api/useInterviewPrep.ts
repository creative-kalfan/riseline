import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { interviewPrepApi } from "../../api/interview-prep";
import type {
  CritiqueResponseRequest,
  GenerateDrillsRequest,
  GeneratePrepRequest,
} from "../../types/interview-prep";

export const interviewPrepQueryKeys = {
  all: ["interview-prep"] as const,
  list: ["interview-prep", "list"] as const,
  byApplication: (applicationId: string) =>
    ["interview-prep", "by-application", applicationId] as const,
  detail: (id: string) => ["interview-prep", "detail", id] as const,
};

/** Invalidate every interview-prep query after a successful mutation. */
function invalidatePrepQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: interviewPrepQueryKeys.all });
}

/**
 * Fetch all preparation sessions for the current user,
 * optionally scoped to one application.
 */
export function useInterviewPrepSessions(applicationId?: string) {
  return useQuery({
    queryKey: applicationId
      ? interviewPrepQueryKeys.byApplication(applicationId)
      : interviewPrepQueryKeys.list,
    queryFn: () =>
      applicationId
        ? interviewPrepApi.listByApplication(applicationId).then((sessions) => ({
            sessions,
            total: sessions.length,
          }))
        : interviewPrepApi.list(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}

/**
 * Fetch a single preparation session with questions and staleness state.
 * Polls while the session is still generating.
 */
export function useInterviewPrepSession(id: string | null) {
  return useQuery({
    queryKey: interviewPrepQueryKeys.detail(id ?? ""),
    queryFn: () => interviewPrepApi.getById(id as string),
    enabled: Boolean(id),
    staleTime: 1000 * 30, // 30 seconds
    retry: 1,
    // Poll while the worker/LLM pass is still generating.
    refetchInterval: (query) => (query.state.data?.status === "generating" ? 3000 : false),
  });
}

/**
 * Generate a new preparation session for an application/interview.
 */
export function useGenerateInterviewPrep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GeneratePrepRequest) => interviewPrepApi.generate(data),
    onSuccess: () => invalidatePrepQueries(queryClient),
  });
}

/**
 * Generate stateless role-specific practice drills (no application needed).
 */
export function useGenerateDrills() {
  return useMutation({
    mutationFn: (data: GenerateDrillsRequest) => interviewPrepApi.generateDrills(data),
  });
}

/**
 * Critique one typed STAR practice response (qualitative coaching only).
 */
export function useCritiqueResponse() {
  return useMutation({
    mutationFn: (data: CritiqueResponseRequest) => interviewPrepApi.critique(data),
  });
}

/**
 * Regenerate an existing session from current source context.
 */
export function useRegenerateInterviewPrep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => interviewPrepApi.regenerate(sessionId),
    onSuccess: () => invalidatePrepQueries(queryClient),
  });
}

/**
 * Mark a question prepared / bookmarked (real progress tracking).
 */
export function useUpdatePrepQuestion(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionId,
      data,
    }: {
      questionId: string;
      data: { is_prepared?: boolean; is_bookmarked?: boolean };
    }) => interviewPrepApi.updateQuestion(questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewPrepQueryKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: interviewPrepQueryKeys.all });
    },
  });
}
