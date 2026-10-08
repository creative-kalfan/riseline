// Mock data layer for Mission Control (Applications tracker).
// TODO(API): swap each export for a real server function / DB read.

export type Stage =
  "saved" | "applied" | "assessment" | "interview" | "offer" | "accepted" | "rejected" | "archived";

export const stages: { id: Stage; label: string; tone: string }[] = [
  { id: "saved", label: "Saved", tone: "text-muted-foreground bg-muted/50 ring-border/60" },
  { id: "applied", label: "Applied", tone: "text-primary bg-primary/10 ring-primary/20" },
  { id: "assessment", label: "Assessment", tone: "text-accent bg-accent/10 ring-accent/25" },
  { id: "interview", label: "Interview", tone: "text-warning bg-warning/10 ring-warning/25" },
  { id: "offer", label: "Offer", tone: "text-success bg-success/10 ring-success/20" },
  { id: "accepted", label: "Accepted", tone: "text-success bg-success/15 ring-success/25" },
  {
    id: "rejected",
    label: "Rejected",
    tone: "text-destructive bg-destructive/10 ring-destructive/20",
  },
  { id: "archived", label: "Archived", tone: "text-muted-foreground bg-muted/40 ring-border/60" },
];

export interface Contact {
  id: string;
  name: string;
  role: string;
  email?: string;
  last?: string;
}
export interface Attachment {
  id: string;
  name: string;
  kind: "resume" | "cover" | "portfolio" | "other";
  size: string;
}
export interface HistoryEntry {
  id: string;
  time: string;
  title: string;
  detail: string;
  kind: "status" | "message" | "note" | "interview" | "task";
}
export interface InterviewRound {
  id: string;
  name: string;
  when: string;
  interviewer?: string;
  status: "scheduled" | "done" | "upcoming" | "canceled";
  notes?: string;
}
export interface AssessmentTask {
  id: string;
  label: string;
  due: string;
  status: "pending" | "submitted" | "graded";
}

export interface Application {
  id: string;
  company: string;
  logo: string; // emoji/mono initial
  role: string;
  location: string;
  salary: string;
  stage: Stage;
  match: number; // 0-100
  favorite?: boolean;
  postedAt: string;
  updatedAt: string;
  nextAction?: { label: string; when: string; urgency: "today" | "soon" | "later" };
  recruiter?: Contact;
  contacts: Contact[];
  notes: string;
  attachments: Attachment[];
  history: HistoryEntry[];
  interviews: InterviewRound[];
  assessments: AssessmentTask[];
  culture?: string;
  glassdoor?: number;
  progress: number; // 0-100 pipeline progress
}

export interface FollowUp {
  id: string;
  company: string;
  role: string;
  due: string;
  kind: "email" | "call" | "message" | "task";
  status: "pending" | "completed";
  note: string;
}

export interface CalendarEvent {
  id: string;
  day: number;
  month: number;
  year: number;
  hour?: number;
  title: string;
  company: string;
  kind: "interview" | "deadline" | "followup" | "assessment";
}

export interface QuestionBankItem {
  id: string;
  question: string;
  tag: "behavioral" | "system" | "product" | "coding" | "culture";
}

