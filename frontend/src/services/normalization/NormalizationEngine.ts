import {
  NormalizedJob,
  NormalizedJobCandidate,
  NormalizationContext,
  NormalizationResult,
  EmploymentType,
  WorkMode,
  ExperienceLevel,
  Salary,
  SalaryPeriod,
  CompanySize,
} from "./types";

/**
 * NormalizationEngine - Core normalization engine for job data
 *
 * Performs basic normalization on job candidates:
 * - Trim whitespace
 * - Normalize URLs
 * - Normalize employment type
 * - Remove duplicate skills
 *
 * Does NOT implement:
 * - Salary normalization
 * - Location normalization
 * - Validation
 * - Persistence
 * - Deduplication
 */
export class NormalizationEngine {
  private static readonly CURRENCY_CODE_RE = /[A-Z]{3}/;
  private static readonly KNOWN_CURRENCY_CODES_RE = /\b(?:USD|EUR|GBP|AED|SGD|AUD|CAD)\b/i;
  private static readonly CURRENCY_SYMBOL_RE = /[$\u20AC\u00A3\u00A5\u20B9\u20BD]/u;
  private static readonly INR_KEYWORDS_RE = /\b(?:lpa|lakhs?)\b/i;
  private static readonly PERIOD_YEARLY_RE = /\b(?:pa|per\s+year|per\s+annum|annual(?:ly)?)\b/i;
  private static readonly PERIOD_MONTHLY_RE = /\b(?:pm|per\s+month|monthly)\b/i;
  private static readonly PERIOD_HOURLY_RE = /\b(?:per\s+hour|hourly|\/hr)\b/i;
  private static readonly SALARY_AMOUNT_RE = /[\d,]+(?:\.\d+)?(?:\s*[kmKMT])?/gi;

  private inferSalaryPeriod(raw: string): SalaryPeriod {
    if (NormalizationEngine.PERIOD_HOURLY_RE.test(raw)) return "HOURLY";
    if (NormalizationEngine.PERIOD_MONTHLY_RE.test(raw)) return "MONTHLY";
    if (NormalizationEngine.PERIOD_YEARLY_RE.test(raw)) return "YEARLY";
    return "UNKNOWN";
  }

  private inferSalaryCurrency(raw: string, currency?: string | null): string {
    if (currency) return currency.toUpperCase();
    if (NormalizationEngine.INR_KEYWORDS_RE.test(raw)) return "INR";
    if (NormalizationEngine.KNOWN_CURRENCY_CODES_RE.test(raw)) {
      return (
        raw.match(NormalizationEngine.KNOWN_CURRENCY_CODES_RE)?.[0] ?? "UNKNOWN"
      ).toUpperCase();
    }
    if (NormalizationEngine.CURRENCY_SYMBOL_RE.test(raw)) {
      const sym = raw.match(NormalizationEngine.CURRENCY_SYMBOL_RE)?.[0];
      switch (sym) {
        case "$":
          return "USD";
        case "\u20AC":
          return "EUR";
        case "\u00A3":
          return "GBP";
        case "\u00A5":
          return "JPY";
        case "\u20B9":
          return "INR";
        default:
          return "UNKNOWN";
      }
    }
    return "UNKNOWN";
  }

  private extractSalaryAmounts(raw: string): { min?: number; max?: number } {
    if (!raw) return {};
    const isLpa = NormalizationEngine.INR_KEYWORDS_RE.test(raw);
    const lpaMultiplier = isLpa ? 100000 : 1;
    const matches = raw.matchAll(NormalizationEngine.SALARY_AMOUNT_RE);
    const values: number[] = [];
    for (const m of matches) {
      let n = Number(m[0].replace(/,/g, ""));
      const suffix = m[0].slice(-1).toUpperCase();
      if (suffix === "K") n *= 1000;
      else if (suffix === "M") n *= 1000000;
      else if (suffix === "T") n *= 1000000000;
      n *= lpaMultiplier;
      values.push(n);
    }
    if (values.length === 0) return {};
    return { min: values[0], max: values[1] ?? values[0] };
  }

