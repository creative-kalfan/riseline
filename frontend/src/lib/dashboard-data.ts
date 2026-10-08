// Mock data layer for the Career Command Center dashboard.
// TODO(API): replace each export with a real server function / API call.

export interface PriorityCard {
  id: string;
  kind: "resume" | "jobs" | "followup" | "interview" | "skills" | "expiring";
  title: string;
  detail: string;
  meta: string;
  cta: string;
  href: string;
  accent: "primary" | "success" | "warning" | "destructive" | "accent";
  count?: number;
}

export interface TrendPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface StatusSlice {
  label: string;
  value: number;
  color: string;
}

export interface ActivityHeat {
  day: string;
  values: number[];
}

export interface SkillGap {
  skill: string;
  current: number;
  target: number;
  jobs: number;
}

export interface CareerGoal {
  id: string;
  label: string;
  progress: number;
  target: string;
}

export interface Recommendation {
  id: string;
  kind: "job" | "resume" | "learning" | "insight" | "interview";
  title: string;
  detail: string;
  meta: string;
  score?: number;
}

export interface TimelineEvent {
  id: string;
  kind: "resume" | "ats" | "job" | "application" | "interview";
  title: string;
  detail: string;
  time: string;
}

export interface UpcomingItem {
  id: string;
  kind: "interview" | "deadline" | "followup" | "expiring";
  title: string;
  detail: string;
  when: string;
  urgency: "today" | "soon" | "later";
}

