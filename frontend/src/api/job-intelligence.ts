import { request } from "../utils/request";
import { API_ENDPOINTS } from "../constants/api";

export type JobIntelligence = {
  id?: string;
  jobId?: string;
  intelligenceVersion?: string;
  generatedAt?: string;
  seniority?: {
    level?: string | null;
    yearsMin?: number | null;
    yearsMax?: number | null;
    confidence?: string;
  };
  skills?: Array<{
    name: string;
    normalizedName: string;
    category?: string | null;
    importance?: string;
    evidence?: string;
    confidence?: string;
  }>;
  requirements?: Array<{
    text: string;
    type?: string;
    importance?: string;
    confidence?: string;
  }>;
  education?: Array<{
    degree?: string | null;
    field?: string | null;
    required?: boolean;
    confidence?: string;
  }>;
  certifications?: Array<{
    name: string;
    required?: boolean;
    confidence?: string;
  }>;
  keywords?: string[];
  responsibilities?: string[];
  industries?: string[];
  workArrangement?: {
    type?: string;
    confidence?: string;
  };
};

export type AnalyzeJobIntelligenceResponse = {
  success: boolean;
  jobId: string;
  analysisJobId?: string;
  status: string;
};

export type JobIntelligenceResponse = {
  status?: string;
} & JobIntelligence;

export function useAnalyzeJobIntelligence() {
  return async (jobId: string) => {
    const res = await request<{ success: boolean; data: AnalyzeJobIntelligenceResponse }>({
      method: "POST",
      path: API_ENDPOINTS.JOBS.INTELLIGENCE_ANALYZE(jobId),
    });
    return res.data;
  };
}

export function useGetJobIntelligence() {
  return async (jobId: string) => {
    const res = await request<{ success: boolean; data: JobIntelligenceResponse }>({
      method: "GET",
      path: API_ENDPOINTS.JOBS.INTELLIGENCE_GET(jobId),
    });
    return res.data;
  };
}