  private normalizeSalary(
    salary: string | undefined | null,
    currency: string | undefined | null,
    warnings: string[],
    appliedRules: string[],
  ): Salary | null {
    if (!salary && !currency) return null;

    const raw = salary ?? "";
    const inferredCurrency = this.inferSalaryCurrency(raw, currency);
    const { min, max } = this.extractSalaryAmounts(raw);
    const period = this.inferSalaryPeriod(raw);

    appliedRules.push("normalizeSalary");

    if (min === undefined && max === undefined) {
      warnings.push("Salary string present but no amount could be parsed");
    }

    return {
      raw: raw || undefined,
      currency: inferredCurrency,
      period,
      min,
      max,
    };
  }
  /**
   * Normalize a job candidate into a normalized job
   * @param candidate - Raw job candidate data
   * @returns NormalizationResult with normalized job and metadata
   */
  normalize(candidate: NormalizedJobCandidate): NormalizationResult {
    const startTime = Date.now();
    const warnings: string[] = [];
    const appliedRules: string[] = [];
    const fieldCoverage: Record<string, boolean> = {};

    // Create normalization context from candidate
    const context: NormalizationContext = {
      sourceUrl: candidate.sourceUrl || candidate.applyUrl || "",
      companyId: candidate.id,
      companyName: candidate.company || undefined,
      sourceStrategy: candidate.sourceStrategy || "unknown",
      crawlTimestamp: candidate.crawlTimestamp ? new Date(candidate.crawlTimestamp) : new Date(),
      sourcePlatform: candidate.sourcePlatform || undefined,
      rawJson: candidate.rawData,
    };

    // Normalize the candidate
    const normalizedJob = this.normalizeJob(
      candidate,
      context,
      warnings,
      appliedRules,
      fieldCoverage,
    );

    const normalizationDurationMs = Date.now() - startTime;

    return {
      job: normalizedJob,
      warnings,
      normalizationDurationMs,
      appliedRules,
      fieldCoverage,
    };
  }

  /**
   * Normalize a job candidate into a NormalizedJob
   */
  private normalizeJob(
    candidate: NormalizedJobCandidate,
    context: NormalizationContext,
    warnings: string[],
    appliedRules: string[],
    fieldCoverage: Record<string, boolean>,
  ): NormalizedJob {
    // Track field coverage
    const trackField = (field: string, value: unknown) => {
      fieldCoverage[field] = value !== undefined && value !== null && value !== "";
    };

    // Trim whitespace from string fields
    const trimString = (value: string | undefined | null): string | undefined => {
      if (value === undefined || value === null) return undefined;
      const trimmed = value.trim();
      return trimmed || undefined;
    };

    // Normalize URL
    const normalizeUrl = (url: string | undefined | null): string | undefined => {
      if (!url) return undefined;
      const trimmed = url.trim();
      if (!trimmed) return undefined;
      try {
        // Ensure URL has protocol
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
          return `https://${trimmed}`;
        }
        return new URL(trimmed).toString();
      } catch {
        warnings.push(`Invalid URL format: ${trimmed}`);
        return trimmed;
      }
    };

    // Normalize employment type
    const normalizeEmploymentType = (type: string | undefined | null): EmploymentType | null => {
      if (!type) return null;
      const normalized = type.toUpperCase().replace(/[\s-]+/g, "_");
      const validTypes: EmploymentType[] = [
        "FULL_TIME",
        "PART_TIME",
        "CONTRACT",
        "TEMPORARY",
        "INTERNSHIP",
        "FREELANCE",
        "UNKNOWN",
      ];
      if (validTypes.includes(normalized as EmploymentType)) {
        return normalized as EmploymentType;
      }
      // Try to map common variations
      const typeMap: Record<string, EmploymentType> = {
        FULLTIME: "FULL_TIME",
        PARTTIME: "PART_TIME",
        FULL_TIME: "FULL_TIME",
        PART_TIME: "PART_TIME",
        CONTRACTOR: "CONTRACT",
        TEMP: "TEMPORARY",
        INTERN: "INTERNSHIP",
        FREELANCER: "FREELANCE",
      };
      return typeMap[normalized] || "UNKNOWN";
    };

    // Normalize work mode
    const normalizeWorkMode = (mode: string | undefined | null): WorkMode | null => {
      if (!mode) return null;
      const normalized = mode.toUpperCase().replace(/[\s-]+/g, "");
      const validModes: WorkMode[] = ["REMOTE", "HYBRID", "ONSITE", "UNKNOWN"];
      if (validModes.includes(normalized as WorkMode)) {
        return normalized as WorkMode;
      }
      const modeMap: Record<string, WorkMode> = {
        REMOTE: "REMOTE",
        WORKFROMHOME: "REMOTE",
        WFH: "REMOTE",
        HYBRID: "HYBRID",
        ONSITE: "ONSITE",
        OFFICE: "ONSITE",
      };
      return modeMap[normalized] || "UNKNOWN";
    };

    // Normalize experience level
    const normalizeExperienceLevel = (level: string | undefined | null): ExperienceLevel | null => {
      if (!level) return null;
      const normalized = level.toUpperCase().replace(/[\s-]+/g, "");
      const validLevels: ExperienceLevel[] = [
        "ENTRY",
        "JUNIOR",
        "MID",
        "SENIOR",
        "LEAD",
        "EXECUTIVE",
        "UNKNOWN",
      ];
      if (validLevels.includes(normalized as ExperienceLevel)) {
        return normalized as ExperienceLevel;
      }
      const levelMap: Record<string, ExperienceLevel> = {
        ENTRYLEVEL: "ENTRY",
        JUNIOR: "JUNIOR",
        MIDLEVEL: "MID",
        MID: "MID",
        SENIOR: "SENIOR",
        LEAD: "LEAD",
        PRINCIPAL: "LEAD",
        EXECUTIVE: "EXECUTIVE",
        DIRECTOR: "EXECUTIVE",
        VP: "EXECUTIVE",
        C_LEVEL: "EXECUTIVE",
      };
      return levelMap[normalized] || "UNKNOWN";
    };