export interface Achievement {
  id: string;
  title: string;
  detail: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export interface CareerInsight {
  id: string;
  text: string;
  emphasis: string;
  kind: "trend" | "opportunity" | "gap";
}

export const currentUser = {
  firstName: "Alex",
  greeting: "Good morning",
  streakDays: 12,
};

export const healthScore = {
  overall: 82,
  delta: 4,
  resume: 84,
  ats: 84,
  applications: 78,
  skills: 71,
  weeklyProgress: 68,
  weeklyGoalLabel: "5 of 7 daily actions",
};

export const priorities: PriorityCard[] = [
  {
    id: "p-resume",
    kind: "resume",
    title: "Finish optimizing Senior PM resume",
    detail: "3 quick fixes will lift ATS from 84 → 91.",
    meta: "5 min · +7 ATS",
    cta: "Continue",
    href: "/resumes/senior-pm-2026",
    accent: "primary",
  },
  {
    id: "p-jobs",
    kind: "jobs",
    title: "8 new matches above 90%",
    detail: "Northstar AI, Linear, Vercel and 5 more.",
    meta: "8 roles · fresh today",
    cta: "Review",
    href: "/jobs",
    accent: "success",
    count: 8,
  },
  {
    id: "p-followup",
    kind: "followup",
    title: "4 applications awaiting follow-up",
    detail: "Stripe and Notion sent updates 3 days ago.",
    meta: "4 pending",
    cta: "Follow up",
    href: "/applications",
    accent: "warning",
    count: 4,
  },
  {
    id: "p-interview",
    kind: "interview",
    title: "Prep for Northwind interview",
    detail: "Onsite in 2 days. AI has a tailored prep plan.",
    meta: "Wed · 10:00 AM",
    cta: "Prepare",
    href: "/recommendations",
    accent: "accent",
  },
  {
    id: "p-skills",
    kind: "skills",
    title: "Resume missing 3 in-demand skills",
    detail: "System design, OKRs, retention modeling.",
    meta: "in 78% of target JDs",
    cta: "Add skills",
    href: "/resumes/senior-pm-2026",
    accent: "destructive",
    count: 3,
  },
  {
    id: "p-expiring",
    kind: "expiring",
    title: "2 saved jobs expire in 24h",
    detail: "Airbnb PM and Figma Platform PM.",
    meta: "expires tomorrow",
    cta: "Open",
    href: "/jobs",
    accent: "warning",
    count: 2,
  },
];

export const resumeHealthTrend: TrendPoint[] = [
  { label: "W1", value: 62 },
  { label: "W2", value: 66 },
  { label: "W3", value: 71 },
  { label: "W4", value: 74 },
  { label: "W5", value: 78 },
  { label: "W6", value: 82 },
  { label: "W7", value: 84 },
];

export const atsTrend: TrendPoint[] = [
  { label: "Mon", value: 76, secondary: 70 },
  { label: "Tue", value: 78, secondary: 72 },
  { label: "Wed", value: 79, secondary: 74 },
  { label: "Thu", value: 81, secondary: 76 },
  { label: "Fri", value: 83, secondary: 78 },
  { label: "Sat", value: 84, secondary: 80 },
  { label: "Sun", value: 84, secondary: 82 },
];

export const applicationsByStatus: StatusSlice[] = [
  { label: "Applied", value: 14, color: "hsl(var(--primary))" },
  { label: "Screening", value: 6, color: "hsl(var(--accent))" },
  { label: "Interview", value: 3, color: "hsl(var(--success))" },
  { label: "Offer", value: 1, color: "hsl(var(--warning))" },
  { label: "Rejected", value: 4, color: "hsl(var(--muted-foreground))" },
];

export const weeklyActivity: ActivityHeat[] = [
  { day: "Mon", values: [1, 2, 3, 2, 4, 3, 2] },
  { day: "Tue", values: [2, 3, 4, 3, 2, 4, 3] },
  { day: "Wed", values: [1, 2, 2, 4, 3, 2, 4] },
  { day: "Thu", values: [3, 4, 3, 2, 4, 3, 2] },
  { day: "Fri", values: [2, 3, 4, 3, 4, 4, 3] },
  { day: "Sat", values: [0, 1, 2, 1, 2, 3, 2] },
  { day: "Sun", values: [0, 0, 1, 2, 1, 2, 1] },
];

export const jobMatchDistribution: StatusSlice[] = [
  { label: "90-100", value: 8, color: "hsl(var(--success))" },
  { label: "80-89", value: 17, color: "hsl(var(--primary))" },
  { label: "70-79", value: 24, color: "hsl(var(--accent))" },
  { label: "<70", value: 12, color: "hsl(var(--muted-foreground))" },
];

export const skillGaps: SkillGap[] = [
  { skill: "System design", current: 60, target: 90, jobs: 28 },
  { skill: "OKRs", current: 40, target: 80, jobs: 14 },
  { skill: "Retention modeling", current: 30, target: 75, jobs: 11 },
  { skill: "Docker", current: 25, target: 70, jobs: 18 },
  { skill: "SQL dashboards", current: 55, target: 85, jobs: 9 },
];

export const careerGoals: CareerGoal[] = [
  { id: "g-1", label: "Land Senior PM role", progress: 62, target: "Q3 2026" },
  { id: "g-2", label: "Hit ATS 90 across resumes", progress: 78, target: "This month" },
  { id: "g-3", label: "Submit 25 applications", progress: 56, target: "This month" },
  { id: "g-4", label: "Complete 5 mock interviews", progress: 40, target: "6 weeks" },
];

export const recommendations: Recommendation[] = [
  {
    id: "r-1",
    kind: "job",
    title: "Northstar AI · Senior PM, AI Platform",
    detail: "92% match. SF hybrid. Series C · $180-220k.",
    meta: "Top match",
    score: 92,
  },
  {
    id: "r-2",
    kind: "resume",
    title: "Quantify the Rivera API bullet",
    detail: "Adds '60k weekly devs, 99.98% uptime'. +4 ATS.",
    meta: "1 min · high impact",
  },
  {
    id: "r-3",
    kind: "learning",
    title: "System design for PMs (2h course)",
    detail: "Closes your #1 skill gap across 28 target roles.",
    meta: "2h · Frontend Masters",
  },
  {
    id: "r-4",
    kind: "insight",
    title: "Apply Thursdays for +18% reply rate",
    detail: "Your recruiter response peaks mid-week.",
    meta: "Career insight",
  },
  {
    id: "r-5",
    kind: "interview",
    title: "Behavioral prep · Northwind onsite",
    detail: "12 tailored questions based on the JD.",
    meta: "Wed 10:00 AM",
  },
];

export const timeline: TimelineEvent[] = [
  {
    id: "t-1",
    kind: "resume",
    title: "Edited Senior PM resume",
    detail: "Rewrote summary and added north-star metric.",
    time: "2m ago",
  },
  {
    id: "t-2",
    kind: "ats",
    title: "ATS score reached 84",
    detail: "+6 vs last week. Best all-time.",
    time: "8m ago",
  },
  {
    id: "t-3",
    kind: "job",
    title: "Saved 3 jobs from Vercel, Linear, Stripe",
    detail: "All above 88% match.",
    time: "1h ago",
  },
  {
    id: "t-4",
    kind: "application",
    title: "Submitted application to Notion",
    detail: "Product Lead · Growth. Tailored resume v3.",
    time: "3h ago",
  },
  {
    id: "t-5",
    kind: "interview",
    title: "Northwind interview scheduled",
    detail: "Wednesday · 10:00 AM onsite.",
    time: "Yesterday",
  },
  {
    id: "t-6",
    kind: "ats",
    title: "Removed 2-column layout",
    detail: "ATS-safe template. +8 formatting.",
    time: "2d ago",
  },
];

export const upcoming: UpcomingItem[] = [
  {
    id: "u-1",
    kind: "interview",
    title: "Northwind Labs · Onsite",
    detail: "Panel: PM, Eng, Design",
    when: "Wed 10:00 AM",
    urgency: "soon",
  },
  {
    id: "u-2",
    kind: "deadline",
    title: "Stripe application deadline",
    detail: "Senior PM, Billing",
    when: "Fri",
    urgency: "soon",
  },
  {
    id: "u-3",
    kind: "followup",
    title: "Follow up with Notion recruiter",
    detail: "3 days since last message",
    when: "Today",
    urgency: "today",
  },
  {
    id: "u-4",
    kind: "expiring",
    title: "Airbnb PM saved job expiring",
    detail: "Auto-archive in 24h",
    when: "Tomorrow",
    urgency: "today",
  },
  {
    id: "u-5",
    kind: "interview",
    title: "Mock interview with Copilot",
    detail: "System design round",
    when: "Sat 3:00 PM",
    urgency: "later",
  },
];

export const achievements: Achievement[] = [
  {
    id: "a-1",
    title: "First resume uploaded",
    detail: "Kicked off your CareerOS journey.",
    earned: true,
    earnedAt: "3 weeks ago",
    tier: "bronze",
  },
  {
    id: "a-2",
    title: "ATS above 80",
    detail: "Crossed the recruiter-safe threshold.",
    earned: true,
    earnedAt: "Yesterday",
    tier: "silver",
  },
  {
    id: "a-3",
    title: "ATS above 90",
    detail: "Elite resume quality — top 8%.",
    earned: false,
    progress: 84,
    tier: "gold",
  },
  {
    id: "a-4",
    title: "10 applications submitted",
    detail: "Momentum matters.",
    earned: true,
    earnedAt: "5 days ago",
    tier: "silver",
  },
  {
    id: "a-5",
    title: "First interview scheduled",
    detail: "You made it to the room.",
    earned: true,
    earnedAt: "Yesterday",
    tier: "gold",
  },
  {
    id: "a-6",
    title: "12-day career streak",
    detail: "Daily action, compounding results.",
    earned: true,
    earnedAt: "Today",
    tier: "platinum",
  },
  {
    id: "a-7",
    title: "Skill mastery: Product strategy",
    detail: "Confidence 96 across target roles.",
    earned: true,
    earnedAt: "1 week ago",
    tier: "gold",
  },
  {
    id: "a-8",
    title: "25 applications submitted",
    detail: "Long-run consistency unlock.",
    earned: false,
    progress: 56,
    tier: "platinum",
  },
];

export const insights: CareerInsight[] = [
  {
    id: "i-1",
    text: "Applications increase 23% when ATS exceeds 85.",
    emphasis: "+23%",
    kind: "trend",
  },
  {
    id: "i-2",
    text: "You are competitive for 42 new roles this week.",
    emphasis: "42 roles",
    kind: "opportunity",
  },
  {
    id: "i-3",
    text: "You are missing Docker in 18 target jobs.",
    emphasis: "18 jobs",
    kind: "gap",
  },
  {
    id: "i-4",
    text: "Recruiter reply rate peaks Thursdays for your profile.",
    emphasis: "Thursdays",
    kind: "trend",
  },
];

export const quickActions = [
  { id: "qa-1", label: "Upload resume", icon: "upload", href: "/resumes" },
  { id: "qa-2", label: "Search jobs", icon: "search", href: "/jobs" },
  { id: "qa-3", label: "Optimize resume", icon: "sparkles", href: "/resumes" },
  { id: "qa-4", label: "Cover letter", icon: "file", href: "/recommendations" },
  { id: "qa-5", label: "Open Copilot", icon: "bot", href: "#copilot" },
  { id: "qa-6", label: "Application tracker", icon: "kanban", href: "/applications" },
] as const;
