import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "../../api/jobs";
import { jobsQueryKeys } from "./useJobs";
import type { Job } from "../../types/jobs";

export function useSaveJob() {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (jobId: string) => jobsApi.saveJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsQueryKeys.saved });
    },
    // Optimistically mark the job as bookmarked in every cached list.
    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: jobsQueryKeys.all });
      const previous = queryClient.getQueriesData<{ jobs: Job[] }>({
        queryKey: jobsQueryKeys.all,
      });
      queryClient.setQueriesData<{ jobs: Job[] }>({ queryKey: jobsQueryKeys.all }, (old) => {
        if (!old) return old;
        return {
          ...old,
          jobs: old.jobs.map((j) =>
            j.id === jobId ? { ...j, bookmarked: true, status: "saved" } : j,
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _jobId, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
  });

  const unsave = useMutation({
    mutationFn: (jobId: string) => jobsApi.unsaveJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobsQueryKeys.saved });
    },
    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: jobsQueryKeys.all });
      const previous = queryClient.getQueriesData<{ jobs: Job[] }>({
        queryKey: jobsQueryKeys.all,
      });
      queryClient.setQueriesData<{ jobs: Job[] }>({ queryKey: jobsQueryKeys.all }, (old) => {
        if (!old) return old;
        return {
          ...old,
          jobs: old.jobs.map((j) =>
            j.id === jobId ? { ...j, bookmarked: false, status: "not_applied" } : j,
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _jobId, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
  });

  return {
    saveJob: save.mutate,
    unsaveJob: unsave.mutate,
    saveJobAsync: save.mutateAsync,
    unsaveJobAsync: unsave.mutateAsync,
    isSaving: save.isPending,
    isUnsaving: unsave.isPending,
  };
}
