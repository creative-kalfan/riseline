import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { optimizationApi, tailoringEvidenceApi } from "../../api/optimization";
import type { TailoringOpportunityCard } from "../../types/tailoring-evidence";
import type {
  GenerateOptimizationResponse,
  SuggestionActionResponse,
  OptimizationSession,
  OptimizationHistoryItem,
  ReanalyzeResponse,
  GenerateSkillsOptimizationResponse,
  GenerateSummaryOptimizationResponse,
  GenerateExperienceBulletOptimizationResponse,
} from "../../types/optimization";

export const optimizationQueryKeys = {
  all: ["optimization"] as const,
  sessions: (resumeId: string) => ["optimization", "sessions", resumeId] as const,
  session: (sessionId: string) => ["optimization", "session", sessionId] as const,
  history: (resumeId: string) => ["optimization", "history", resumeId] as const,
};

export function useGenerateOptimization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      resumeId: string;
      versionId?: string;
      jobDescription: string;
      jobTitle?: string;
      company?: string;
      atsReportId?: string;
    }) => optimizationApi.generate(data),
    onSuccess: (data: GenerateOptimizationResponse, variables) => {
      queryClient.setQueryData(optimizationQueryKeys.session(data.sessionId), {
        suggestions: data.suggestions.map((s) => ({ suggestion: s, sessionId: data.sessionId })),
      });
      queryClient.invalidateQueries({
        queryKey: optimizationQueryKeys.sessions(variables.resumeId),
      });
    },
  });
}

export function useGenerateSkillsOptimization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      resumeId: string;
      versionId?: string;
      jobDescription: string;
      jobTitle?: string;
      company?: string;
    }) => optimizationApi.generateSkills(data),
    onSuccess: (data: GenerateSkillsOptimizationResponse, variables) => {
      queryClient.setQueryData(optimizationQueryKeys.session(data.sessionId), {
        suggestions: data.suggestions.map((s) => ({ suggestion: s, sessionId: data.sessionId })),
      });
      queryClient.invalidateQueries({
        queryKey: optimizationQueryKeys.sessions(variables.resumeId),
      });
    },
  });
}

export function useGenerateSummaryOptimization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      resumeId: string;
      versionId?: string;
      jobDescription: string;
      jobTitle?: string;
      company?: string;
    }) => optimizationApi.generateSummary(data),
    onSuccess: (data: GenerateSummaryOptimizationResponse, variables) => {
      queryClient.setQueryData(optimizationQueryKeys.session(data.sessionId), {
        suggestions: data.suggestions.map((s) => ({ suggestion: s, sessionId: data.sessionId })),
      });
      queryClient.invalidateQueries({
        queryKey: optimizationQueryKeys.sessions(variables.resumeId),
      });
    },
  });
}

export function useGenerateExperienceBulletOptimization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      resumeId: string;
      versionId?: string;
      jobDescription: string;
      jobTitle?: string;
      company?: string;
      entryId: string;
      bulletId: string;
      bulletText: string;
    }) => optimizationApi.generateExperienceBullet(data),
    onSuccess: (data: GenerateExperienceBulletOptimizationResponse, variables) => {
      queryClient.setQueryData(optimizationQueryKeys.session(data.sessionId), {
        suggestions: data.suggestions.map((s) => ({ suggestion: s, sessionId: data.sessionId })),
      });
      queryClient.invalidateQueries({
        queryKey: optimizationQueryKeys.sessions(variables.resumeId),
      });
    },
  });
}

export function useAcceptSuggestion(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { sessionId: string; suggestionId: string; editedText?: string }) =>
      optimizationApi.accept(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: optimizationQueryKeys.session(variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: optimizationQueryKeys.sessions(resumeId),
      });
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["versions", "list", resumeId] });
      queryClient.invalidateQueries({ queryKey: ["versions"] });
    },
  });
}

export function useRejectSuggestion(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { sessionId: string; suggestionId: string; reason?: string }) =>
      optimizationApi.reject(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: optimizationQueryKeys.session(variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: optimizationQueryKeys.sessions(resumeId),
      });
    },
  });
}

export function useOptimizationSessions(resumeId: string) {
  return useQuery({
    queryKey: optimizationQueryKeys.sessions(resumeId),
    queryFn: () => optimizationApi.getSessions(resumeId),
    enabled: !!resumeId,
  });
}

export function useOptimizationHistory(resumeId: string) {
  return useQuery({
    queryKey: optimizationQueryKeys.history(resumeId),
    queryFn: () => optimizationApi.getHistory(resumeId),
    enabled: !!resumeId,
  });
}

export function useReanalyze() {
  return useMutation({
    mutationFn: (data: {
      resumeId: string;
      sessionId: string;
      jobDescription: string;
      jobTitle?: string;
      company?: string;
    }) => optimizationApi.reanalyze(data),
  });
}

export function useTailoringOpportunities() {
  return useMutation({
    mutationFn: (data: {
      resumeId?: string;
      versionId?: string;
      jobDescription: string;
      jobTitle?: string;
      company?: string;
      content?: Record<string, unknown>;
      maxOpportunities?: number;
      knownFactKeys?: string[];
      declinedRequirementIds?: string[];
    }) => tailoringEvidenceApi.opportunities(data),
  });
}

export function useRespondTailoringEvidence() {
  return useMutation({
    mutationFn: (data: {
      resumeId?: string;
      versionId?: string;
      jobDescription: string;
      jobTitle?: string;
      company?: string;
      content?: Record<string, unknown>;
      opportunities: TailoringOpportunityCard[];
      selectedIds: string[];
      freeText: string;
      contextHints?: Record<string, string>;
    }) => tailoringEvidenceApi.respond(data),
  });
}
