import { request } from "../utils/request";
import { API_ENDPOINTS } from "../constants/api";
import { adaptJob } from "../lib/jobs";
import type {
  Job,
  JobMatchResponse,
  JobSearchFilters,
  JobSearchResponse,
  NormalizedJob,
  SavedJobRecord,
} from "../types/jobs";

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

export type JobsApi = {
  getJobs: (params?: JobSearchFilters, signal?: AbortSignal) => Promise<JobSearchResponse>;
  searchJobs: (params?: JobSearchFilters, signal?: AbortSignal) => Promise<JobSearchResponse>;
  getPersonalizedJobs: (
    params?: JobSearchFilters & { includeAts?: boolean },
    signal?: AbortSignal,
  ) => Promise<JobSearchResponse>;
  getJob: (id: string, signal?: AbortSignal) => Promise<Job>;
  saveJob: (jobId: string) => Promise<{ savedJob: SavedJobRecord }>;
  unsaveJob: (jobId: string) => Promise<void>;
  getSavedJobs: () => Promise<Job[]>;
  matchJobs: (params: {
    job: NormalizedJob;
    resumeText?: string;
    jobId?: string;
  }) => Promise<JobMatchResponse>;
};

// Backend response envelope: { success, data, meta? }
type BackendResponse<T> = {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
};

function toQueryString(params: JobSearchFilters): string {
  const sp = new URLSearchParams();
  if (params.role) sp.set("role", params.role);
  if (params.location) sp.set("location", params.location);
  if (params.company) sp.set("company", params.company);
  if (params.skills?.length) sp.set("skills", params.skills.join(","));
  if (params.experience) sp.set("experience", params.experience);
  if (params.remote !== undefined) sp.set("remote", String(params.remote));
  if (params.employmentType) sp.set("employmentType", params.employmentType);
  if (params.sort) sp.set("sort", params.sort);
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  if (params.verifiedLiveOnly !== undefined) sp.set("verified_live_only", String(params.verifiedLiveOnly));
  const qs = sp.toString();

  return qs ? `?${qs}` : "";
}

function mapSearchResult(
  jobs: NormalizedJob[],
  meta?: BackendResponse<unknown>["meta"],
): JobSearchResponse {
  const totalPages = meta?.totalPages ?? 1;
  return {
    jobs: jobs.map((raw) => adaptJob(raw)),
    total: meta?.total ?? 0,
    page: meta?.page ?? 1,
    pageSize: meta?.pageSize ?? 20,
    totalPages,
    hasNext: meta?.hasNext ?? false,
    hasPrevious: meta?.hasPrevious ?? (meta ? meta.page > 1 : false),
    hasMore: meta?.hasNext ?? false,
  };
}

export const jobsApi: JobsApi = {
  getJobs: async (params?: JobSearchFilters, signal?: AbortSignal) => {
    const res = await request<BackendResponse<NormalizedJob[]>>({
      method: "GET",
      path: `${API_ENDPOINTS.JOBS.LIST}${toQueryString(params ?? {})}`,
      signal,
    });
    return mapSearchResult(res.data, res.meta);
  },

  searchJobs: async (params?: JobSearchFilters, signal?: AbortSignal) => {
    const res = await request<BackendResponse<NormalizedJob[]>>({
      method: "POST",
      path: API_ENDPOINTS.JOBS.SEARCH,
      body: params ?? {},
      signal,
    });
    return mapSearchResult(res.data, res.meta);
  },

  getJob: async (id: string, signal?: AbortSignal) => {
    const res = await request<BackendResponse<NormalizedJob | { job: NormalizedJob }>>({
      method: "GET",
      path: API_ENDPOINTS.JOBS.GET(id),
      signal,
    });
    const raw = (res.data as { job?: NormalizedJob })?.job ?? (res.data as NormalizedJob);
    return adaptJob(raw);
  },

  saveJob: async (jobId: string) => {
    const res = await request<BackendResponse<{ savedJob: SavedJobRecord }>>({
      method: "POST",
      path: API_ENDPOINTS.JOBS.SAVE,
      body: { jobId },
    });
    return res.data;
  },

  unsaveJob: async (jobId: string) => {
    await request<BackendResponse<void>>({
      method: "DELETE",
      path: API_ENDPOINTS.JOBS.UNSAVE(jobId),
    });
  },

  getSavedJobs: async () => {
    const res = await request<BackendResponse<SavedJobRecord[] | { savedJobs: SavedJobRecord[] }>>({
      method: "GET",
      path: API_ENDPOINTS.JOBS.SAVED,
    });
    // Backend returns the raw array; older clients expect { savedJobs }.
    const records = Array.isArray(res.data)
      ? res.data
      : ((res.data as { savedJobs?: SavedJobRecord[] })?.savedJobs ?? []);
    return records
      .map((record) => {
        const raw = Array.isArray(record.jobs) ? record.jobs[0] : record.jobs;
        if (!raw) return null;
        return adaptJob(raw, { bookmarked: true });
      })
      .filter((job): job is Job => job !== null);
  },

  matchJobs: async ({ resumeText, job, jobId }) => {
    const res = await request<BackendResponse<JobMatchResponse>>({
      method: "POST",
      path: API_ENDPOINTS.JOBS.MATCH,
      // resumeText is optional: the backend scores against the stored user
      // profile, so the client must not fabricate empty resume text.
      body: { job, ...(jobId ? { jobId } : {}), ...(resumeText ? { resumeText } : {}) },
    });
    return res.data;
  },

  getPersonalizedJobs: async (
    params?: JobSearchFilters & { includeAts?: boolean },
    signal?: AbortSignal,
  ) => {
    const qs = toQueryString(params ?? {});
    const sp = new URLSearchParams(qs.replace(/^\?/, ""));
    if (params?.includeAts) sp.set("includeAts", "true");
    const finalQs = sp.toString();
    // The personalized endpoint now returns the standard { success, data, meta }
    // envelope — same as getJobs() and searchJobs(). adaptJob() preserves the
    // optional match/ATS score fields from the raw job objects.
    const res = await request<BackendResponse<NormalizedJob[]>>({
      method: "GET",
      path: `${API_ENDPOINTS.JOBS.PERSONALIZED}${finalQs ? `?${finalQs}` : ""}`,
      signal,
    });
    return mapSearchResult(res.data, res.meta);
  },
};
