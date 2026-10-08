// Mock data layer for the ATS Intelligence Workspace.
// TODO(integration): replace each export with a real API call / server function.

export interface AtsSectionScore {
  id: string;
  label: string;
  score: number; // 0-100
  weight: number; // relative weight in %
  status: "strong" | "ok" | "weak";
  hint: string;
}

export interface AtsHealthMetric {
  id: string;
  label: string;
  value: number;
  target: number;
  unit?: string;
}

export interface AtsHistoryEntry {
  id: string;
  label: string;
  timestamp: string;
  score: number;
  delta: number;
  note: string;
}

export interface AtsKeywordCell {
  keyword: string;
  frequency: number; // 0-10
  importance: number; // 0-10
  present: boolean;
}

export interface AtsRadarAxis {
  axis: string;
  score: number;
  target: number;
}

export interface AtsTimelinePoint {
  label: string;
  score: number;
  keywords: number;
  readability: number;
}

export interface AtsOptimizationEvent {
  id: string;
  time: string;
  title: string;
  detail: string;
  delta: number;
  kind: "keyword" | "format" | "clarity" | "impact";
}

export interface AtsSkill {
  name: string;
  category: "core" | "adjacent" | "tooling" | "leadership";
  confidence: number;
}

export interface AtsRecommendation {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  impact: string;
  section: string;
  effort: "1 min" | "2 min" | "5 min";
}

export interface AtsQuickFix {
  id: string;
  title: string;
  detail: string;
  impact: string;
}

export interface AtsChecklistItem {
  id: string;
  title: string;
  done: boolean;
  group: "content" | "keywords" | "format";
}

export interface AtsResumeVersion {
  id: string;
  name: string;
  updatedAt: string;
  score: number;
  delta: number;
  active?: boolean;
}

export const overallScore = 84;
export const overallDelta = 6;
export const previousScore = 78;

export const resumeHealthMetrics: AtsHealthMetric[] = [
  { id: "kw", label: "Keyword coverage", value: 82, target: 90 },
  { id: "sem", label: "Semantic match", value: 74, target: 85 },
  { id: "fmt", label: "Formatting", value: 91, target: 95 },
  { id: "read", label: "Readability", value: 88, target: 90 },
  { id: "impact", label: "Impact language", value: 76, target: 88 },
];

export const sectionScores: AtsSectionScore[] = [
  {
    id: "summary",
    label: "Summary",
    score: 78,
    weight: 15,
    status: "ok",
    hint: "Cut to 40 words, add north-star metric.",
  },
  {
    id: "experience",
    label: "Experience",
    score: 88,
    weight: 40,
    status: "strong",
    hint: "Quantify 2 more bullets to reach 95.",
  },
  {
    id: "skills",
    label: "Skills",
    score: 72,
    weight: 15,
    status: "ok",
    hint: "Missing: system design, OKRs, SQL dashboards.",
  },
  {
    id: "projects",
    label: "Projects",
    score: 81,
    weight: 10,
    status: "strong",
    hint: "Great signal — add adoption metric.",
  },
  {
    id: "education",
    label: "Education",
    score: 94,
    weight: 10,
    status: "strong",
    hint: "All required fields present.",
  },
  {
    id: "format",
    label: "Formatting",
    score: 91,
    weight: 10,
    status: "strong",
    hint: "ATS-safe layout, no tables or images.",
  },
];

export const keywordHeatmap: AtsKeywordCell[] = [
  { keyword: "product strategy", frequency: 6, importance: 9, present: true },
  { keyword: "roadmap", frequency: 4, importance: 8, present: true },
  { keyword: "experimentation", frequency: 3, importance: 8, present: true },
  { keyword: "A/B testing", frequency: 2, importance: 7, present: true },
  { keyword: "SQL", frequency: 1, importance: 7, present: true },
  { keyword: "LLM evaluation", frequency: 2, importance: 8, present: true },
  { keyword: "system design", frequency: 0, importance: 9, present: false },
  { keyword: "OKRs", frequency: 0, importance: 6, present: false },
  { keyword: "GTM", frequency: 0, importance: 7, present: false },
  { keyword: "retention", frequency: 0, importance: 8, present: false },
  { keyword: "north-star metric", frequency: 0, importance: 7, present: false },
  { keyword: "SQL dashboards", frequency: 0, importance: 6, present: false },
  { keyword: "stakeholder mgmt", frequency: 2, importance: 6, present: true },
  { keyword: "cross-functional", frequency: 3, importance: 7, present: true },
  { keyword: "discovery", frequency: 2, importance: 6, present: true },
  { keyword: "activation", frequency: 3, importance: 8, present: true },
];

