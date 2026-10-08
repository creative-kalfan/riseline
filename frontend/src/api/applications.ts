import { request } from "../utils/request";
import { API_ENDPOINTS } from "../constants/api";
import type {
  Application,
  ApplicationChildKind,
  ApplicationListResponse,
  ApplicationStats,
  CreateApplicationRequest,
  UpdateApplicationStatusRequest,
} from "../types/application";

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

export type ApplicationsApi = {
  getAll: () => Promise<ApplicationListResponse>;
  getById: (id: string) => Promise<Application>;
  create: (data: CreateApplicationRequest) => Promise<Application>;
  updateStatus: (data: UpdateApplicationStatusRequest) => Promise<void>;
  delete: (id: string) => Promise<void>;
  getStats: () => Promise<ApplicationStats>;
  setFavorite: (id: string, favorite: boolean) => Promise<Application>;
  setArchived: (id: string, archived: boolean) => Promise<Application>;
  addChild: (
    applicationId: string,
    kind: ApplicationChildKind,
    data: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  updateChild: (
    applicationId: string,
    kind: ApplicationChildKind,
    childId: string,
    data: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  deleteChild: (
    applicationId: string,
    kind: ApplicationChildKind,
    childId: string,
  ) => Promise<void>;
  applyToJob: (jobId: string) => Promise<Application>;
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

export const applicationsApi: ApplicationsApi = {
  getAll: async () => {
    const res = await request<BackendResponse<Application[]>>({
      method: "GET",
      path: API_ENDPOINTS.APPLICATIONS.LIST,
    });
    return {
      applications: res.data,
      total: res.meta?.total ?? res.data.length,
    };
  },

  getById: async (id: string) => {
    const res = await request<BackendResponse<Application>>({
      method: "GET",
      path: API_ENDPOINTS.APPLICATIONS.GET(id),
    });
    return res.data;
  },

  create: async (data: CreateApplicationRequest) => {
    const res = await request<BackendResponse<Application>>({
      method: "POST",
      path: API_ENDPOINTS.APPLICATIONS.CREATE,
      body: data,
    });
    return res.data;
  },

  updateStatus: async ({ id, status }: UpdateApplicationStatusRequest) => {
    await request<BackendResponse<void>>({
      method: "PATCH",
      path: API_ENDPOINTS.APPLICATIONS.STATUS(id),
      body: { status },
    });
  },

  delete: async (id: string) => {
    await request<BackendResponse<void>>({
      method: "DELETE",
      path: API_ENDPOINTS.APPLICATIONS.DELETE(id),
    });
  },

  getStats: async () => {
    const res = await request<BackendResponse<ApplicationStats>>({
      method: "GET",
      path: API_ENDPOINTS.APPLICATIONS.STATS,
    });
    return res.data;
  },

  setFavorite: async (id: string, favorite: boolean) => {
    const res = await request<BackendResponse<Application>>({
      method: "POST",
      path: API_ENDPOINTS.APPLICATIONS.FAVORITE(id),
      body: { favorite },
    });
    return res.data;
  },

  setArchived: async (id: string, archived: boolean) => {
    const res = await request<BackendResponse<Application>>({
      method: "POST",
      path: API_ENDPOINTS.APPLICATIONS.ARCHIVE(id),
      body: { archived },
    });
    return res.data;
  },

  addChild: async (
    applicationId: string,
    kind: ApplicationChildKind,
    data: Record<string, unknown>,
  ) => {
    const res = await request<BackendResponse<Record<string, unknown>>>({
      method: "POST",
      path: API_ENDPOINTS.APPLICATIONS.CHILD(applicationId, kind),
      body: data,
    });
    return res.data;
  },

  updateChild: async (
    applicationId: string,
    kind: ApplicationChildKind,
    childId: string,
    data: Record<string, unknown>,
  ) => {
    const res = await request<BackendResponse<Record<string, unknown>>>({
      method: "PATCH",
      path: API_ENDPOINTS.APPLICATIONS.CHILD_ITEM(applicationId, kind, childId),
      body: data,
    });
    return res.data;
  },

  deleteChild: async (applicationId: string, kind: ApplicationChildKind, childId: string) => {
    await request<BackendResponse<void>>({
      method: "DELETE",
      path: API_ENDPOINTS.APPLICATIONS.CHILD_ITEM(applicationId, kind, childId),
    });
  },

  applyToJob: async (jobId: string) => {
    const res = await request<BackendResponse<Application>>({
      method: "POST",
      path: API_ENDPOINTS.JOBS.APPLY(jobId),
    });
    return res.data;
  },
};
