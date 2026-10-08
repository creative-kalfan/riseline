import { request } from "../utils/request";
import { API_ENDPOINTS } from "../constants/api";
import { LONG_REQUEST_TIMEOUT_MS } from "./config";
import type {
  CritiqueResponseRequest,
  CritiqueResponseResult,
  GenerateDrillsRequest,
  GenerateDrillsResponse,
  GeneratePrepRequest,
  InterviewPrepListResponse,
  InterviewPrepQuestion,
  InterviewPrepSession,
} from "../types/interview-prep";

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

export type InterviewPrepApi = {
  generate: (data: GeneratePrepRequest) => Promise<InterviewPrepSession>;
  generateDrills: (data: GenerateDrillsRequest) => Promise<GenerateDrillsResponse>;
  critique: (data: CritiqueResponseRequest) => Promise<CritiqueResponseResult>;
  list: (applicationId?: string) => Promise<InterviewPrepListResponse>;
  getById: (id: string) => Promise<InterviewPrepSession>;
  regenerate: (id: string) => Promise<InterviewPrepSession>;
  updateQuestion: (
    id: string,
    data: { is_prepared?: boolean; is_bookmarked?: boolean },
  ) => Promise<InterviewPrepQuestion>;
  listByApplication: (applicationId: string) => Promise<InterviewPrepSession[]>;
};

// Backend response envelope: { success, data, meta? }
type BackendResponse<T> = {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
  };
};

export const interviewPrepApi: InterviewPrepApi = {
  generate: async (data: GeneratePrepRequest) => {
    const res = await request<BackendResponse<InterviewPrepSession>>({
      method: "POST",
      path: API_ENDPOINTS.INTERVIEW_PREP.GENERATE,
      body: data,
      timeoutMs: LONG_REQUEST_TIMEOUT_MS,
    });
    return res.data;
  },

  generateDrills: async (data: GenerateDrillsRequest) => {
    const res = await request<BackendResponse<GenerateDrillsResponse>>({
      method: "POST",
      path: API_ENDPOINTS.INTERVIEW_PREP.GENERATE_DRILLS,
      body: data,
      timeoutMs: LONG_REQUEST_TIMEOUT_MS,
    });
    return res.data;
  },

  critique: async (data: CritiqueResponseRequest) => {
    const res = await request<BackendResponse<CritiqueResponseResult>>({
      method: "POST",
      path: API_ENDPOINTS.INTERVIEW_PREP.CRITIQUE,
      body: data,
      timeoutMs: LONG_REQUEST_TIMEOUT_MS,
    });
    return res.data;
  },

  list: async (applicationId?: string) => {
    const params = applicationId ? `?application_id=${encodeURIComponent(applicationId)}` : "";
    const res = await request<BackendResponse<InterviewPrepSession[]>>({
      method: "GET",
      path: `${API_ENDPOINTS.INTERVIEW_PREP.SESSIONS}${params}`,
    });
    return {
      sessions: res.data,
      total: res.meta?.total ?? res.data.length,
    };
  },

  getById: async (id: string) => {
    const res = await request<BackendResponse<InterviewPrepSession>>({
      method: "GET",
      path: API_ENDPOINTS.INTERVIEW_PREP.SESSION(id),
    });
    return res.data;
  },

  regenerate: async (id: string) => {
    const res = await request<BackendResponse<InterviewPrepSession>>({
      method: "POST",
      path: API_ENDPOINTS.INTERVIEW_PREP.REGENERATE(id),
    });
    return res.data;
  },

  updateQuestion: async (id, data) => {
    const res = await request<BackendResponse<InterviewPrepQuestion>>({
      method: "PATCH",
      path: API_ENDPOINTS.INTERVIEW_PREP.QUESTION(id),
      body: data,
    });
    return res.data;
  },

  listByApplication: async (applicationId: string) => {
    const res = await request<BackendResponse<InterviewPrepSession[]>>({
      method: "GET",
      path: API_ENDPOINTS.INTERVIEW_PREP.BY_APPLICATION(applicationId),
    });
    return res.data;
  },
};
