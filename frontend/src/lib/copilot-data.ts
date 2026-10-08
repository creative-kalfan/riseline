// TODO(API): Replace mock data with real backend integrations.
// Integration points are marked with TODO(API) comments throughout.

import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  FileText,
  Gauge,
  Briefcase,
  KanbanSquare,
  Compass,
  Wand2,
  ListChecks,
  Target,
  Mail,
  MessagesSquare,
  TrendingUp,
  GraduationCap,
  Building2,
  ScrollText,
  DollarSign,
  Zap,
  BookOpen,
  Users,
  Search,
} from "lucide-react";

export type CopilotModule =
  | "dashboard"
  | "resumes"
  | "ats"
  | "jobs"
  | "applications"
  | "recommendations"
  | "profile"
  | "settings"
  | "notifications"
  | "general";

export interface CopilotTool {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  prompt: string;
}

export const moduleMeta: Record<CopilotModule, { title: string; icon: LucideIcon; hint: string }> =
  {
    dashboard: { title: "Dashboard", icon: Compass, hint: "Overview & activity" },
    resumes: { title: "Resume Workspace", icon: FileText, hint: "Editor context active" },
    ats: { title: "Match Intelligence", icon: Gauge, hint: "Resume Studio diagnostics active" },
    jobs: { title: "Job Intelligence", icon: Briefcase, hint: "Job feed active" },
    applications: { title: "Applications", icon: KanbanSquare, hint: "Pipeline active" },
    recommendations: { title: "Recommendations", icon: Sparkles, hint: "Match feed active" },
    profile: { title: "Profile", icon: Users, hint: "Career profile active" },
    settings: { title: "Settings", icon: Users, hint: "Preferences active" },
    notifications: { title: "Notifications", icon: Users, hint: "Inbox active" },
    general: { title: "Career Copilot", icon: Sparkles, hint: "Cross-workspace" },
  };

export const resumeTools: CopilotTool[] = [
  {
    id: "r1",
    label: "Improve Summary",
    description: "Rewrite the summary with sharper positioning.",
    icon: Wand2,
    prompt: "Improve my resume summary for the target role.",
  },
  {
    id: "r2",
    label: "Rewrite Experience",
    description: "Turn bullets into outcome-driven statements.",
    icon: ScrollText,
    prompt: "Rewrite my experience bullets using strong metrics and verbs.",
  },
  {
    id: "r3",
    label: "Rewrite Projects",
    description: "Reframe projects around business impact.",
    icon: ScrollText,
    prompt: "Rewrite my projects section for impact.",
  },
  {
    id: "r4",
    label: "Rewrite Skills",
    description: "Group and prioritize skills for ATS.",
    icon: ListChecks,
    prompt: "Reorganize my skills for the target role.",
  },
  {
    id: "r5",
    label: "Tailor Resume",
    description: "Align the resume to a specific JD.",
    icon: Target,
    prompt: "Tailor my resume to the currently selected job.",
  },
  {
    id: "r6",
    label: "Shorten Resume",
    description: "Trim to a single page without losing impact.",
    icon: Wand2,
    prompt: "Shorten my resume to one page.",
  },
  {
    id: "r7",
    label: "Lengthen Resume",
    description: "Expand with substantive achievements.",
    icon: Wand2,
    prompt: "Expand my resume with additional achievements.",
  },
  {
    id: "r8",
    label: "Professional Tone",
    description: "Shift tone to executive polish.",
    icon: Wand2,
    prompt: "Rewrite in a professional executive tone.",
  },
  {
    id: "r9",
    label: "Leadership Tone",
    description: "Emphasize leadership signal.",
    icon: Wand2,
    prompt: "Rewrite emphasizing leadership and ownership.",
  },
  {
    id: "r10",
    label: "Technical Tone",
    description: "Foreground technical depth.",
    icon: Wand2,
    prompt: "Rewrite emphasizing technical depth.",
  },
  {
    id: "r11",
    label: "Generate Achievements",
    description: "Draft new metric-led achievements.",
    icon: Sparkles,
    prompt: "Generate three metric-driven achievements for my last role.",
  },
  {
    id: "r12",
    label: "Fix Grammar",
    description: "Polish spelling and punctuation.",
    icon: Wand2,
    prompt: "Fix grammar and punctuation across the resume.",
  },
  {
    id: "r13",
    label: "Increase ATS Score",
    description: "Boost score with keyword coverage.",
    icon: Gauge,
    prompt: "How can I increase my ATS score?",
  },
];

