import { request } from "../utils/request";
import { API_ENDPOINTS } from "../constants/api";
import { apiConfig } from "./config";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "../types/api/index.ts";

export type DashboardStats = {
  totalResumes: number;
  totalApplications: number;
  totalSavedJobs: number;
  atsAnalysesCount: number;
  profileCompletion: number;
};

export type ActivityItem = {
  id: string;
  type:
    "resume_created" | "application_submitted" | "ats_analysis" | "job_saved" | "recommendation";
  title: string;
  description: string;
  timestamp: string;
  metadata: Record<string, unknown>;
};

export type DashboardApi = {
  getStats: () => Promise<ApiResponse<DashboardStats>>;
  getRecentActivity: (
    params?: PaginationParams,
  ) => Promise<ApiResponse<PaginatedResponse<ActivityItem>>>;
  getWeeklyProgress: () => Promise<
    ApiResponse<{
      applicationsSubmitted: number[];
      atsScores: number[];
      labels: string[];
    }>
  >;
};

export const dashboardApi: DashboardApi = {
  getStats: async () => {
    // TODO: Implement API call
    throw new Error("Not implemented");
  },

  getRecentActivity: async (params?: PaginationParams) => {
    // TODO: Implement API call
    throw new Error("Not implemented");
  },

  getWeeklyProgress: async () => {
    // TODO: Implement API call
    throw new Error("Not implemented");
  },
};

// ─── Live telemetry (GET /api/dashboard) ───────────────────────────────
// Matches the backend SuccessResponse envelope
// ({ success: true, data: {...} }) from app/schemas/dashboard.py.

export type TelemetryTimelineItem = {
  action: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type DashboardTelemetry = {
  total_resumes: number;
  tailored_versions: number;
  applications_tracked: number;
  average_ats_score: number | null;
  active_jobs_in_queue: number;
  activity_timeline: TelemetryTimelineItem[];
};

export type DashboardTelemetryEnvelope = {
  success: boolean;
  data: DashboardTelemetry;
};

export async function fetchDashboardTelemetry(): Promise<DashboardTelemetryEnvelope> {
  return request<DashboardTelemetryEnvelope>({
    method: "GET",
    path: API_ENDPOINTS.DASHBOARD.TELEMETRY,
  });
}