export const radarAxes: AtsRadarAxis[] = [
  { axis: "Keywords", score: 82, target: 92 },
  { axis: "Semantic", score: 74, target: 88 },
  { axis: "Impact", score: 76, target: 90 },
  { axis: "Clarity", score: 88, target: 92 },
  { axis: "Format", score: 91, target: 95 },
  { axis: "Recruiter", score: 84, target: 90 },
];

export const scoreTimeline: AtsTimelinePoint[] = [
  { label: "Mon", score: 62, keywords: 58, readability: 72 },
  { label: "Tue", score: 66, keywords: 63, readability: 74 },
  { label: "Wed", score: 71, keywords: 68, readability: 78 },
  { label: "Thu", score: 74, keywords: 72, readability: 80 },
  { label: "Fri", score: 78, keywords: 76, readability: 84 },
  { label: "Sat", score: 82, keywords: 80, readability: 86 },
  { label: "Sun", score: 84, keywords: 82, readability: 88 },
];

export const optimizationTimeline: AtsOptimizationEvent[] = [
  {
    id: "op-1",
    time: "2m ago",
    title: "Rewrote summary",
    detail: "Added north-star metric and tightened to 42 words.",
    delta: 6,
    kind: "clarity",
  },
  {
    id: "op-2",
    time: "18m ago",
    title: "Added 'A/B testing'",
    detail: "Boosted keyword match on 4 target roles.",
    delta: 3,
    kind: "keyword",
  },
  {
    id: "op-3",
    time: "1h ago",
    title: "Quantified API bullet",
    detail: "Replaced 'launched API' with '99.98% uptime, 60k weekly devs'.",
    delta: 4,
    kind: "impact",
  },
  {
    id: "op-4",
    time: "Yesterday",
    title: "Removed 2-column layout",
    detail: "Switched to single-column ATS-safe template.",
    delta: 8,
    kind: "format",
  },
  {
    id: "op-5",
    time: "2 days ago",
    title: "Added Projects section",
    detail: "Surfaced open-source signal for AI-platform roles.",
    delta: 5,
    kind: "impact",
  },
];

export const detectedSkills: AtsSkill[] = [
  { name: "Product strategy", category: "core", confidence: 96 },
  { name: "Roadmapping", category: "core", confidence: 92 },
  { name: "Experimentation", category: "core", confidence: 90 },
  { name: "A/B testing", category: "core", confidence: 88 },
  { name: "SQL", category: "tooling", confidence: 78 },
  { name: "Figma", category: "tooling", confidence: 74 },
  { name: "LLM evaluation", category: "adjacent", confidence: 82 },
  { name: "Stakeholder mgmt", category: "leadership", confidence: 86 },
  { name: "Cross-functional", category: "leadership", confidence: 88 },
];

export const missingSkills: AtsSkill[] = [
  { name: "System design", category: "core", confidence: 0 },
  { name: "OKRs", category: "leadership", confidence: 0 },
  { name: "GTM strategy", category: "adjacent", confidence: 0 },
  { name: "Retention modeling", category: "core", confidence: 0 },
  { name: "SQL dashboards", category: "tooling", confidence: 0 },
];

export const qualityScores = {
  grammar: 96,
  formatting: 91,
  readability: 88,
  recruiter: 84,
  industry: 79,
};

export const compatibilityMatrix = [
  { name: "AI Platform PM", score: 92 },
  { name: "Growth PM", score: 78 },
  { name: "Platform PM", score: 88 },
  { name: "Consumer PM", score: 71 },
  { name: "Enterprise PM", score: 74 },
];

export const criticalIssues: AtsRecommendation[] = [
  {
    id: "crit-1",
    severity: "critical",
    title: "Missing 'system design' in summary",
    detail: "Appears in 78% of matching JDs. Add to Summary and top of Skills.",
    impact: "+6 ATS",
    section: "Summary",
    effort: "1 min",
  },
  {
    id: "crit-2",
    severity: "critical",
    title: "Unquantified impact on Northwind role",
    detail: "Bullet #2 uses no metric. Recruiters skim for numbers first.",
    impact: "+4 ATS",
    section: "Experience",
    effort: "2 min",
  },
];

