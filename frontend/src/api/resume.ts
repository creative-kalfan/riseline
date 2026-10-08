import { request } from "../utils/request";
import { API_ENDPOINTS } from "../constants/api";
import { ApiClientError } from "../utils/api-error";
import { supabase } from "../lib/supabase";
import { adaptResumeListRecord, buildResumeData } from "../lib/resume";
import type {
  ResumeData,
  ResumeListResponse,
  ResumeRecord,
  ResumeContentV2,
  ResumeProfile,
  ResumeMeta,
  CompletenessResponseData,
  UploadResumeResponse,
  ParseResumeResponse,
} from "../types/resume";

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

/** Shape of the backend's ResumeListResponse data object. */
type ResumeListData = {
  resumes: ResumeRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

/**
 * Upload the file to Supabase Storage directly from the browser using the
 * authenticated supabase-js client (the same one used for auth state).
 *
 * The actual PDF/DOCX bytes go from the Browser → Supabase Storage. They
 * NEVER pass through FastAPI. After the upload succeeds, we return the
 * storage_path (e.g. "{user_id}/{uuid}.pdf") which the backend will use to
 * register + parse the resume.
 *
 * @returns the storage path of the uploaded object.
 */
async function uploadFileToStorage(file: File): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new ApiClientError({
      message: "You must be authenticated to upload a resume.",
      statusCode: 401,
      code: "UNAUTHENTICATED",
    });
  }

  const userId = session.user.id;
  const extension = file.name.includes(".")
    ? (file.name.split(".").pop()?.toLowerCase() ?? "pdf")
    : file.type === "application/pdf"
      ? "pdf"
      : "docx";

  const storagePath = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { data, error } = await supabase.storage.from("resumes").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return storagePath;
}

export type ResumeApi = {
  getAll: () => Promise<ResumeListResponse>;
  getById: (id: string) => Promise<ResumeData>;
  getResumeDetail: (id: string) => Promise<ResumeRecord>;
  create: (title: string) => Promise<ResumeData>;
  createResume: (title?: string) => Promise<ResumeRecord>;
  update: (
    id: string,
    data: { title?: string; content?: Record<string, unknown> },
  ) => Promise<ResumeData>;
  updateResumeContent: (
    id: string,
    content: Record<string, unknown>,
    meta?: Record<string, unknown>,
  ) => Promise<ResumeRecord>;
  delete: (id: string) => Promise<void>;
  upload: (file: File, title?: string, skipParse?: boolean) => Promise<UploadResumeResponse>;
  uploadResume: (file: File, title?: string) => Promise<ResumeRecord>;
  parse: (id: string) => Promise<ParseResumeResponse>;
  parseResume: (id: string) => Promise<ParseResumeResponse>;
  getCompleteness: (id: string) => Promise<CompletenessResponseData>;
};

export const resumeApi: ResumeApi = {
  getAll: async () => {
    const res = await request<BackendResponse<ResumeListData>>({
      method: "GET",
      path: API_ENDPOINTS.RESUME.LIST,
    });
    const records = res.data?.resumes ?? [];
    const resumes = records.map(adaptResumeListRecord);
    return {
      resumes,
      total: res.data?.total ?? resumes.length,
      page: res.data?.page ?? 1,
      pageSize: res.data?.page_size ?? (resumes.length || 20),
      totalPages: res.data?.total_pages ?? 1,
    };
  },

  getById: async (id: string) => {
    const res = await request<BackendResponse<ResumeRecord>>({
      method: "GET",
      path: API_ENDPOINTS.RESUME.GET(id),
    });
    return buildResumeData(res.data, res.data.content);
  },

  getResumeDetail: async (id: string) => {
    const res = await request<BackendResponse<ResumeRecord>>({
      method: "GET",
      path: API_ENDPOINTS.RESUME.GET(id),
    });
    return res.data;
  },

  create: async (title: string) => {
    const res = await request<BackendResponse<ResumeRecord>>({
      method: "POST",
      path: API_ENDPOINTS.RESUME.CREATE,
      body: { title },
    });
    return buildResumeData(res.data, res.data.content);
  },

  createResume: async (title?: string) => {
    const res = await request<BackendResponse<ResumeRecord>>({
      method: "POST",
      path: API_ENDPOINTS.RESUME.CREATE,
      body: { title },
    });
    return res.data;
  },

  update: async (id: string, data: { title?: string; content?: Record<string, unknown> }) => {
    const res = await request<BackendResponse<ResumeRecord>>({
      method: "PATCH",
      path: API_ENDPOINTS.RESUME.UPDATE(id),
      body: data,
    });
    return buildResumeData(res.data, res.data.content);
  },

  updateResumeContent: async (
    id: string,
    content: Record<string, unknown>,
    meta?: Record<string, unknown>,
  ) => {
    const body: Record<string, unknown> = { content };
    if (meta) body.meta = meta;
    const res = await request<BackendResponse<ResumeRecord>>({
      method: "PATCH",
      path: API_ENDPOINTS.RESUME.UPDATE(id),
      body,
    });
    return res.data;
  },

  delete: async (id: string) => {
    await request<BackendResponse<void>>({
      method: "DELETE",
      path: API_ENDPOINTS.RESUME.DELETE(id),
    });
  },

  /**
   * Upload a resume file.
   *
   * Phase 1: upload the actual file bytes directly to Supabase Storage using
   *          the authenticated supabase-js client.
   * Phase 2: POST /api/resumes/register with ONLY the storage path.
   *          No file bytes pass through FastAPI.
   */
  upload: async (file: File, title?: string, skipParse = false) => {
    // Phase 1 — Direct browser → Supabase Storage upload.
    let storagePath: string;
    try {
      storagePath = await uploadFileToStorage(file);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't upload your resume to secure storage.";
      throw new ApiClientError({
        message,
        statusCode: 0,
        code: "STORAGE_UPLOAD_FAILED",
      });
    }

    // Phase 2 — POST /api/resumes/register with ONLY the storage path.
    let body: BackendResponse<UploadResumeResponse>;
    try {
      body = await request<BackendResponse<UploadResumeResponse>>({
        method: "POST",
        path: API_ENDPOINTS.RESUME.REGISTER,
        body: { storage_path: storagePath },
      });
    } catch (error) {
      // Storage succeeded but registration/parsing failed.
      const detail =
        error instanceof ApiClientError
          ? error.message
          : "Your file was uploaded, but we couldn't process the resume. Please try again.";
      throw new ApiClientError({
        message: detail,
        statusCode: error instanceof ApiClientError ? error.statusCode : 0,
        code: "REGISTER_FAILED",
      });
    }

    return {
      resume: body.data.resume,
      parse: body.data.parse ?? null,
    };
  },

  uploadResume: async (file: File, title?: string) => {
    const result = await resumeApi.upload(file, title, false);
    return result.resume;
  },

  parse: async (id: string) => {
    const res = await request<BackendResponse<ParseResumeResponse>>({
      method: "POST",
      path: API_ENDPOINTS.RESUME.PARSE(id),
    });
    return res.data;
  },

  parseResume: async (id: string) => {
    return resumeApi.parse(id);
  },

  getCompleteness: async (id: string) => {
    const res = await request<BackendResponse<CompletenessResponseData>>({
      method: "GET",
      path: API_ENDPOINTS.RESUME.COMPLETENESS(id),
    });
    return res.data;
  },
};
