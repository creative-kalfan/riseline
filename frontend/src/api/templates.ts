import { request } from "../utils/request";
import { API_ENDPOINTS } from "../constants/api";
import { ApiClientError } from "../utils/api-error";
import type { ResumeTemplate, ResumeTemplateListResponse } from "../types/resume";

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

export type TemplateApi = {
  list: () => Promise<ResumeTemplateListResponse>;
  get: (id: string) => Promise<ResumeTemplate>;
};

export const templateApi: TemplateApi = {
  list: async () => {
    const res = await request<BackendResponse<ResumeTemplate[]>>({
      method: "GET",
      path: API_ENDPOINTS.TEMPLATES.LIST,
    });
    const templates = res.data ?? [];
    const meta = res.meta ?? {
      page: 1,
      pageSize: templates.length || 20,
      total: templates.length,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    };
    return {
      templates,
      total: meta.total,
      page: meta.page,
      pageSize: meta.pageSize,
      totalPages: meta.totalPages,
    };
  },

  get: async (id: string) => {
    const res = await request<BackendResponse<ResumeTemplate>>({
      method: "GET",
      path: API_ENDPOINTS.TEMPLATES.GET(id),
    });
    return res.data;
  },
};
