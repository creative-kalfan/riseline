import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { jobsApi } from "../../api/jobs";
import type { Job, JobSearchFilters, JobSearchResponse } from "../../types/jobs";
import { useAuth } from "../../auth/useAuth";

export const jobsQueryKeys = {
  all: ["jobs"] as const,
  list: (filters: JobSearchFilters) => ["jobs", "list", filters] as const,
  personalized: (filters: JobSearchFilters & { includeAts?: boolean }) =>
    ["jobs", "personalized", filters] as const,
  detail: (id: string) => ["jobs", "detail", id] as const,
  saved: ["jobs", "saved"] as const,
};

export function useJobs(filters: JobSearchFilters = {}) {
  return useQuery<JobSearchResponse>({
    queryKey: jobsQueryKeys.list(filters),
    queryFn: ({ signal }) => jobsApi.getJobs(filters, signal),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
}

export function usePersonalizedJobs(filters: JobSearchFilters & { includeAts?: boolean } = {}) {
  const { isAuthenticated, isInitialized } = useAuth();

  return useQuery<JobSearchResponse>({
    queryKey: jobsQueryKeys.personalized(filters),
    queryFn: ({ signal }) => jobsApi.getPersonalizedJobs(filters, signal),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
    enabled: isInitialized && isAuthenticated,
  });
}

export function useJob(id: string | null) {
  return useQuery<Job>({
    queryKey: jobsQueryKeys.detail(id ?? ""),
    queryFn: ({ signal }) => jobsApi.getJob(id as string, signal),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}
