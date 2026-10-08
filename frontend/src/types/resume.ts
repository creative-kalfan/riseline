import type { DocumentGeometryMap } from "./geometry";

// ---------------------------------------------------------------------------
// UI-facing resume types (consumed by Resume workspace components)
// ---------------------------------------------------------------------------

export type ResumeSectionType = "summary" | "experience" | "education" | "skills" | "projects";

export interface SubEngagementItem {
  id: string;
  name: string;
  description?: string;
  responsibilities?: BulletItem[];
  bullets?: BulletItem[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: BulletItem[];
  sub_engagements?: SubEngagementItem[];
}

export interface BulletItem {
  id: string;
  text: string;
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  start: string;
  end: string;
  gpa: string;
  coursework: string[];
  achievements: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  problem: string;
  contribution: string;
  technologies: string[];
  methodology: string;
  results: string;
  metrics: string;
  url: string;
  responsibilities?: BulletItem[];
}

export interface ResumeSection {
  id: string;
  type: ResumeSectionType;
  title: string;
}

export interface ResumeContact {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface ResumeData {
  id: string;
  name: string;
  targetRole: string;
  updatedAt: string;
  atsScore: number;
  contact: ResumeContact;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  skillCategories?: Record<string, string[]>;
  projects: ProjectItem[];
  sections: ResumeSection[];
  internships: ExperienceItem[];
  certifications: CertificationEntry[];
  achievements: string[];
  leadership: LeadershipEntry[];
  languages: LanguageEntry[];
  links: LinkEntry[];
  additional: AdditionalEntry[];
  storage_path?: string | null;
  meta?: ResumeRecordMeta | null;
  /** Original uploaded filename — present when the resume was uploaded from a file. */
  original_filename?: string | null;
  /** Parse/creation source — 'upload_parse' | 'pdf_edit' | 'compiled' | 'questionnaire' etc. */
  source?: string | null;
}

// ---------------------------------------------------------------------------
// Backend DTOs (response shapes from backend)
// ---------------------------------------------------------------------------

export type ResumeRecordMeta = {
  storage_path?: string | null;
  geometry?: DocumentGeometryMap | null;
  [key: string]: unknown;
};

/** The resume row in the database. */
export type ResumeRecord = {
  id: string;
  user_id: string;
  title: string;
  file_url?: string | null;
  original_filename?: string | null;
  storage_path?: string | null;
  parse_status: "pending" | "processing" | "completed" | "failed";
  content?: Record<string, unknown> | null;
  meta?: ResumeRecordMeta | null;
  created_at: string;
  updated_at: string;
};

/** Shape returned by POST /upload/resume */
export type UploadResumeResponse = {
  resume: ResumeRecord;
  parse: {
    status: "completed" | "failed" | "pending" | "processing";
    versionId?: string;
    error?: string;
    extracted?: {
      name: string;
      email: string;
      phone: string;
      skills: number;
      experience: number;
      projects: number;
      education: number;
      certifications: number;
    };
  } | null;
};

/** Shape returned by POST /resumes/[id]/parse */
export type ParseResumeResponse = {
  resumeId: string;
  versionId: string;
  status: "completed" | "failed" | "processing";
  parsed: {
    personal: {
      fullName?: string;
      email?: string;
      phone?: string;
      location?: string;
      headline?: string;
      website?: string;
    };
    skillsCount: number;
    experienceCount: number;
    projectsCount: number;
    educationCount: number;
    certificationsCount: number;
  };
};

export type ResumeListRecord = {
  id: string;
  name: string;
  role: string;
  updatedAt: string;
  atsScore: number;
};

/** Backend response envelope: { success, data, meta? } */
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

export type ResumeListResponse = {
  resumes: ResumeListRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ResumeContent = {
  sections: Array<{
    id: string;
    type: string;
    title: string;
    order: number;
    visible: boolean;
    data: Record<string, unknown>;
  }>;
  meta?: {
    theme?: "classic" | "modern";
    fontSize?: number;
    parsedAt?: string;
  };
};

// ---------------------------------------------------------------------------
// Resume Profile types (Step 1: Resume Data Collection)
// ---------------------------------------------------------------------------

export interface ResumeProfilePersonal {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  employmentType: string;
  responsibilities: BulletItem[];
  sub_engagements?: SubEngagementItem[];
  achievements: string[];
  tools: string[];
  metrics: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  coursework: string[];
  achievements: string[];
}

export interface SkillCategory {
  technical: string[];
  tools: string[];
  languages: string[];
  databases: string[];
  analytics: string[];
  softSkills: string[];
  custom: Record<string, string[]>;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  problem: string;
  contribution: string;
  technologies: string[];
  methodology: string;
  results: string;
  metrics: string;
  url: string;
  responsibilities?: BulletItem[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialUrl: string;
}

export interface LeadershipEntry {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface LanguageEntry {
  id: string;
  language: string;
  proficiency: string;
}

export interface LinkEntry {
  id: string;
  label: string;
  url: string;
}

export interface AdditionalEntry {
  id: string;
  title: string;
  description: string;
}

export interface ResumeProfile {
  personal: ResumeProfilePersonal;
  targetRole: string;
  summary: string;
  experience: ExperienceEntry[];
  internships: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillCategory;
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  achievements: string[];
  leadership: LeadershipEntry[];
  languages: LanguageEntry[];
  links: LinkEntry[];
  additional: AdditionalEntry[];
}

export interface ResumeMeta {
  isFresher: boolean;
  experienceLevel: string;
  completeness: number;
  setupCompleted: boolean;
  setupStep: number;
}

export interface ResumeContentV2 {
  profile: ResumeProfile;
  meta: ResumeMeta;
}

export interface CompletenessSection {
  complete: boolean;
  count?: number;
  missing?: string | null;
}

export interface CompletenessResponseData {
  score: number;
  sections: Record<string, CompletenessSection>;
  recommendations: string[];
}

export type QuestionnaireStep =
  | "basic"
  | "professional"
  | "target-role"
  | "experience"
  | "internships"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "achievements"
  | "leadership"
  | "languages"
  | "links"
  | "additional"
  | "review";

export const QUESTIONNAIRE_STEPS: { id: QuestionnaireStep; title: string; description: string }[] =
  [
    { id: "basic", title: "Basic Information", description: "Your name and contact details" },
    { id: "professional", title: "Professional Profile", description: "Headline and summary" },
    { id: "target-role", title: "Target Role", description: "What role are you targeting?" },
    { id: "experience", title: "Work Experience", description: "Your professional experience" },
    { id: "internships", title: "Internships", description: "Any internships completed" },
    { id: "education", title: "Education", description: "Your academic background" },
    { id: "skills", title: "Skills", description: "Technical and soft skills" },
    { id: "projects", title: "Projects", description: "Key projects you've worked on" },
    { id: "certifications", title: "Certifications", description: "Professional certifications" },
    { id: "achievements", title: "Achievements", description: "Awards and accomplishments" },
    {
      id: "leadership",
      title: "Leadership & Activities",
      description: "Leadership roles and activities",
    },
    { id: "languages", title: "Languages", description: "Languages you know" },
    { id: "links", title: "Links", description: "Portfolio, GitHub, LinkedIn" },
    { id: "additional", title: "Additional Information", description: "Anything else" },
    { id: "review", title: "Review & Complete", description: "Review your information" },
  ];

export interface ResumeTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  sourceRepository: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
  attributionRequired: boolean;
  modificationAllowed: boolean;
  redistributionAllowed: boolean;
  layoutType: string;
  columnCount: number;
  pagePreference: string;
  atsCharacteristics: Record<string, boolean>;
  targetRoles: string[];
  targetIndustries: string[];
  targetExperienceLevels: string[];
  evidenceType: string;
  evidenceDescription: string;
  previewUrl: string;
  templatePath: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeTemplateListResponse {
  templates: ResumeTemplate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
