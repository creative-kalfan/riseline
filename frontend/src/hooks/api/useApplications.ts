import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "../../api/applications";
import { transformApplication, transformApplications, computeStats } from "../../lib/applications";
import type { ApplicationUI, StatsUI } from "../../lib/applications";
import type {
  ApplicationChildKind,
  ApplicationStatus,
  CreateApplicationRequest,
} from "../../types/application";

export const applicationQueryKeys = {
  all: ["applications"] as const,
  list: ["applications", "list"] as const,
  detail: (id: string) => ["applications", "detail", id] as const,
  stats: ["applications", "stats"] as const,
};

/** Invalidate every application-derived query after a successful mutation. */
function invalidateApplicationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: applicationQueryKeys.all });
}

/**
 * Hook to fetch all applications.
 * Returns transformed UI-ready application data.
 */
export function useApplications() {
  return useQuery({
    queryKey: applicationQueryKeys.list,
    queryFn: async () => {
      const response = await applicationsApi.getAll();
      return transformApplications(response.applications);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch application stats.
 */
export function useApplicationStats() {
  const query = useApplications();

  return useQuery<StatsUI>({
    queryKey: applicationQueryKeys.stats,
    queryFn: () => {
      // Compute stats from the list query cache if available
      const apps = query.data ?? [];
      return computeStats(apps);
    },
    enabled: query.isSuccess,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook to fetch a single application by ID.
 */
export function useApplication(id: string | null) {
  return useQuery({
    queryKey: applicationQueryKeys.detail(id ?? ""),
    queryFn: async () => {
      const app = await applicationsApi.getById(id as string);
      return transformApplication(app);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new application.
 */
export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation<ApplicationUI, Error, CreateApplicationRequest>({
    mutationFn: async (data) => {
      const app = await applicationsApi.create(data);
      return transformApplication(app);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.list });
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.stats });
    },
  });
}

/**
 * Hook to update application status.
 */
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; status: ApplicationStatus }>({
    mutationFn: ({ id, status }) => applicationsApi.updateStatus({ id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.list });
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.stats });
    },
  });
}

/**
 * Hook to delete an application with optimistic removal.
 */
export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previous?: ApplicationUI[] }>({
    mutationFn: (id: string) => applicationsApi.delete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: applicationQueryKeys.list });
      const previous = queryClient.getQueryData<ApplicationUI[]>(applicationQueryKeys.list);
      if (previous) {
        queryClient.setQueryData<ApplicationUI[]>(
          applicationQueryKeys.list,
          previous.filter((app) => app.id !== id),
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(applicationQueryKeys.list, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.list });
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.stats });
    },
  });
}

/**
 * Track a real job as an application (Job → Application bridge).
 * The backend persists the application and returns it; nothing is local-only.
 */
export function useApplyToJob() {
  const queryClient = useQueryClient();

  return useMutation<ApplicationUI, Error, string>({
    mutationFn: async (jobId: string) => {
      const app = await applicationsApi.applyToJob(jobId);
      return transformApplication(app);
    },
    onSuccess: () => {
      invalidateApplicationQueries(queryClient);
    },
  });
}

/** Favorite / unfavorite an application. */
export function useSetApplicationFavorite() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; favorite: boolean }>({
    mutationFn: ({ id, favorite }) =>
      applicationsApi.setFavorite(id, favorite).then(() => undefined),
    onSuccess: () => invalidateApplicationQueries(queryClient),
  });
}

/** Archive / unarchive an application (persists across refresh). */
export function useSetApplicationArchived() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; archived: boolean }>({
    mutationFn: ({ id, archived }) =>
      applicationsApi.setArchived(id, archived).then(() => undefined),
    onSuccess: () => invalidateApplicationQueries(queryClient),
  });
}

/** Add an interview / assessment / contact / follow-up to an application. */
export function useAddApplicationChild() {
  const queryClient = useQueryClient();

  return useMutation<
    Record<string, unknown>,
    Error,
    { applicationId: string; kind: ApplicationChildKind; data: Record<string, unknown> }
  >({
    mutationFn: ({ applicationId, kind, data }) =>
      applicationsApi.addChild(applicationId, kind, data),
    onSuccess: () => invalidateApplicationQueries(queryClient),
  });
}

/** Update an existing child entity (e.g. mark a follow-up completed). */
export function useUpdateApplicationChild() {
  const queryClient = useQueryClient();

  return useMutation<
    Record<string, unknown>,
    Error,
    {
      applicationId: string;
      kind: ApplicationChildKind;
      childId: string;
      data: Record<string, unknown>;
    }
  >({
    mutationFn: ({ applicationId, kind, childId, data }) =>
      applicationsApi.updateChild(applicationId, kind, childId, data),
    onSuccess: () => invalidateApplicationQueries(queryClient),
  });
}

/** Delete a child entity. */
export function useDeleteApplicationChild() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { applicationId: string; kind: ApplicationChildKind; childId: string }
  >({
    mutationFn: ({ applicationId, kind, childId }) =>
      applicationsApi.deleteChild(applicationId, kind, childId),
    onSuccess: () => invalidateApplicationQueries(queryClient),
  });
}
