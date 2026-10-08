/**
 * Normalization Engine Types
 *
 * Core interfaces for the Job Normalization Engine.
 * These interfaces define the contract for normalizing job data from various sources.
 */

/**
 * NormalizedJob - The canonical normalized job representation
 * This is the final output after normalization
 */
export interface NormalizedJob {
  id?: string;
  externalJobId?: string | null;
  title: string;
  company: string;
  companyLogo?: string | null;
  location?: string | null;
  country?: string | null;
  city?: string | null;
  employmentType?: EmploymentType | null;
  workMode?: WorkMode | null;
  experienceLevel?: ExperienceLevel | null;
  salary?: Salary | null;
  description?: string | null;
  requirements?: string[];
  responsibilities?: string[];
  skills: string[];
  department?: string | null;
  remote?: boolean | null;
  applyUrl?: string | null;
  sourceUrl?: string | null;
  sourcePlatform?: string | null;
  postedDate?: string | null;
  expiresDate?: string | null;
  status?: string | null;
  lastSynced?: string | null;
  createdAt?: string;
  industry?: string | null;
  visaSupport?: boolean | null;
  relocation?: boolean | null;
  education?: string | null;
  certifications?: string[];
  travelRequirement?: string | null;
  securityClearance?: string | null;
  companySize?: CompanySize | null;
  confidence: number;
  sourceStrategy: string;
  crawlTimestamp: Date;
  lastUpdated: Date;
}

/**
 * Salary information with normalized fields
 */
export interface Salary {
  min?: number;
  max?: number;
  currency: string;
  period?: SalaryPeriod;
  raw?: string;
}

/**
 * NormalizedJobCandidate - Raw job data candidate for normalization
 * This is the input to the normalization engine
 */
export interface NormalizedJobCandidate {
  id?: string;
  externalJobId?: string | null;
  title?: string;
  company?: string;
  companyLogo?: string | null;
  location?: string | null;
  country?: string | null;
  city?: string | null;
  employmentType?: string | null;
  workMode?: string | null;
  experienceLevel?: string | null;
  salary?: string | null;
  currency?: string | null;
  description?: string | null;
  requirements?: string[];
  responsibilities?: string[];
  skills?: string[];
  department?: string | null;
  remote?: boolean | null;
  applyUrl?: string | null;
  sourceUrl?: string | null;
  sourcePlatform?: string | null;
  postedDate?: string | null;
  expiresDate?: string | null;
  status?: string | null;
  lastSynced?: string | null;
  createdAt?: string;
  industry?: string | null;
  visaSupport?: boolean | null;
  relocation?: boolean | null;
  education?: string | null;
  certifications?: string[];
  travelRequirement?: string | null;
  securityClearance?: string | null;
  companySize?: string | null;
  confidence?: number;
  sourceStrategy?: string;
  crawlTimestamp?: Date | string;
  lastUpdated?: Date | string;
  rawData?: Record<string, unknown>;
}

/**
 * NormalizationContext - Contextual information for normalization
 * Provides metadata about the source and environment
 */
export interface NormalizationContext {
  sourceUrl: string;
  companyId?: string;
  companyName?: string;
  sourceStrategy: string;
  crawlTimestamp: Date;
  sourcePlatform?: string;
  rawHtml?: string;
  rawJson?: Record<string, unknown>;
}

/**
 * NormalizationResult - Result of the normalization process
 * Contains the normalized job and metadata about the normalization
 */
export interface NormalizationResult {
  job: NormalizedJob;
  warnings: string[];
  normalizationDurationMs: number;
  appliedRules: string[];
  fieldCoverage: Record<string, boolean>;
}

/**
 * Employment type enumeration
 */
export type EmploymentType =
  "FULL_TIME" | "PART_TIME" | "CONTRACT" | "TEMPORARY" | "INTERNSHIP" | "FREELANCE" | "UNKNOWN";

/**
 * Work mode enumeration
 */
export type WorkMode = "REMOTE" | "HYBRID" | "ONSITE" | "UNKNOWN";

/**
 * Experience level enumeration
 */
export type ExperienceLevel =
  "ENTRY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE" | "UNKNOWN";

/**
 * Salary period enumeration
 */
export type SalaryPeriod = "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "UNKNOWN";

/**
 * Company size enumeration
 */
export type CompanySize = "STARTUP" | "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE" | "UNKNOWN";
