import { useMutation } from "@tanstack/react-query";
import { jobsApi } from "../../api/jobs";
import type { JobMatchResponse, NormalizedJob } from "../../types/jobs";

export function useMatchJobs() {
  const mutation = useMutation<
    JobMatchResponse,
    Error,
    { job: NormalizedJob; resumeText?: string; jobId?: string }
  >({
    mutationFn: ({ resumeText, job, jobId }) => jobsApi.matchJobs({ resumeText, job, jobId }),
  });

  return {
    matchJob: mutation.mutate,
    matchJobAsync: mutation.mutateAsync,
    matchResult: mutation.data,
    isMatching: mutation.isPending,
    matchError: mutation.error,
    resetMatch: mutation.reset,
  };
}
