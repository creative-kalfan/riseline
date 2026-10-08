import type { ResumeRecordMeta } from "./resume";

export type ResumeVersion = {
  id: string;
  resume_id: string;
  version_name: string;
  source: string;
  content: Record<string, unknown>;
  target_job_title?: string | null;
  target_company?: string | null;
  target_job_id?: string | null;
  target_job_url?: string | null;
  job_description?: string | null;
  template?: string;
  status: string;
  is_master: boolean;
  parent_version_id?: string | null;
  meta?: ResumeRecordMeta | null;
  last_ats_score?: number | null;
  last_analyzed_at?: string | null;
  sections_config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CreateVersionRequest = {
  version_name: string;
  parent_version_id?: string | null;
  target_job_title?: string;
  target_company?: string;
  target_job_id?: string;
  target_job_url?: string;
  job_description?: string;
  template?: string;
  source?: string;
  content?: Record<string, unknown>;
  sections_config?: Record<string, unknown>;
};

export type ApplyVersionOperationRequest = {
  operation: "replace" | "insert" | "delete";
  section: string;
  target_id?: string;
  replacement?: Record<string, unknown>;
  reason?: string;
  source?: string;
  child_id?: string;
  child_text?: string;
};

export type UpdateVersionRequest = {
  version_name?: string;
  target_job_title?: string;
  target_company?: string;
  target_job_id?: string;
  target_job_url?: string;
  job_description?: string;
  template?: string;
  status?: string;
  content?: Record<string, unknown>;
  sections_config?: Record<string, unknown>;
  last_ats_score?: number;
  last_analyzed_at?: string;
};

export type VersionDiff = {
  changed: string[];
  unchanged: string[];
};
