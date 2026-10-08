export type OptimizationType =
  | "professional_summary"
  | "experience_bullet"
  | "project_bullet"
  | "skills_alignment"
  | "keyword_placement"
  | "section_prioritization";

export type SuggestionStatus = "pending" | "accepted" | "rejected" | "edited";

export type SuggestionPriority = "high" | "medium" | "low";

export type SuggestionCategory =
  "already_present" | "missing_without_evidence" | "possibly_present";

export type SuggestionAction = "keep" | "do_not_add" | "verify";

export type OptimizationSuggestion = {
  id: string;
  type: OptimizationType;
  priority: SuggestionPriority;
  section: string | null;
  entryId: string | null;
  childId: string | null;
  currentText: string | null;
  suggestedText: string | null;
  explanation: string;
  evidence: string[];
  affectedKeywords: string[];
  category: SuggestionCategory | null;
  action: SuggestionAction | null;
  skill: string | null;
  similarInResume: string | null;
  status: SuggestionStatus;
  evidenceIssues: string[];
  createdAt: string;
  updatedAt: string;
};

export type OptimizationSuggestionRecord = {
  id: string;
  sessionId: string;
  suggestion: OptimizationSuggestion;
  resumeSnapshot: Record<string, unknown> | null;
  applied: boolean;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OptimizationSession = {
  id: string;
  resumeId: string;
  atsReportId: string | null;
  jobTitle: string | null;
  company: string | null;
  jobDescription: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "completed" | "abandoned";
  suggestionsGenerated: number;
  suggestions: OptimizationSuggestionRecord[];
  suggestionsAccepted: number;
  suggestionsRejected: number;
  currentAtsScore: number | null;
  baselineAtsScore: number | null;
  targetJobTitle: string | null;
  targetCompany: string | null;
};

export type GenerateOptimizationResponse = {
  sessionId: string;
  suggestions: OptimizationSuggestion[];
  message: string;
  evidenceIssues: string[];
};

export type GenerateSkillsOptimizationResponse = {
  sessionId: string;
  suggestions: OptimizationSuggestion[];
  message: string;
  evidenceIssues: string[];
};

export type GenerateSummaryOptimizationResponse = {
  sessionId: string;
  suggestions: OptimizationSuggestion[];
  message: string;
  evidenceIssues: string[];
};

export type GenerateExperienceBulletOptimizationResponse = {
  sessionId: string;
  suggestions: OptimizationSuggestion[];
  message: string;
  evidenceIssues: string[];
};

export type SuggestionActionResponse = {
  success: boolean;
  suggestionId: string;
  status: SuggestionStatus;
  updatedResume: Record<string, unknown> | null;
  message: string;
};

export type OptimizationHistoryItem = {
  sessionId: string;
  jobTitle: string | null;
  company: string | null;
  baselineScore: number | null;
  finalScore: number | null;
  suggestionsCount: number;
  acceptedCount: number;
  rejectedCount: number;
  createdAt: string;
  status: string;
};

export type ReanalyzeResponse = {
  previousScore: number;
  currentScore: number;
  delta: number;
  reportId: string;
  message: string;
};

export type OptimizationView =
  "all" | "summary" | "experience" | "projects" | "skills" | "accepted" | "rejected";

export type TailoringPlanItem = {
  section: string;
  action: "KEEP" | "REWRITE" | "EMPHASIZE" | "ALIGN" | string;
  targetId?: string | null;
  currentText?: string | null;
  suggestedText?: string | null;
  reasoning: string;
  keywordsAddressed: string[];
};

export type ATSScoreComparison = {
  baselineScore: number;
  tailoredScore: number;
  delta: number;
  matchedKeywordsCount: number;
  missingKeywordsCount: number;
};

export type TailorResumeRequest = {
  resumeId?: string;
  versionId?: string;
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  content?: Record<string, unknown>;
};

export type TailorResumeResponse = {
  success: boolean;
  plan: TailoringPlanItem[];
  tailoredProfile: Record<string, unknown>;
  scoreComparison: ATSScoreComparison;
  message: string;
  limitedAlignment?: boolean;
  alignmentMessage?: string | null;
};
