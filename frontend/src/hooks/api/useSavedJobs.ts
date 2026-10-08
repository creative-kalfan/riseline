import { useQuery } from "@tanstack/react-query";
import { jobsApi } from "../../api/jobs";
import { jobsQueryKeys } from "./useJobs";
import type { Job } from "../../types/jobs";

export function useSavedJobs() {
  return useQuery<Job[]>({
    queryKey: jobsQueryKeys.saved,
    queryFn: () => jobsApi.getSavedJobs(),
    staleTime: 1000 * 60 * 2,
  });
}