export const applications: Application[] = [
  {
    id: "app-northwind",
    company: "Northwind Labs",
    logo: "N",
    role: "Senior Product Manager, AI Platform",
    location: "San Francisco · Hybrid",
    salary: "$180k – $220k + equity",
    stage: "interview",
    match: 92,
    favorite: true,
    postedAt: "5 days ago",
    updatedAt: "2h ago",
    nextAction: { label: "Onsite interview panel", when: "Wed 10:00 AM", urgency: "soon" },
    recruiter: {
      id: "c-nw-1",
      name: "Priya Menon",
      role: "Talent Partner",
      email: "priya@northwind.co",
      last: "2h ago",
    },
    contacts: [
      { id: "c-nw-1", name: "Priya Menon", role: "Talent Partner", last: "2h ago" },
      { id: "c-nw-2", name: "Dan Ortega", role: "Hiring Manager, AI Platform", last: "Yesterday" },
    ],
    notes:
      "Panel loves the PromptDeck story. Prep a 5-min system-design walkthrough + retention framework.",
    attachments: [
      { id: "at-1", name: "resume-northwind-v3.pdf", kind: "resume", size: "182 KB" },
      { id: "at-2", name: "cover-letter.pdf", kind: "cover", size: "94 KB" },
    ],
    history: [
      {
        id: "h-1",
        time: "2h ago",
        title: "Onsite scheduled",
        detail: "Wed 10:00 AM · 4-round panel",
        kind: "interview",
      },
      {
        id: "h-2",
        time: "Yesterday",
        title: "Recruiter screen",
        detail: "45 min with Priya. Positive.",
        kind: "interview",
      },
      {
        id: "h-3",
        time: "3 days ago",
        title: "Applied",
        detail: "Submitted tailored resume v3.",
        kind: "status",
      },
    ],
    interviews: [
      {
        id: "iv-1",
        name: "Recruiter screen",
        when: "Yesterday · 3:00 PM",
        interviewer: "Priya Menon",
        status: "done",
        notes: "Went well. Next: onsite.",
      },
      {
        id: "iv-2",
        name: "Hiring manager",
        when: "Wed · 10:00 AM",
        interviewer: "Dan Ortega",
        status: "scheduled",
      },
      { id: "iv-3", name: "Panel + system design", when: "Wed · 11:00 AM", status: "scheduled" },
      { id: "iv-4", name: "Bar raiser", when: "Wed · 2:00 PM", status: "scheduled" },
    ],
    assessments: [],
    culture: "Ship-fast, research-driven. 4-day in-office.",
    glassdoor: 4.3,
    progress: 70,
  },
  {
    id: "app-stripe",
    company: "Stripe",
    logo: "S",
    role: "Senior PM, Billing",
    location: "Remote · US",
    salary: "$210k – $260k",
    stage: "assessment",
    match: 88,
    postedAt: "1 week ago",
    updatedAt: "1d ago",
    nextAction: { label: "Take-home due Friday", when: "Fri 5:00 PM", urgency: "soon" },
    recruiter: { id: "c-st-1", name: "Marcus Wei", role: "Recruiter", last: "1d ago" },
    contacts: [{ id: "c-st-1", name: "Marcus Wei", role: "Recruiter" }],
    notes: "Take-home: design a metering system for usage-based pricing. Focus on edge cases.",
    attachments: [{ id: "at-3", name: "resume-stripe.pdf", kind: "resume", size: "176 KB" }],
    history: [
      {
        id: "h-4",
        time: "1d ago",
        title: "Assessment sent",
        detail: "Take-home due Friday.",
        kind: "task",
      },
      {
        id: "h-5",
        time: "3d ago",
        title: "Recruiter reply",
        detail: "Fast-tracked to assessment.",
        kind: "message",
      },
      {
        id: "h-6",
        time: "1w ago",
        title: "Applied",
        detail: "Referral via Marcus.",
        kind: "status",
      },
    ],
    interviews: [],
    assessments: [
      { id: "as-1", label: "Metering system design", due: "Fri 5:00 PM", status: "pending" },
    ],
    culture: "Rigorous docs, high autonomy.",
    glassdoor: 4.5,
    progress: 45,
  },
  {
    id: "app-notion",
    company: "Notion",
    logo: "◆",
    role: "Product Lead, Growth",
    location: "New York · Hybrid",
    salary: "$195k – $235k",
    stage: "applied",
    match: 84,
    postedAt: "3 days ago",
    updatedAt: "3h ago",
    nextAction: { label: "Follow up with recruiter", when: "Today", urgency: "today" },
    recruiter: { id: "c-no-1", name: "Elena Park", role: "Sr Recruiter", last: "3d ago" },
    contacts: [{ id: "c-no-1", name: "Elena Park", role: "Sr Recruiter" }],
    notes: "Growth focus on activation. Tie to the Northwind onboarding case study.",
    attachments: [{ id: "at-4", name: "resume-notion.pdf", kind: "resume", size: "179 KB" }],
    history: [
      {
        id: "h-7",
        time: "3h ago",
        title: "Applied",
        detail: "Tailored resume v3 · cover letter attached.",
        kind: "status",
      },
    ],
    interviews: [],
    assessments: [],
    culture: "Craft-obsessed. Low-ego.",
    glassdoor: 4.2,
    progress: 20,
  },
  {
    id: "app-linear",
    company: "Linear",
    logo: "L",
    role: "Product Manager, Platform",
    location: "Remote",
    salary: "$190k – $230k",
    stage: "offer",
    match: 90,
    postedAt: "3 weeks ago",
    updatedAt: "6h ago",
    nextAction: { label: "Respond to offer", when: "Mon", urgency: "soon" },
    recruiter: { id: "c-li-1", name: "Sana Ahmed", role: "Head of Talent", last: "6h ago" },
    contacts: [{ id: "c-li-1", name: "Sana Ahmed", role: "Head of Talent" }],
    notes: "Verbal offer received. Base $215k + 0.08% equity. Negotiation window until Monday.",
    attachments: [{ id: "at-5", name: "offer-letter-draft.pdf", kind: "other", size: "88 KB" }],
    history: [
      {
        id: "h-8",
        time: "6h ago",
        title: "Offer extended",
        detail: "Verbal offer. Written by Friday.",
        kind: "status",
      },
      {
        id: "h-9",
        time: "1w ago",
        title: "Final round",
        detail: "5 interviews. Strong signal.",
        kind: "interview",
      },
    ],
    interviews: [
      {
        id: "iv-5",
        name: "Final round",
        when: "1 week ago",
        status: "done",
        notes: "Strong signal from all interviewers.",
      },
    ],
    assessments: [],
    culture: "Small, tight, opinionated.",
    glassdoor: 4.6,
    progress: 90,
  },
  {
    id: "app-vercel",
    company: "Vercel",
    logo: "▲",
    role: "PM, DX Platform",
    location: "Remote",
    salary: "$185k – $225k",
    stage: "saved",
    match: 87,
    favorite: true,
    postedAt: "Today",
    updatedAt: "Today",
    nextAction: { label: "Apply", when: "This week", urgency: "later" },
    contacts: [],
    notes: "Great DX angle. Wait for referral from Marcus before applying.",
    attachments: [],
    history: [
      {
        id: "h-10",
        time: "Today",
        title: "Saved",
        detail: "Added from Jobs workspace.",
        kind: "status",
      },
    ],
    interviews: [],
    assessments: [],
    culture: "Move fast. Ship in public.",
    glassdoor: 4.1,
    progress: 5,
  },
  {
    id: "app-figma",
    company: "Figma",
    logo: "F",
    role: "PM, Platform Extensions",
    location: "San Francisco",
    salary: "$200k – $245k",
    stage: "saved",
    match: 82,
    postedAt: "6 days ago",
    updatedAt: "Yesterday",
    nextAction: { label: "Saved job expires", when: "Tomorrow", urgency: "today" },
    contacts: [],
    notes: "",
    attachments: [],
    history: [{ id: "h-11", time: "6d ago", title: "Saved", detail: "Match 82.", kind: "status" }],
    interviews: [],
    assessments: [],
    glassdoor: 4.4,
    progress: 5,
  },
  {
    id: "app-airbnb",
    company: "Airbnb",
    logo: "A",
    role: "PM, Guest Trust",
    location: "Remote · US",
    salary: "$175k – $215k",
    stage: "rejected",
    match: 74,
    postedAt: "4 weeks ago",
    updatedAt: "1w ago",
    contacts: [],
    notes: "Rejected after recruiter screen. Feedback: seniority mismatch.",
    attachments: [],
    history: [
      {
        id: "h-12",
        time: "1w ago",
        title: "Rejected",
        detail: "Seniority mismatch — try Sr PM roles.",
        kind: "status",
      },
      {
        id: "h-13",
        time: "3w ago",
        title: "Recruiter screen",
        detail: "30 min.",
        kind: "interview",
      },
    ],
    interviews: [],
    assessments: [],
    progress: 20,
  },
  {
    id: "app-datadog",
    company: "Datadog",
    logo: "D",
    role: "Sr PM, Observability",
    location: "New York · Hybrid",
    salary: "$205k – $250k",
    stage: "applied",
    match: 81,
    postedAt: "2 days ago",
    updatedAt: "1d ago",
    nextAction: { label: "Follow up with recruiter", when: "Fri", urgency: "later" },
    contacts: [],
    notes: "",
    attachments: [{ id: "at-6", name: "resume-datadog.pdf", kind: "resume", size: "180 KB" }],
    history: [
      { id: "h-14", time: "1d ago", title: "Applied", detail: "Tailored resume.", kind: "status" },
    ],
    interviews: [],
    assessments: [],
    glassdoor: 4.0,
    progress: 20,
  },
  {
    id: "app-openai",
    company: "OpenAI",
    logo: "◎",
    role: "PM, Developer Platform",
    location: "San Francisco",
    salary: "$230k – $290k",
    stage: "assessment",
    match: 89,
    favorite: true,
    postedAt: "5 days ago",
    updatedAt: "2d ago",
    nextAction: { label: "Product exercise due", when: "Sat", urgency: "soon" },
    contacts: [{ id: "c-oa-1", name: "Jules Marin", role: "Recruiter" }],
    notes: "Product exercise: prioritize the next 3 features for the Assistants API.",
    attachments: [],
    history: [
      {
        id: "h-15",
        time: "2d ago",
        title: "Assessment sent",
        detail: "Due Saturday.",
        kind: "task",
      },
      {
        id: "h-16",
        time: "5d ago",
        title: "Applied",
        detail: "Direct via careers page.",
        kind: "status",
      },
    ],
    interviews: [],
    assessments: [{ id: "as-2", label: "Product exercise", due: "Sat", status: "pending" }],
    glassdoor: 4.4,
    progress: 40,
  },
  {
    id: "app-anthropic",
    company: "Anthropic",
    logo: "*",
    role: "PM, Applied AI",
    location: "San Francisco",
    salary: "$225k – $280k",
    stage: "interview",
    match: 91,
    postedAt: "2 weeks ago",
    updatedAt: "4h ago",
    nextAction: { label: "Technical round", when: "Thu 4:00 PM", urgency: "soon" },
    contacts: [{ id: "c-an-1", name: "Rita Cho", role: "Recruiter" }],
    notes: "Technical round with Claude research PM. Prep evals + safety frame.",
    attachments: [],
    history: [
      {
        id: "h-17",
        time: "4h ago",
        title: "Technical scheduled",
        detail: "Thu 4:00 PM.",
        kind: "interview",
      },
      {
        id: "h-18",
        time: "2d ago",
        title: "Recruiter screen",
        detail: "Strong.",
        kind: "interview",
      },
    ],
    interviews: [
      { id: "iv-6", name: "Recruiter screen", when: "2d ago", status: "done" },
      { id: "iv-7", name: "Technical round", when: "Thu 4:00 PM", status: "scheduled" },
    ],
    assessments: [],
    glassdoor: 4.5,
    progress: 55,
  },
  {
    id: "app-github",
    company: "GitHub",
    logo: "G",
    role: "PM, Copilot Enterprise",
    location: "Remote",
    salary: "$200k – $240k",
    stage: "accepted",
    match: 86,
    postedAt: "6 weeks ago",
    updatedAt: "1w ago",
    contacts: [],
    notes: "Contract signed for consulting engagement — kept for records.",
    attachments: [],
    history: [
      {
        id: "h-19",
        time: "1w ago",
        title: "Accepted",
        detail: "Consulting contract.",
        kind: "status",
      },
    ],
    interviews: [],
    assessments: [],
    progress: 100,
  },
  {
    id: "app-shopify",
    company: "Shopify",
    logo: "◐",
    role: "PM, Merchant Growth",
    location: "Remote · Canada",
    salary: "$180k – $220k",
    stage: "archived",
    match: 70,
    postedAt: "5 weeks ago",
    updatedAt: "3w ago",
    contacts: [],
    notes: "Archived — location constraint.",
    attachments: [],
    history: [
      {
        id: "h-20",
        time: "3w ago",
        title: "Archived",
        detail: "Location constraint.",
        kind: "status",
      },
    ],
    interviews: [],
    assessments: [],
    progress: 10,
  },
];

