import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { jobsApi } from "../../api/jobs";
import type { JobSearchFilters, JobSearchResponse } from "../../types/jobs";
import { jobsQueryKeys } from "./useJobs";

export function useSearchJobs(filters: JobSearchFilters = {}) {
  return useQuery<JobSearchResponse>({
    queryKey: ["jobs", "search", filters],
    queryFn: ({ signal }) => jobsApi.searchJobs(filters, signal),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
}

export { jobsQueryKeys };
