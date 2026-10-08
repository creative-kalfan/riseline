import { request } from "../utils/request";
import { apiConfig } from "./config";
import { API_ENDPOINTS } from "../constants/api";
import { ApiClientError } from "../utils/api-error";

export type AtsAnalysisResult = {
  overall_score: number;
  keyword_match_score: number;
  skills_match_score: number;
  experience_relevance_score: number;
  qualification_match_score: number;
  structure_format_score: number;
  // Backend returns these as snake_case (see app/models/ats.py ATSAnalysisResult).
  // Optional to stay tolerant of older persisted reports that may omit them.
  matched_keywords?: string[];
  missing_keywords?: string[];
  matched_skills?: string[];
  missing_skills?: string[];
  recommendations: string[];
  // Fields the backend already returns but were not previously surfaced in the
  // frontend type. All optional to stay tolerant of older persisted reports.
  partial_keywords?: string[];
  partial_skills?: string[];
  analysis_explanation?: {
    overall?: string;
    keyword?: string;
    skills?: string;
    experience?: string;
    qualification?: string;
    structure?: string;
    semantic_reasoning?: string;
  };
  high_priority_recommendations?: string[];
  medium_priority_recommendations?: string[];
  low_priority_recommendations?: string[];
  template_analysis?: {
    layout?: string;
    is_ats_friendly?: boolean;
    compatibility_rating?: string;
  };
  section_analysis?: {
    contact_info?: boolean;
    skills_present?: boolean;
    experience_present?: boolean;
    education_present?: boolean;
    projects_present?: boolean;
  };
  requirement_coverage?: AtsRequirementCoverage[];
  scoring_version?: string;
  semantic_metadata?: {
    semantic_available?: boolean;
    semantic_success?: boolean;
    semantic_model?: string;
    semantic_provider?: string;
    semantic_latency_ms?: number;
    reconciled_count?: number;
    semantic_upgrades?: number;
    semantic_overrides?: number;
  };
};

export type AtsRequirementCoverage = {
  requirement?: string;
  requirement_type?: string;
  category?: string;
  importance?: string;
  status?: string;
  job_evidence?: string;
  resume_evidence?: string[];
  evidence_level?: string;
  evidence_sources?: string[];
  deterministic_status?: string;
  evidence_source_section?: string;
  evidence_explanation?: string;
  semantic_status?: string;
  semantic_confidence?: number;
  semantic_evidence?: string;
  semantic_reasoning?: string;
  semantic_evidence_strength?: string;
  reasoning_source?: string;
};

export type AtsReport = {
  id: string;
  resumeId: string;
  jobDescription: string;
  atsScore: number;
  skillMatchScore: number;
  keywordMatchScore: number;
  semanticSimilarityScore: number;
  missingSkills: string[];
  missingKeywords: string[];
  matchedSkills: string[];
  matchedKeywords: string[];
  recommendations: string[];
  engineVersion: string;
  createdAt: string;
};

export type AnalyzeResumeResponse = {
  result: AtsAnalysisResult;
  report?: AtsReport;
};

export type AtsApi = {
  analyze: (data: {
    resumeId: string;
    versionId?: string;
    jobDescription: string;
    jobTitle?: string;
    company?: string;
    persist?: boolean;
  }) => Promise<AnalyzeResumeResponse>;
};

export const atsApi: AtsApi = {
  analyze: async ({ resumeId, versionId, jobDescription, jobTitle, company, persist = true }) => {
    const res = await request<AnalyzeResumeResponse>({
      method: "POST",
      path: API_ENDPOINTS.ATS.ANALYZE,
      body: { resumeId, versionId, jobDescription, jobTitle, company, persist },
    });
    return res;
  },
};
