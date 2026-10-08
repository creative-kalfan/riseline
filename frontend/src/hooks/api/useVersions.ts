import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { versionsApi } from "../../api/versions";
import type {
  ResumeVersion,
  CreateVersionRequest,
  UpdateVersionRequest,
  ApplyVersionOperationRequest,
} from "../../types/version";

export const versionQueryKeys = {
  all: ["versions"] as const,
  list: (resumeId: string) => ["versions", "list", resumeId] as const,
  get: (versionId: string) => ["versions", "get", versionId] as const,
  diff: (versionId: string) => ["versions", "diff", versionId] as const,
};

export function useVersions(resumeId: string) {
  return useQuery({
    queryKey: versionQueryKeys.list(resumeId),
    queryFn: () => versionsApi.list(resumeId),
    enabled: !!resumeId,
    staleTime: 120_000,
  });
}

export function useVersion(versionId: string) {
  return useQuery({
    queryKey: versionQueryKeys.get(versionId),
    queryFn: () => versionsApi.get(versionId),
    enabled: !!versionId,
    staleTime: 120_000,
  });
}

export function useCreateVersion(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVersionRequest) => versionsApi.create(resumeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: versionQueryKeys.list(resumeId) });
    },
  });
}

export function useApplyVersionOperation(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId, data }: { versionId: string; data: ApplyVersionOperationRequest }) =>
      versionsApi.applyOperation(versionId, data),
    onSuccess: (_, { versionId }) => {
      queryClient.invalidateQueries({ queryKey: versionQueryKeys.get(versionId) });
      queryClient.invalidateQueries({ queryKey: versionQueryKeys.list(resumeId) });
    },
  });
}

export function useUpdateVersion(versionId: string, resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateVersionRequest) => versionsApi.update(versionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: versionQueryKeys.get(versionId) });
      queryClient.invalidateQueries({ queryKey: versionQueryKeys.list(resumeId) });
    },
  });
}

export function useDeleteVersion(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => versionsApi.delete(versionId),
    onSuccess: (_, versionId) => {
      queryClient.invalidateQueries({ queryKey: versionQueryKeys.list(resumeId) });
      queryClient.removeQueries({ queryKey: versionQueryKeys.get(versionId) });
    },
  });
}

export function useDuplicateVersion(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId, newName }: { versionId: string; newName?: string }) =>
      versionsApi.duplicate(versionId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: versionQueryKeys.list(resumeId) });
    },
  });
}

export function useSetMasterVersion(versionId: string, resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => versionsApi.setMaster(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: versionQueryKeys.list(resumeId) });
      queryClient.invalidateQueries({ queryKey: versionQueryKeys.get(versionId) });
    },
  });
}

export function useVersionDiff(versionId: string) {
  return useQuery({
    queryKey: versionQueryKeys.diff(versionId),
    queryFn: () => versionsApi.diff(versionId),
    enabled: !!versionId,
  });
}
