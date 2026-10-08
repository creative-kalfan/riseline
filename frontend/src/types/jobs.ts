export type ApplicationStatus =
  "not_applied" | "saved" | "applied" | "interviewing" | "offer" | "rejected";

export type EmploymentType =
  "Full-time" | "Part-time" | "Contract" | "Internship" | "Not specified";
export type WorkMode = "Remote" | "Hybrid" | "On-site" | "Unknown";

// Rich UI-facing job shape consumed by the Jobs module components.
// It is produced by adapting the backend NormalizedJob DTO (see src/lib/jobs.ts).
export type Job = {
  id: string;
  role: string;
  company: string;
  companyLogo: string; // initials — fallback when no real logo is available
  companyLogoUrl?: string; // real logo image URL when the company is known
  companyBrand: string; // deterministic gradient token
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  experience: string;
  education?: string;
  salaryMin: number; // in thousands
  salaryMax: number; // in thousands
  salaryCurrency: string;
  aiMatch: number;
  atsMatch?: number;
  postedAt: string; // human label
  postedDaysAgo: number;
  quickApply: boolean;
  bookmarked: boolean;
  status: ApplicationStatus;
  techStack: string[];
  overview: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  recruiterNote?: string;
  matchedSkills: string[];
  missingSkills: string[];
  seniority: string;
  interviewProbability: number;
  keywordCompare: { keyword: string; inResume: boolean; inJob: boolean }[];
  marketSalary: { min: number; median: number; max: number };
  match?: {
    overall: number;
    skillMatch: number;
    resumeMatch: number;
    experienceMatch: number;
    locationMatch: number;
    salaryMatch: number;
    companyPreference: number;
    freshness: number;
    missingSkills: string[];
  };
  atsScore?: number;
  atsSkillMatch?: number;
  atsKeywordMatch?: number;
  atsMissingSkills?: string[];
  atsMissingKeywords?: string[];
  atsRecommendations?: string[];
  // New classification fields (migration 011)
  roleCategory?: string | null;
  applicationDeadline?: string | null;
  // Direct apply URL (mapped from backend NormalizedJob.applyUrl)
  applyUrl?: string | null;
  // Mass hiring campaign data
  massHiring?: "VERIFIED_MASS_HIRING" | "POSSIBLE_MASS_HIRING" | "NOT_MASS_HIRING" | string | null;
  massHiringStatus?: "ACTIVE" | "ENDING_SOON" | "EXPIRED" | "UNKNOWN" | string | null;
  massHiringDetails?: {
    confidence?: string;
    status?: string;
    signals_detected?: string[];
    vacancy_count?: number | null;
    deadline?: string | null;
    detected_at?: string;
  } | null;
  // Source platform & human-friendly provenance metadata
  sourcePlatform?: string | null;
  sourceProvenance?: {
    label: string;
    verified: boolean;
    type: "career_site" | "yc" | "direct" | "aggregator" | "general";
  };
  // Phase 6 Quality Intelligence
  isVerifiedLive?: boolean | null;
  ghostRisk?: {
    score?: number;
    level?: "low" | "medium" | "high";
    signals?: string[];
  } | null;
  alsoListedOn?: Array<{
    source: string;
    url?: string;
    first_seen?: string;
  }> | null;
  preferredApplyUrl?: string | null;
};


// ---------------------------------------------------------------------------
// Backend DTOs (mirror of careeros-backend-py/app/models/job.py)
// ---------------------------------------------------------------------------

export type NormalizedJob = {
  id?: string;
  externalJobId?: string | null;
  external_job_id?: string | null;
  title: string;
  companyName: string;
  company_name?: string | null;
  company?: string | null;
  location?: string | null;
  employmentType?: string | null;
  employment_type?: string | null;
  experienceLevel?: string | null;
  experience_level?: string | null;
  salary?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salary_currency?: string | null;
  salaryCurrency?: string | null;
  currency?: string | null;
  description?: string | null;
  requirements?: string[];
  responsibilities?: string[];
  skills?: string[];
  department?: string | null;
  remote?: boolean | null;
  applyUrl?: string | null;
  sourcePlatform?: string | null;
  postedDate?: string | null;
  expiresDate?: string | null;
  status?: string | null;
  lastSynced?: string | null;
  createdAt?: string;
  // New classification columns (migration 011)
  roleCategory?: string | null;
  applicationDeadline?: string | null;
  isActive?: boolean | null;
  // Mass hiring intelligence
  mass_hiring?: string | null;
  massHiring?: string | null;
  mass_hiring_status?: string | null;
  massHiringStatus?: string | null;
  mass_hiring_details?: Record<string, unknown> | null;
  massHiringDetails?: Record<string, unknown> | null;
  // Phase 6 Quality Intelligence
  is_verified_live?: boolean | null;
  isVerifiedLive?: boolean | null;
  ghost_risk?: Record<string, unknown> | null;
  ghostRisk?: Record<string, unknown> | null;
  also_listed_on?: Array<Record<string, unknown>> | null;
  alsoListedOn?: Array<Record<string, unknown>> | null;
  preferred_apply_url?: string | null;
  preferredApplyUrl?: string | null;
};


export type JobSearchFilters = {
  role?: string;
  location?: string;
  company?: string;
  skills?: string[];
  experience?: string;
  remote?: boolean;
  employmentType?: string;
  sort?: "newest" | "oldest" | "best-match" | "salary";
  page?: number;
  pageSize?: number;
  verifiedLiveOnly?: boolean;
};


export type JobSearchResult = {
  jobs: NormalizedJob[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor?: string | null;
};

export type JobMatchResult = {
  matchScore: number;
  skillMatchScore: number;
  keywordMatchScore: number;
  semanticSimilarityScore: number;
  missingSkills: string[];
  missingKeywords: string[];
  recommendations: string[];
  // Backend canonical 8-factor aliases (snake_case + overall). The /jobs/match
  // endpoint returns both shapes so fresh re-analyze results render instead of
  // silently falling back to the stale list score.
  overall?: number;
  skill_match?: number;
  resume_match?: number;
  experience_match?: number;
  experienceMatch?: number;
  location_match?: number;
  locationMatch?: number;
  salary_match?: number;
  salaryMatch?: number;
  company_preference?: number;
  companyPreference?: number;
  freshness?: number;
  missing_skills?: string[];
};

export type SavedJobRecord = {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
  jobs: NormalizedJob | NormalizedJob[] | null;
};

export type JobMatchResponse = {
  job: NormalizedJob;
  match: JobMatchResult;
};

export type JobSearchResponse = {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious?: boolean;
  hasMore: boolean;
};
