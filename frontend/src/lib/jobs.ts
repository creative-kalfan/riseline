import type {
  ApplicationStatus,
  EmploymentType,
  Job,
  JobSearchFilters,
  NormalizedJob,
  WorkMode,
} from "../types/jobs";

// ---------------------------------------------------------------------------
// Backend → UI adapter
// ---------------------------------------------------------------------------

const BRAND_GRADIENTS = [
  "linear-gradient(135deg,#5E6AD2,#8B5CF6)",
  "linear-gradient(135deg,#635BFF,#00D4FF)",
  "linear-gradient(135deg,#111,#444)",
  "linear-gradient(135deg,#F24E1E,#A259FF)",
  "linear-gradient(135deg,#10A37F,#0EA5E9)",
  "linear-gradient(135deg,#95BF47,#5E8E3E)",
  "linear-gradient(135deg,#C97C5D,#8B4513)",
  "linear-gradient(135deg,#F59E0B,#EA580C)",
];

// Curated map of well-known tech companies to their logo image URLs.
// When a company name matches a known entry, the logo URL is used as the
// companyLogo display value. When unknown, initials fallback is used.
//
// Values must be actual image URLs (e.g. from Supabase Storage or public CDNs).
// These are NOT company names — they are image sources. Initials are fallback only.
//
// Keep this list minimal. Add entries only when a real logo URL is available.
// Real company logo image URLs for well-known companies (Simple Icons CDN
// serves genuine brand logo assets; these are NOT names or initials).
// When a job's company matches an entry, the frontend renders the actual
// logo via <img>. Any company not listed here falls back to initials, and a
// broken/unavailable logo URL also falls back to initials at render time.
const KNOWN_COMPANY_LOGOS: Record<string, string> = {
  Google: "https://cdn.simpleicons.org/google/5f6368",
  Apple: "https://cdn.simpleicons.org/apple/000000",
  Microsoft: "https://cdn.simpleicons.org/microsoft/5e5e5e",
  Amazon: "https://cdn.simpleicons.org/amazon/ff9900",
  Meta: "https://cdn.simpleicons.org/meta/0468d7",
  Netflix: "https://cdn.simpleicons.org/netflix/e50914",
  Spotify: "https://cdn.simpleicons.org/spotify/1db954",
  Notion: "https://cdn.simpleicons.org/notion/000000",
  Stripe: "https://cdn.simpleicons.org/stripe/635bff",
  GitHub: "https://cdn.simpleicons.org/github/181717",
  Slack: "https://cdn.simpleicons.org/slack/4a154b",
  Dropbox: "https://cdn.simpleicons.org/dropbox/0061ff",
  Shopify: "https://cdn.simpleicons.org/shopify/7ab55c",
  Zoom: "https://cdn.simpleicons.org/zoom/2d8cff",
  Salesforce: "https://cdn.simpleicons.org/salesforce/00a1e0",
  Atlassian: "https://cdn.simpleicons.org/atlassian/2684ff",
  Figma: "https://cdn.simpleicons.org/figma/f24e1e",
  Airbnb: "https://cdn.simpleicons.org/airbnb/ff5a5f",
  Uber: "https://cdn.simpleicons.org/uber/100000",
  Medium: "https://cdn.simpleicons.org/medium/000000",
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function parseSalary(salary?: string | null, raw?: Raw): {
  min: number;
  max: number;
  currency: string;
} {
  // Prefer real numeric DB fields (migration 020) over the legacy string.
  const numMin = raw ? Number(raw.salary_min ?? raw.salaryMin) : NaN;
  const numMax = raw ? Number(raw.salary_max ?? raw.salaryMax) : NaN;
  const rawCur =
    (raw ? pickStr(raw, "salary_currency", "salaryCurrency") : undefined) ?? undefined;
  if (Number.isFinite(numMin) || Number.isFinite(numMax)) {
    const toThousands = (n: number) => (n >= 1000 ? Math.round(n / 1000) : Math.round(n));
    const min = Number.isFinite(numMin) ? toThousands(numMin) : 0;
    const max = Number.isFinite(numMax) ? toThousands(numMax) : min;
    if (min !== 0 || max !== 0) return { min, max, currency: rawCur ?? "USD" };
  }
  if (!salary) return { min: 0, max: 0, currency: "USD" };
  // Examples: "$180k - $285k", "180000 - 285000 USD", "180-285k"
  const currencyMatch = salary.match(/[A-Z]{3}/);
  const currency = currencyMatch ? currencyMatch[0] : "USD";
  const numbers = salary.match(/\d[\d,]*/g) ?? [];
  const values = numbers.map((n) => Number(n.replace(/,/g, "")));
  if (values.length === 0) return { min: 0, max: 0, currency };
  const toThousands = (n: number) => (n >= 1000 ? Math.round(n / 1000) : n);
  const min = toThousands(values[0]);
  const max = values[1] ? toThousands(values[1]) : min;
  return { min, max, currency };
}

export function daysAgoFromDate(date?: string | null): number {
  if (!date || date === "null" || date === "undefined") return -1;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return -1;
  const diff = Date.now() - parsed.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function humanPostedDate(date?: string | null): string {
  const days = daysAgoFromDate(date);
  if (days < 0) return "Date unavailable";
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function toWorkMode(remote?: boolean | null, location?: string | null): WorkMode {
  const loc = (location ?? "").toLowerCase();
  if (remote === true || loc.includes("remote")) return "Remote";
  if (loc.includes("hybrid")) return "Hybrid";
  if (!loc) {
    if (remote === false) return "On-site";
    return "Unknown";
  }
  return "On-site";
}

function toEmploymentType(value?: string | null): EmploymentType {
  const v = (value ?? "").toLowerCase();
  if (!v) return "Not specified";
  if (v.includes("part")) return "Part-time";
  if (v.includes("contract")) return "Contract";
  if (v.includes("intern")) return "Internship";
  return "Full-time";
}

// The backend JobOut schema returns snake_case fields (company_name,
// apply_url, posted_date, etc.) while older clients may use camelCase
// (companyName, applyUrl). These helpers normalize both so adaptJob works
// regardless of which casing the backend currently emits.
type Raw = Record<string, unknown>;

function pick(raw: Raw, snake: string, camel: string): unknown {
  const v = raw[snake] ?? raw[camel];
  return v;
}

function pickStr(raw: Raw, snake: string, camel: string): string | undefined {
  const v = pick(raw, snake, camel);
  return typeof v === "string" ? v : undefined;
}

function pickDate(raw: Raw, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === "string" && v.trim() && v !== "null" && v !== "undefined") {
      return v.trim();
    }
  }
  return undefined;
}

// Strip HTML tags when a plain text representation is required (e.g. text summaries)
export function stripHtml(value?: string | null): string {
  if (!value) return "";
  const lt = String.fromCharCode(38) + "lt;";
  const gt = String.fromCharCode(38) + "gt;";
  const amp = String.fromCharCode(38) + "amp;";
  const quot = String.fromCharCode(38) + "quot;";
  const ap = String.fromCharCode(38) + "#39;";
  return value
    .replace(/<[^>]*>/g, " ")
    .split(lt)
    .join("<")
    .split(gt)
    .join(">")
    .split(amp)
    .join("&")
    .split(quot)
    .join(String.fromCharCode(34))
    .split(ap)
    .join(String.fromCharCode(39))
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Clean and decode job description HTML/text without stripping structural tags
export function sanitizeDescription(value?: string | null): string {
  if (!value) return "";
  let clean = value
    .replace(/&amp;lt;/gi, "<")
    .replace(/&amp;gt;/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;quot;/gi, '"')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;#39;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&amp;amp;/gi, "&")
    .replace(/&amp;nbsp;/gi, " ")
    .replace(/&nbsp;/gi, " ");
  clean = clean.replace(/<(script|iframe|object|embed|style)[\s\S]*?<\/\1>/gi, "");
  clean = clean.replace(/on\w+="[^"]*"/gi, "");
  clean = clean.replace(/on\w+='[^']*'/gi, "");
  return clean.trim();
}

// Resolve user-friendly provenance from backend source_platform or applyUrl
export function resolveSourceProvenance(
  sourcePlatform?: string | null,
  applyUrl?: string | null,
): {
  label: string;
  verified: boolean;
  type: "career_site" | "yc" | "direct" | "aggregator" | "general";
} {
  const p = (sourcePlatform ?? "").toLowerCase();
  const url = (applyUrl ?? "").toLowerCase();

  if (
    p.includes("firecrawl") ||
    p.includes("career_page") ||
    p.includes("careers") ||
    p.includes("ashby") ||
    p.includes("greenhouse") ||
    p.includes("lever")
  ) {
    return { label: "Official Career Site", verified: true, type: "career_site" };
  }
  if (p.includes("yc") || p.includes("ycombinator") || url.includes("ycombinator.com")) {
    return { label: "YC Opportunity", verified: true, type: "yc" };
  }
  if (p.includes("direct") || p.includes("company")) {
    return { label: "Direct Posting", verified: true, type: "direct" };
  }
  if (p.includes("adzuna") || p.includes("aggregator")) {
    return { label: "Aggregated Source", verified: false, type: "aggregator" };
  }
  if (url.includes("careers.") || url.includes("/careers/") || url.includes("/jobs/")) {
    return { label: "Official Career Site", verified: true, type: "career_site" };
  }
  return { label: "Verified Source", verified: true, type: "general" };
}

// Semantic match tier classification for restrained, non-glowing badges
export function getMatchTier(score: number): {
  tier: "strong" | "good" | "moderate" | "growth";
  label: string;
  badgeClass: string;
  textClass: string;
  barColor: string;
} {
  if (score >= 85) {
    return {
      tier: "strong",
      label: "Strong match",
      badgeClass: "border-success/30 bg-success/10 text-success",
      textClass: "text-success",
      barColor: "bg-success",
    };
  }
  if (score >= 70) {
    return {
      tier: "good",
      label: "Good match",
      badgeClass: "border-primary/30 bg-primary/10 text-primary",
      textClass: "text-primary",
      barColor: "bg-primary",
    };
  }
  if (score >= 50) {
    return {
      tier: "moderate",
      label: "Moderate fit",
      badgeClass: "border-warning/30 bg-warning/10 text-warning",
      textClass: "text-warning",
      barColor: "bg-warning",
    };
  }
  return {
    tier: "growth",
    label: "Growth role",
    badgeClass: "border-border/60 bg-muted/40 text-muted-foreground",
    textClass: "text-muted-foreground",
    barColor: "bg-muted-foreground",
  };
}

// Raw jobs from the personalized endpoint include optional match/ATS score
// fields that are not part of the base NormalizedJob DTO. This type widens
// NormalizedJob with those optional fields so adaptJob can preserve them.
type RawJobWithScores = NormalizedJob &
  Partial<
    Pick<
      Job,
      | "match"
      | "atsScore"
      | "atsSkillMatch"
      | "atsKeywordMatch"
      | "atsMissingSkills"
      | "atsMissingKeywords"
      | "atsRecommendations"
    >
  >;

// Derives the list of skills the user has that are present in the job.
// The backend personalized endpoint returns match.missingSkills/skills.
// We treat any job skill that is NOT in the missing list as a matched skill.
function deriveMatchedSkills(raw: RawJobWithScores): string[] {
  const r = raw as unknown as Raw;
  const jobSkills = (r.skills as string[]) ?? [];
  const matchObj = (r.match as Raw | undefined) ?? (r.matchScore as Raw | undefined) ?? undefined;
  const matchMissing = matchObj
    ? (pick(matchObj, "missing_skills", "missingSkills") as string[] | undefined)
    : undefined;
  const missing = (raw.atsMissingSkills ??
    matchMissing ??
    (pick(r, "missing_skills", "missingSkills") as string[] | undefined) ??
    []) as string[];

  if (jobSkills.length === 0) return [];
  if (missing.length === 0) return jobSkills;
  const missingLower = new Set(missing.map((s) => s.toLowerCase()));
  return jobSkills.filter((s) => !missingLower.has(s.toLowerCase()));
}

export function adaptJob(raw: RawJobWithScores, overrides: Partial<Job> = {}): Job {
  const r = raw as unknown as Raw;
  const company =
    pickStr(r, "company_name", "companyName") || pickStr(r, "company", "company") || "Unknown";
  const brand = BRAND_GRADIENTS[hashString(company) % BRAND_GRADIENTS.length];
  const salary = parseSalary(pickStr(r, "salary", "salary"), r);
  const postedRaw = pickDate(r, "posted_at", "postedAt", "posted_date", "postedDate");
  const postedDaysAgo = daysAgoFromDate(postedRaw);
  // Match/ATS scores come from the backend (personalized endpoint returns
  // match.overall (or match_overall) and ats_score). Default to 0.
  const matchObj = (r.match as Raw | undefined) ?? (r.matchScore as Raw | undefined) ?? undefined;
  const matchOverall = (matchObj && Number(pick(matchObj, "overall", "overall"))) || 0;
  const atsMatchRaw = pick(r, "ats_score", "atsScore");
  const atsMatch = atsMatchRaw != null && atsMatchRaw !== 0 ? Number(atsMatchRaw) : undefined;
  const rawDesc = pickStr(r, "description", "description");
  const description = sanitizeDescription(rawDesc);
  const expLevel = pickStr(r, "experience_level", "experienceLevel");
  const roleCat = pickStr(r, "role_category", "roleCategory");
  const appDeadline = pickStr(r, "application_deadline", "applicationDeadline");
  const applyUrl = pickStr(r, "apply_url", "applyUrl") || pickStr(r, "url", "url") || null;
  const sourcePlatform =
    pickStr(r, "source_platform", "sourcePlatform") || pickStr(r, "source", "source") || null;
  const sourceProvenance = resolveSourceProvenance(sourcePlatform, applyUrl);
  const location = pickStr(r, "location", "location") ?? "Unknown";
  const remote = r.remote === true ? true : r.remote === false ? false : null;
  const emplType = pickStr(r, "employment_type", "employmentType");
  const postedLabel = humanPostedDate(postedRaw);

  const massHiring = pickStr(r, "mass_hiring", "massHiring") || null;
  const massHiringStatus = pickStr(r, "mass_hiring_status", "massHiringStatus") || null;
  const rawDetails = (pick(r, "mass_hiring_details", "massHiringDetails") as Record<string, unknown> | null) || null;
  const massHiringDetails = rawDetails ? {
    confidence: (rawDetails.confidence as string) || undefined,
    status: (rawDetails.status as string) || undefined,
    signals_detected: (rawDetails.signals_detected as string[]) || undefined,
    vacancy_count: typeof rawDetails.vacancy_count === "number" ? rawDetails.vacancy_count : null,
    deadline: (rawDetails.deadline as string) || null,
    detected_at: (rawDetails.detected_at as string) || undefined,
  } : null;

  // Match breakdown from snake_case or camelCase.
  const skillMatch = (matchObj && Number(pick(matchObj, "skill_match", "skillMatch"))) || 0;
  const resumeMatch = (matchObj && Number(pick(matchObj, "resume_match", "resumeMatch"))) || 0;
  const experienceMatch =
    (matchObj && Number(pick(matchObj, "experience_match", "experienceMatch"))) || 0;
  const locationMatch =
    (matchObj && Number(pick(matchObj, "location_match", "locationMatch"))) || 0;
  const salaryMatch = (matchObj && Number(pick(matchObj, "salary_match", "salaryMatch"))) || 0;
  const companyPreference =
    (matchObj && Number(pick(matchObj, "company_preference", "companyPreference"))) || 0;
  const freshness = (matchObj && Number(pick(matchObj, "freshness", "freshness"))) || 0;
  const missingSkills = ((matchObj && pick(matchObj, "missing_skills", "missingSkills")) ||
    []) as string[];

  const overall = matchOverall;

  // Company logo: a real logo image URL for known companies; initials are
  // only the fallback. The UI renders companyLogoUrl via <img> when present
  // (with broken-image fallback to initials) and never shows initials when
  // a genuine logo is available.
  let companyLogo: string;
  const knownLogo = KNOWN_COMPANY_LOGOS[company];
  let companyLogoUrl: string | undefined;
  if (knownLogo) {
    companyLogoUrl = knownLogo;
    companyLogo = company
      .split(" ")
      .slice(0, 2)
      .map((c) => c.charAt(0).toUpperCase())
      .join("");
  } else {
    companyLogo = company
      .split(" ")
      .slice(0, 2)
      .map((c) => c.charAt(0).toUpperCase())
      .join("");
  }

  // Company brand (background gradient) continues to use the deterministic hash.

  return {
    id: (pickStr(r, "id", "id") as string) ?? crypto.randomUUID(),
    role: pickStr(r, "title", "title") || "Untitled Role",
    company,
    companyLogo,
    companyLogoUrl,
    companyBrand: brand,
    location,
    workMode: toWorkMode(remote, location),
    employmentType: toEmploymentType(emplType),
    experience: expLevel ?? "Not specified",
    education: undefined,
    salaryMin: salary.min,
    salaryMax: salary.max,
    salaryCurrency: salary.currency,
    aiMatch: overall,
    atsMatch,
    postedAt: postedLabel,
    postedDaysAgo,
    quickApply: false,
    bookmarked: false,
    status: "not_applied",
    techStack: (r.skills as string[]) ?? [],
    overview: description,
    responsibilities: (r.responsibilities as string[]) ?? [],
    requirements: (r.requirements as string[]) ?? [],
    benefits: [],
    recruiterNote: undefined,
    matchedSkills: deriveMatchedSkills(raw),
    missingSkills: (raw.atsMissingSkills as string[]) ?? missingSkills,
    seniority: expLevel ?? "Not specified",
    interviewProbability: Math.round(overall * 0.7),
    keywordCompare: [],
    marketSalary: { min: salary.min, median: salary.max, max: salary.max },
    roleCategory: roleCat ?? null,
    applicationDeadline: appDeadline ?? null,
    applyUrl,
    massHiring,
    massHiringStatus,
    massHiringDetails,
    sourcePlatform,
    sourceProvenance,
    match: matchObj
      ? {
          overall,
          skillMatch,
          resumeMatch,
          experienceMatch,
          locationMatch,
          salaryMatch,
          companyPreference,
          freshness,
          missingSkills,
        }
      : undefined,
    atsScore: atsMatch,
    atsSkillMatch: Number(pick(r, "ats_skill_match", "atsSkillMatch") ?? 0) || undefined,
    atsKeywordMatch: Number(pick(r, "ats_keyword_match", "atsKeywordMatch") ?? 0) || undefined,
    atsMissingSkills: (pick(r, "ats_missing_skills", "atsMissingSkills") as string[]) ?? undefined,
    atsMissingKeywords:
      (pick(r, "ats_missing_keywords", "atsMissingKeywords") as string[]) ?? undefined,
    atsRecommendations:
      (pick(r, "ats_recommendations", "atsRecommendations") as string[]) ?? undefined,
    // Phase 6 Quality Intelligence
    isVerifiedLive: (pick(r, "is_verified_live", "isVerifiedLive") as boolean) ?? null,
    ghostRisk: (pick(r, "ghost_risk", "ghostRisk") as Job["ghostRisk"]) ?? null,
    alsoListedOn: (pick(r, "also_listed_on", "alsoListedOn") as Job["alsoListedOn"]) ?? null,
    preferredApplyUrl: (pickStr(r, "preferred_apply_url", "preferredApplyUrl") as string) || applyUrl || null,
    ...overrides,
  };
}


// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

export function statusMeta(s: ApplicationStatus): { label: string; tone: string } {
  switch (s) {
    case "applied":
      return { label: "Applied", tone: "bg-info/15 text-info border-info/30" };
    case "interviewing":
      return { label: "Interviewing", tone: "bg-accent/15 text-accent border-accent/30" };
    case "offer":
      return { label: "Offer", tone: "bg-success/15 text-success border-success/30" };
    case "rejected":
      return { label: "Closed", tone: "bg-destructive/15 text-destructive border-destructive/30" };
    case "saved":
      return { label: "Saved", tone: "bg-warning/15 text-warning border-warning/30" };
    default:
      return {
        label: "New",
        tone: "bg-surface-elevated/60 text-muted-foreground border-border/60",
      };
  }
}

export function formatSalary(min: number, max: number, cur = "USD") {
  if (min === 0 && max === 0) return "Not disclosed";
  const s = cur === "USD" ? "$" : cur + " ";
  return `${s}${min}k – ${s}${max}k`;
}

export const filterOptions = {
  workMode: ["Remote", "Hybrid", "On-site"] as WorkMode[],
  employmentType: ["Full-time", "Part-time", "Contract", "Internship"] as EmploymentType[],
  experience: ["Entry", "Mid", "Senior", "Staff+"],
  postedDate: ["Last 24h", "Last 3 days", "Last week", "Last month"],
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Node",
    "Python",
    "FastAPI",
    "Postgres",
    "Kubernetes",
    "Docker",
    "AWS",
    "Rust",
    "GraphQL",
    "Go",
  ],
  sort: [
    { value: "best-match" as const, label: "Best match" },
    { value: "newest" as const, label: "Newest" },
    { value: "salary" as const, label: "Highest salary" },
    { value: "oldest" as const, label: "Oldest" },
  ],
  companies: [] as string[],
};

// Maps the UI filter pane selections to backend JobSearchFilters.
export function buildSearchFilters(filters: {
  query?: string;
  role?: string;
  location?: string;
  company?: string;
  workMode?: string[];
  employmentType?: string[];
  experience?: string[];
  skills?: string[];
  companies?: string[];
  sort?: JobSearchFilters["sort"];
  page?: number;
  pageSize?: number;
}): JobSearchFilters {
  const remote =
    filters.workMode?.includes("Remote") === true
      ? true
      : filters.workMode?.includes("On-site") === true
        ? false
        : undefined;

  return {
    role: filters.role || filters.query || undefined,
    location: filters.location || undefined,
    company: filters.company || filters.companies?.[0] || undefined,
    employmentType: filters.employmentType?.[0] || undefined,
    experience: filters.experience?.[0] || undefined,
    skills: filters.skills?.length ? filters.skills : undefined,
    remote,
    sort: filters.sort,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}