export const warnings: AtsRecommendation[] = [
  {
    id: "warn-1",
    severity: "warning",
    title: "Summary is 58 words",
    detail: "Target 30–45 words for optimal recruiter skim time.",
    impact: "Readability",
    section: "Summary",
    effort: "2 min",
  },
  {
    id: "warn-2",
    severity: "warning",
    title: "Passive voice detected in 3 bullets",
    detail: "Rewrite in active voice starting with a strong verb.",
    impact: "+2 ATS",
    section: "Experience",
    effort: "5 min",
  },
  {
    id: "warn-3",
    severity: "warning",
    title: "No metrics in Projects",
    detail: "Add adoption or usage numbers to PromptDeck description.",
    impact: "+3 ATS",
    section: "Projects",
    effort: "2 min",
  },
];

export const quickFixes: AtsQuickFix[] = [
  {
    id: "qf-1",
    title: "Add 'system design'",
    detail: "Insert into Skills and Summary.",
    impact: "+6",
  },
  {
    id: "qf-2",
    title: "Tighten summary to 42 words",
    detail: "AI rewrite in your voice.",
    impact: "+3",
  },
  {
    id: "qf-3",
    title: "Quantify Rivera bullet",
    detail: "Suggest '60k weekly devs, 99.98% uptime'.",
    impact: "+4",
  },
  {
    id: "qf-4",
    title: "Standardize date format",
    detail: "Use 'Mon YYYY' across all sections.",
    impact: "+1",
  },
];

export const missingKeywords = [
  "system design",
  "OKRs",
  "GTM",
  "retention",
  "north-star metric",
  "SQL dashboards",
];

export const actionChecklist: AtsChecklistItem[] = [
  { id: "ck-1", title: "Add 'system design' to summary", done: false, group: "keywords" },
  { id: "ck-2", title: "Quantify all Experience bullets", done: false, group: "content" },
  { id: "ck-3", title: "Trim summary to ≤45 words", done: false, group: "content" },
  { id: "ck-4", title: "Replace passive voice", done: false, group: "content" },
  { id: "ck-5", title: "Standardize date format", done: true, group: "format" },
  { id: "ck-6", title: "Remove 2-column layout", done: true, group: "format" },
  { id: "ck-7", title: "Add OKRs to Skills", done: false, group: "keywords" },
];

export const resumeVersions: AtsResumeVersion[] = [
  { id: "v-3", name: "Senior PM · v3", updatedAt: "2m ago", score: 84, delta: 6, active: true },
  { id: "v-2", name: "Senior PM · v2", updatedAt: "Yesterday", score: 78, delta: 3 },
  { id: "v-1", name: "Senior PM · v1", updatedAt: "3 days ago", score: 75, delta: 0 },
  { id: "v-base", name: "Baseline import", updatedAt: "1 week ago", score: 62, delta: 0 },
];

export const history: AtsHistoryEntry[] = [
  {
    id: "h-1",
    label: "Auto rescore",
    timestamp: "just now",
    score: 84,
    delta: 2,
    note: "After summary rewrite",
  },
  {
    id: "h-2",
    label: "Manual edit",
    timestamp: "18m ago",
    score: 82,
    delta: 4,
    note: "Added A/B testing",
  },
  {
    id: "h-3",
    label: "AI quick fix",
    timestamp: "1h ago",
    score: 78,
    delta: 3,
    note: "Quantified API bullet",
  },
  {
    id: "h-4",
    label: "Template swap",
    timestamp: "Yesterday",
    score: 75,
    delta: 8,
    note: "Single-column layout",
  },
  {
    id: "h-5",
    label: "Import",
    timestamp: "1 week ago",
    score: 62,
    delta: 0,
    note: "Baseline resume",
  },
];

export const sectionNav = [
  { id: "analytics", label: "ATS Analytics" },
  { id: "sections", label: "Section Scores" },
  { id: "heatmap", label: "Keyword Heatmap" },
  { id: "radar", label: "Radar Chart" },
  { id: "timeline", label: "Score Trend" },
  { id: "optimization", label: "Optimization Timeline" },
  { id: "frequency", label: "Keyword Frequency" },
  { id: "skills", label: "Skills" },
  { id: "quality", label: "Quality Scores" },
  { id: "compatibility", label: "Compatibility" },
];