export const followUps: FollowUp[] = [
  {
    id: "fu-1",
    company: "Notion",
    role: "Product Lead, Growth",
    due: "Today",
    kind: "email",
    status: "pending",
    note: "Recruiter went quiet after Monday.",
  },
  {
    id: "fu-2",
    company: "Datadog",
    role: "Sr PM, Observability",
    due: "Fri",
    kind: "message",
    status: "pending",
    note: "Thank-you note after recruiter screen.",
  },
  {
    id: "fu-3",
    company: "Stripe",
    role: "Senior PM, Billing",
    due: "Sat",
    kind: "task",
    status: "pending",
    note: "Submit take-home.",
  },
  {
    id: "fu-4",
    company: "Northwind Labs",
    role: "Sr PM, AI Platform",
    due: "Yesterday",
    kind: "email",
    status: "completed",
    note: "Thanked Priya post-screen.",
  },
];

export const calendarEvents: CalendarEvent[] = [
  {
    id: "ev-1",
    day: 8,
    month: 6,
    year: 2026,
    hour: 15,
    title: "Follow up · Notion",
    company: "Notion",
    kind: "followup",
  },
  {
    id: "ev-2",
    day: 10,
    month: 6,
    year: 2026,
    hour: 10,
    title: "Northwind onsite panel",
    company: "Northwind",
    kind: "interview",
  },
  {
    id: "ev-3",
    day: 11,
    month: 6,
    year: 2026,
    hour: 16,
    title: "Anthropic technical",
    company: "Anthropic",
    kind: "interview",
  },
  {
    id: "ev-4",
    day: 12,
    month: 6,
    year: 2026,
    hour: 17,
    title: "Stripe take-home due",
    company: "Stripe",
    kind: "deadline",
  },
  {
    id: "ev-5",
    day: 13,
    month: 6,
    year: 2026,
    title: "OpenAI product exercise",
    company: "OpenAI",
    kind: "assessment",
  },
  {
    id: "ev-6",
    day: 15,
    month: 6,
    year: 2026,
    title: "Respond to Linear offer",
    company: "Linear",
    kind: "deadline",
  },
];