export const atsTools: CopilotTool[] = [
  {
    id: "a1",
    label: "Explain ATS Score",
    description: "Break down what drove the number.",
    icon: Gauge,
    prompt: "Explain my ATS score in detail.",
  },
  {
    id: "a2",
    label: "Missing Keywords",
    description: "Surface the biggest gaps.",
    icon: Search,
    prompt: "What keywords am I missing?",
  },
  {
    id: "a3",
    label: "Keyword Suggestions",
    description: "Natural places to add them.",
    icon: Sparkles,
    prompt: "Suggest keywords to add and where to place them.",
  },
  {
    id: "a4",
    label: "Formatting Suggestions",
    description: "Structural improvements.",
    icon: ListChecks,
    prompt: "Recommend formatting improvements for ATS.",
  },
  {
    id: "a5",
    label: "Section Analysis",
    description: "Score each section.",
    icon: ListChecks,
    prompt: "Analyze each section individually.",
  },
  {
    id: "a6",
    label: "Industry Comparison",
    description: "Benchmark against peers.",
    icon: TrendingUp,
    prompt: "Compare my resume to industry benchmarks.",
  },
  {
    id: "a7",
    label: "Recruiter Compatibility",
    description: "How a recruiter will read it.",
    icon: Users,
    prompt: "How will a recruiter read this?",
  },
  {
    id: "a8",
    label: "One-click Fix",
    description: "Apply all safe fixes.",
    icon: Zap,
    prompt: "Apply the top ATS fixes automatically.",
  },
];

export const jobTools: CopilotTool[] = [
  {
    id: "j1",
    label: "Why am I a match?",
    description: "Explain fit signals.",
    icon: Target,
    prompt: "Why am I a match for this job?",
  },
  {
    id: "j2",
    label: "Missing Skills",
    description: "Skills gap to close.",
    icon: ListChecks,
    prompt: "What skills am I missing for this role?",
  },
  {
    id: "j3",
    label: "Salary Insights",
    description: "Market comp band.",
    icon: DollarSign,
    prompt: "What is the salary range for this role?",
  },
  {
    id: "j4",
    label: "Interview Probability",
    description: "Estimated callback odds.",
    icon: TrendingUp,
    prompt: "Estimate my interview probability.",
  },
  {
    id: "j5",
    label: "Optimize Resume",
    description: "Tailor for this JD.",
    icon: Wand2,
    prompt: "Optimize my resume for this job.",
  },
  {
    id: "j6",
    label: "Generate Cover Letter",
    description: "Draft a tailored cover letter.",
    icon: Mail,
    prompt: "Generate a cover letter for this job.",
  },
  {
    id: "j7",
    label: "Prepare Interview",
    description: "Question drills + STAR answers.",
    icon: MessagesSquare,
    prompt: "Prepare me for the interview.",
  },
  {
    id: "j8",
    label: "Company Research",
    description: "Snapshot on the company.",
    icon: Building2,
    prompt: "Research this company for me.",
  },
];

export const applicationTools: CopilotTool[] = [
  {
    id: "ap1",
    label: "Follow-up Email",
    description: "Warm, specific nudge.",
    icon: Mail,
    prompt: "Write a follow-up email for this application.",
  },
  {
    id: "ap2",
    label: "Interview Preparation",
    description: "Round-by-round plan.",
    icon: MessagesSquare,
    prompt: "Prepare me for the next interview round.",
  },
  {
    id: "ap3",
    label: "Negotiation Advice",
    description: "Anchor and counter tactics.",
    icon: DollarSign,
    prompt: "Give me negotiation advice for the offer.",
  },
  {
    id: "ap4",
    label: "Application Checklist",
    description: "Everything before submit.",
    icon: ListChecks,
    prompt: "Give me a pre-submit checklist.",
  },
  {
    id: "ap5",
    label: "Timeline Summary",
    description: "Where each app stands.",
    icon: TrendingUp,
    prompt: "Summarize my application timeline.",
  },
];