    // Normalize company size
    const normalizeCompanySize = (size: string | undefined | null): CompanySize | null => {
      if (!size) return null;
      const normalized = size.toUpperCase().replace(/[\s-]+/g, "");
      const validSizes: CompanySize[] = [
        "STARTUP",
        "SMALL",
        "MEDIUM",
        "LARGE",
        "ENTERPRISE",
        "UNKNOWN",
      ];
      if (validSizes.includes(normalized as CompanySize)) {
        return normalized as CompanySize;
      }
      const sizeMap: Record<string, CompanySize> = {
        STARTUP: "STARTUP",
        SMALL: "SMALL",
        MEDIUM: "MEDIUM",
        LARGE: "LARGE",
        ENTERPRISE: "ENTERPRISE",
        BIG: "LARGE",
        CORPORATE: "ENTERPRISE",
      };
      return sizeMap[normalized] || "UNKNOWN";
    };

    // Remove duplicate skills (case-insensitive)
    const deduplicateSkills = (skills: string[] | undefined): string[] => {
      if (!skills || skills.length === 0) return [];
      const seen = new Set<string>();
      return skills
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .filter((s) => {
          const lower = s.toLowerCase();
          if (seen.has(lower)) return false;
          seen.add(lower);
          return true;
        });
    };

    // Build normalized job
    const title = trimString(candidate.title);
    const company = trimString(candidate.company);

    if (!title) warnings.push("Missing required field: title");
    if (!company) warnings.push("Missing required field: company");

    trackField("title", title);
    trackField("company", company);
    trackField("location", candidate.location);
    trackField("employmentType", candidate.employmentType);
    trackField("workMode", candidate.workMode);
    trackField("skills", candidate.skills);
    trackField("description", candidate.description);
    trackField("applyUrl", candidate.applyUrl);
    trackField("sourceUrl", candidate.sourceUrl);

    const normalizedSkills = deduplicateSkills(candidate.skills);
    appliedRules.push("trimWhitespace");
    appliedRules.push("normalizeUrls");
    appliedRules.push("normalizeEmploymentType");
    appliedRules.push("normalizeWorkMode");
    appliedRules.push("normalizeExperienceLevel");
    appliedRules.push("normalizeCompanySize");
    appliedRules.push("deduplicateSkills");

    const now = new Date();
    const crawlTimestamp = context.crawlTimestamp || new Date();

    return {
      id: candidate.id,
      externalJobId: candidate.externalJobId,
      title: title || "",
      company: company || "",
      companyLogo: trimString(candidate.companyLogo) || null,
      location: trimString(candidate.location) || null,
      country: trimString(candidate.country) || null,
      city: trimString(candidate.city) || null,
      employmentType: normalizeEmploymentType(candidate.employmentType),
      workMode: normalizeWorkMode(candidate.workMode),
      experienceLevel: normalizeExperienceLevel(candidate.experienceLevel),
      salary: this.normalizeSalary(candidate.salary, candidate.currency, warnings, appliedRules),
      description: trimString(candidate.description) || null,
      requirements: candidate.requirements?.map(trimString).filter(Boolean) as string[] | undefined,
      responsibilities: candidate.responsibilities?.map(trimString).filter(Boolean) as
        string[] | undefined,
      skills: normalizedSkills,
      department: trimString(candidate.department) || null,
      remote: candidate.remote ?? null,
      applyUrl: normalizeUrl(candidate.applyUrl) || null,
      sourceUrl: normalizeUrl(candidate.sourceUrl) || null,
      sourcePlatform: trimString(candidate.sourcePlatform) || null,
      postedDate: candidate.postedDate || null,
      expiresDate: candidate.expiresDate || null,
      status: trimString(candidate.status) || null,
      lastSynced: candidate.lastSynced || null,
      createdAt: candidate.createdAt || now.toISOString(),
      industry: trimString(candidate.industry) || null,
      visaSupport: candidate.visaSupport ?? null,
      relocation: candidate.relocation ?? null,
      education: trimString(candidate.education) || null,
      certifications: candidate.certifications?.map(trimString).filter(Boolean) as
        string[] | undefined,
      travelRequirement: trimString(candidate.travelRequirement) || null,
      securityClearance: trimString(candidate.securityClearance) || null,
      companySize: normalizeCompanySize(candidate.companySize),
      confidence: candidate.confidence ?? 0.5,
      sourceStrategy: context.sourceStrategy,
      crawlTimestamp,
      lastUpdated: now,
    };
  }
}

/**
 * Default export for convenience
 */
export default NormalizationEngine;