export const questionBank: QuestionBankItem[] = [
  { id: "qb-1", question: "Walk me through your most impactful launch.", tag: "behavioral" },
  { id: "qb-2", question: "Design a metering system for usage-based pricing.", tag: "system" },
  {
    id: "qb-3",
    question: "How would you prioritize the next 3 features for Assistants API?",
    tag: "product",
  },
  {
    id: "qb-4",
    question: "Tell me about a time you disagreed with a senior stakeholder.",
    tag: "behavioral",
  },
  { id: "qb-5", question: "What's your framework for evaluating LLM quality?", tag: "product" },
  { id: "qb-6", question: "Why this company, why now?", tag: "culture" },
];

export const prepChecklist = [
  { id: "pc-1", label: "Re-read the JD and highlight signals", done: true },
  { id: "pc-2", label: "Prepare 3 STAR stories", done: true },
  { id: "pc-3", label: "Draft 5 questions for the interviewer", done: false },
  { id: "pc-4", label: "Practice system-design out loud (15 min)", done: false },
  { id: "pc-5", label: "Test camera, mic, lighting", done: false },
];

export const aiTips = [
  {
    id: "tip-1",
    kind: "prep",
    title: "Interview prep · Northwind",
    detail: "Panel is heavy on evaluation frameworks. Lead with PromptDeck.",
  },
  {
    id: "tip-2",
    kind: "resume",
    title: "Tighten resume for Stripe",
    detail: "Add usage-based pricing keyword to Skills.",
  },
  {
    id: "tip-3",
    kind: "research",
    title: "Company research · Anthropic",
    detail: "Latest safety paper released Monday — mention it.",
  },
  {
    id: "tip-4",
    kind: "negotiation",
    title: "Negotiation · Linear",
    detail: "Base is competitive. Push equity refresh at year 2.",
  },
  {
    id: "tip-5",
    kind: "followup",
    title: "Follow-up · Notion",
    detail: "3 days silent — send a value-add nudge today.",
  },
];

export const careerStats = {
  applications: applications.filter((a) => a.stage !== "saved" && a.stage !== "archived").length,
  interviewRate: 42, // %
  offerRate: 18,
  acceptanceRate: 100,
  streakDays: 12,
  activeThisWeek: 6,
};

export const sidebarFilters = [
  {
    id: "all",
    label: "All applications",
    stages: ["applied", "assessment", "interview", "offer", "accepted", "rejected"] as Stage[],
  },
  { id: "interviews", label: "Interviews", stages: ["interview"] as Stage[] },
  { id: "assessments", label: "Assessments", stages: ["assessment"] as Stage[] },
  { id: "offers", label: "Offers", stages: ["offer", "accepted"] as Stage[] },
  { id: "rejected", label: "Rejected", stages: ["rejected"] as Stage[] },
  { id: "archived", label: "Archived", stages: ["archived"] as Stage[] },
  { id: "saved", label: "Saved", stages: ["saved"] as Stage[] },
  { id: "bookmarks", label: "Bookmarks", stages: [] as Stage[], favorites: true },
];