export const careerTools: CopilotTool[] = [
  {
    id: "c1",
    label: "Career Roadmap",
    description: "12-month growth plan.",
    icon: Compass,
    prompt: "Build me a 12-month career roadmap.",
  },
  {
    id: "c2",
    label: "Learning Recommendations",
    description: "Courses & resources.",
    icon: BookOpen,
    prompt: "Recommend courses for my next role.",
  },
  {
    id: "c3",
    label: "Skill Gap",
    description: "Where to focus first.",
    icon: GraduationCap,
    prompt: "Where are my biggest skill gaps?",
  },
  {
    id: "c4",
    label: "Industry Trends",
    description: "What is shifting now.",
    icon: TrendingUp,
    prompt: "Summarize current industry trends.",
  },
  {
    id: "c5",
    label: "Market Salary",
    description: "Comp bands by geo.",
    icon: DollarSign,
    prompt: "What is the market salary for my level?",
  },
  {
    id: "c6",
    label: "Career Advice",
    description: "Coach-style guidance.",
    icon: Sparkles,
    prompt: "Give me honest career advice.",
  },
];

export function toolsForModule(mod: CopilotModule): CopilotTool[] {
  switch (mod) {
    case "resumes":
      return resumeTools;
    case "ats":
      return atsTools;
    case "jobs":
    case "recommendations":
      return jobTools;
    case "applications":
      return applicationTools;
    default:
      return careerTools;
  }
}

export const suggestedPrompts: string[] = [
  "Improve my resume",
  "Tailor for Google",
  "Tailor for Microsoft",
  "Increase ATS Score",
  "Explain ATS report",
  "Generate Cover Letter",
  "Prepare Interview",
  "Rewrite Bullet Points",
  "Find Missing Skills",
  "Career Advice",
];

export const pinnedPrompts: string[] = [
  "Rewrite my last role for impact",
  "Increase ATS score to 90+",
  "Draft a follow-up for Northstar AI",
];

export interface RecentFile {
  id: string;
  name: string;
  kind: "resume" | "job" | "ats" | "application";
  meta: string;
}

export const recentFiles: RecentFile[] = [
  { id: "rf1", name: "Senior PM Resume", kind: "resume", meta: "Edited 2m ago" },
  { id: "rf2", name: "Growth PM — Consumer", kind: "resume", meta: "Yesterday" },
  { id: "rf3", name: "ATS Report · v14", kind: "ats", meta: "Score 84" },
  { id: "rf4", name: "Northstar AI · Senior PM", kind: "job", meta: "88% match" },
  { id: "rf5", name: "Linear · Product Lead", kind: "job", meta: "82% match" },
  { id: "rf6", name: "Notion · Follow-up", kind: "application", meta: "Interview stage" },
];

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  pinned?: boolean;
  card?: ResponseCard;
}

export type ResponseCard =
  | {
      type: "ats";
      title: string;
      score: number;
      delta: number;
      keywords: { matched: string[]; missing: string[] };
    }
  | {
      type: "checklist";
      title: string;
      items: { label: string; done: boolean }[];
    }
  | {
      type: "table";
      title: string;
      columns: string[];
      rows: string[][];
    }
  | {
      type: "job-match";
      title: string;
      company: string;
      score: number;
      factors: { label: string; value: number }[];
    };

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  module: CopilotModule;
  pinned?: boolean;
  archived?: boolean;
  favorite?: boolean;
  messages: ChatMessage[];
}

export function moduleFromPath(pathname: string): CopilotModule {
  if (pathname.startsWith("/resumes")) return "resumes";
  if (pathname.startsWith("/ats")) return "resumes";
  if (pathname.startsWith("/jobs")) return "jobs";
  if (pathname.startsWith("/applications")) return "applications";
  if (pathname.startsWith("/recommendations")) return "recommendations";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  return "general";
}
