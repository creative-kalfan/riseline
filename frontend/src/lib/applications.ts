// Data transformation layer for Applications (Mission Control)
// Maps backend API data to the UI format expected by components

import {
  Application,
  ApplicationStage,
  ApplicationStatus,
  ApplicationStats,
  APPLICATION_STAGES,
} from "../types/application";

// Extended UI-facing Application type with all the display fields
export interface ApplicationUI {
  id: string;
  company: string;
  logo: string;
  role: string;
  location: string;
  salary: string;
  stage: ApplicationStage;
  match: number;
  favorite?: boolean;
  postedAt: string;
  updatedAt: string;
  nextAction?: { label: string; when: string; urgency: "today" | "soon" | "later" };
  recruiter?: { id: string; name: string; role: string; email?: string; last?: string };
  contacts: { id: string; name: string; role: string; last?: string }[];
  notes: string;
  attachments: { id: string; name: string; kind: string; size: string }[];
  history: { id: string; time: string; title: string; detail: string; kind: string }[];
  interviews: {
    id: string;
    name: string;
    when: string;
    interviewer?: string;
    status: string;
    notes?: string;
    scheduledAt?: string | null;
  }[];
  assessments: { id: string; label: string; due: string; status: string; dueAt?: string | null }[];
  followUps: {
    id: string;
    title: string;
    due: string;
    status: string;
    notes?: string;
    dueAt?: string | null;
  }[];
  culture?: string;
  glassdoor?: number;
  progress: number;
}

export interface FollowUpUI {
  id: string;
  applicationId?: string;
  company: string;
  role: string;
  due: string;
  kind: "email" | "call" | "message" | "task";
  status: "pending" | "completed";
  note: string;
  dueAt?: string | null;
}

export interface CalendarEventUI {
  id: string;
  day: number;
  month: number;
  year: number;
  hour?: number;
  title: string;
  company: string;
  kind: "interview" | "deadline" | "followup" | "assessment";
}

export interface StatsUI {
  applications: number;
  interviewRate: number;
  offerRate: number;
  acceptanceRate: number;
  streakDays: number;
  activeThisWeek?: number;
}

// Transform backend Application to frontend ApplicationUI
export function transformApplication(app: Application): ApplicationUI {
  // "archived" is a backend boolean flag mapped onto the UI's archived stage.
  const stage = (app.archived ? "archived" : app.status) as ApplicationStage;
  const progress = app.progress ?? getProgressForStage(stage);

  // Timeline is generated from persisted application events (source of truth).
  const history: ApplicationUI["history"] = (app.events ?? []).map((e) => ({
    id: e.id,
    time: timeAgo(e.created_at),
    title: e.title,
    detail: e.detail ?? "",
    kind: eventKind(e.event_type),
  }));
  if (history.length === 0 && app.application_date) {
    // Honest fallback for legacy rows created before the events table existed.
    history.push({
      id: `${app.id}-created`,
      time: timeAgo(app.application_date),
      title: "Applied",
      detail: `Application for ${app.job_title} at ${app.company_name}`,
      kind: "status",
    });
  }

  const interviews: ApplicationUI["interviews"] = (app.interviews ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    when: i.scheduled_at ? formatDate(i.scheduled_at) : "Unscheduled",
    interviewer: i.interviewer ?? undefined,
    status: i.status,
    notes: i.notes ?? undefined,
    scheduledAt: i.scheduled_at,
  }));

  const assessments: ApplicationUI["assessments"] = (app.assessments ?? []).map((a) => ({
    id: a.id,
    label: a.name,
    due: a.due_at ? formatDate(a.due_at) : "No due date",
    status: a.status,
    dueAt: a.due_at,
  }));

  const followUps: ApplicationUI["followUps"] = (app.follow_ups ?? []).map((f) => ({
    id: f.id,
    title: f.title,
    due: f.due_at ? formatDate(f.due_at) : "No due date",
    status: f.status,
    notes: f.notes ?? undefined,
    dueAt: f.due_at,
  }));

  const contacts: ApplicationUI["contacts"] = (app.contacts ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role ?? "Contact",
    last: c.email ?? undefined,
  }));

  const attachments: ApplicationUI["attachments"] = (app.attachments ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    size: "",
  }));

  const nextAction = app.next_action
    ? {
        label: app.next_action.label,
        when: urgencyLabel(app.next_action.urgency),
        urgency: app.next_action.urgency,
      }
    : undefined;

  return {
    id: app.id,
    company: app.company_name,
    logo: app.company_name.charAt(0).toUpperCase(),
    role: app.job_title,
    location: app.location ?? "",
    salary: app.salary ?? "",
    stage,
    match: app.match_score ?? 0,
    favorite: Boolean(app.favorite),
    postedAt: app.application_date ? formatDate(app.application_date) : "",
    updatedAt: app.updated_at ? timeAgo(app.updated_at) : "",
    nextAction,
    recruiter: contacts[0]
      ? {
          id: contacts[0].id,
          name: contacts[0].name,
          role: contacts[0].role,
          last: contacts[0].last,
        }
      : undefined,
    contacts,
    notes: app.notes ?? "",
    attachments,
    history,
    interviews,
    assessments,
    followUps,
    progress,
  };
}

export function getCalendarEvents(apps: ApplicationUI[]): CalendarEventUI[] {
  const events: CalendarEventUI[] = [];
  apps.forEach((app) => {
    (app.interviews ?? []).forEach((iv) => {
      if (iv.scheduledAt) {
        const d = new Date(iv.scheduledAt);
        if (!Number.isNaN(d.getTime())) {
          events.push({
            id: `iv-${iv.id}`,
            day: d.getDate(),
            month: d.getMonth(),
            year: d.getFullYear(),
            hour: d.getHours(),
            title: iv.name,
            company: app.company,
            kind: "interview",
          });
        }
      }
    });
    (app.assessments ?? []).forEach((as) => {
      if (as.dueAt) {
        const d = new Date(as.dueAt);
        if (!Number.isNaN(d.getTime())) {
          events.push({
            id: `as-${as.id}`,
            day: d.getDate(),
            month: d.getMonth(),
            year: d.getFullYear(),
            hour: d.getHours(),
            title: as.label,
            company: app.company,
            kind: "assessment",
          });
        }
      }
    });
    (app.followUps ?? []).forEach((fu) => {
      if (fu.dueAt) {
        const d = new Date(fu.dueAt);
        if (!Number.isNaN(d.getTime())) {
          events.push({
            id: `fu-${fu.id}`,
            day: d.getDate(),
            month: d.getMonth(),
            year: d.getFullYear(),
            hour: d.getHours(),
            title: fu.title,
            company: app.company,
            kind: "followup",
          });
        }
      }
    });
  });
  return events;
}

function urgencyLabel(urgency: "today" | "soon" | "later"): string {
  if (urgency === "today") return "Today";
  if (urgency === "soon") return "Soon";
  return "Later";
}

function eventKind(eventType: string): string {
  if (eventType.includes("interview")) return "interview";
  if (eventType.includes("follow_up")) return "task";
  if (eventType === "application_created") return "status";
  if (eventType === "status_changed") return "status";
  return "note";
}

// Transform backend Application array to ApplicationUI array
export function transformApplications(apps: Application[]): ApplicationUI[] {
  return apps.map(transformApplication);
}

// Calculate progress percentage based on stage
function getProgressForStage(stage: ApplicationStage): number {
  const progressMap: Record<ApplicationStage, number> = {
    saved: 5,
    to_apply: 10,
    applied: 20,
    screening: 35,
    assessment: 45,
    interview: 60,
    offer: 85,
    accepted: 100,
    rejected: 100,
    withdrawn: 100,
    archived: 100,
  };
  return progressMap[stage] ?? 0;
}

// Format date string (null-safe: `new Date()` never throws on bad input,
// it yields "Invalid Date" — so validate explicitly and fall back).
function formatDate(dateStr: string): string {
  if (!dateStr) return "Recently updated";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Recently updated";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Simple time-ago formatter
function timeAgo(dateStr: string): string {
  if (!dateStr) return "Recently updated";
  const now = new Date();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Recently updated";
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    return formatDate(dateStr);
}

// Compute stats from applications
export function computeStats(apps: ApplicationUI[]): StatsUI {
  const total = apps.filter(
    (a) => a.stage !== "saved" && a.stage !== "to_apply" && a.stage !== "archived",
  ).length;
  const withInterviews = apps.filter(
    (a) => a.stage === "interview" || a.stage === "offer" || a.stage === "accepted",
  ).length;
  const withOffers = apps.filter((a) => a.stage === "offer" || a.stage === "accepted").length;
  const accepted = apps.filter((a) => a.stage === "accepted").length;
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const activeThisWeek = apps.filter((a) => {
    if (!a.postedAt) return false;
    const d = new Date(a.postedAt);
    return !Number.isNaN(d.getTime()) && d >= monday && d <= now;
  }).length;

  return {
    applications: total,
    // Conversion rates are 0 when the sample (denominator) is zero — never a fake 100%.
    interviewRate: total > 0 ? Math.round((withInterviews / total) * 100) : 0,
    offerRate: withInterviews > 0 ? Math.round((withOffers / withInterviews) * 100) : 0,
    acceptanceRate: withOffers > 0 ? Math.round((accepted / withOffers) * 100) : 0,
    streakDays: 0,
    activeThisWeek,
  };
}

// Group applications by stage
export function groupByStage(apps: ApplicationUI[]): Record<ApplicationStage, ApplicationUI[]> {
  const groups = Object.fromEntries(
    APPLICATION_STAGES.map((s) => [s.id, [] as ApplicationUI[]]),
  ) as Record<ApplicationStage, ApplicationUI[]>;
  apps.forEach((app) => {
    if (groups[app.stage]) {
      groups[app.stage].push(app);
    }
  });
  return groups;
}

// Filter applications based on filter id
export function filterApplications(
  apps: ApplicationUI[],
  filterId: string,
  favorites: boolean,
  stages: ApplicationStage[],
): ApplicationUI[] {
  let filtered = apps;
  if (favorites) {
    filtered = filtered.filter((a) => a.favorite);
  } else if (stages.length > 0) {
    filtered = filtered.filter((a) => stages.includes(a.stage));
  }
  return filtered;
}

// Search applications by query
export function searchApplications(apps: ApplicationUI[], query: string): ApplicationUI[] {
  if (!query.trim()) return apps;
  const q = query.toLowerCase();
  return apps.filter(
    (a) =>
      a.company.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q),
  );
}

// Sidebar filters configuration
export interface SidebarFilter {
  id: string;
  label: string;
  stages: ApplicationStage[];
  favorites?: boolean;
}

export const sidebarFilters: SidebarFilter[] = [
  {
    id: "all",
    label: "All applications",
    stages: [
      "applied",
      "screening",
      "assessment",
      "interview",
      "offer",
      "accepted",
      "rejected",
      "withdrawn",
    ],
  },
  { id: "interviews", label: "Interviews", stages: ["interview"] },
  { id: "assessments", label: "Assessments", stages: ["assessment"] },
  { id: "offers", label: "Offers", stages: ["offer", "accepted"] },
  { id: "rejected", label: "Rejected", stages: ["rejected", "withdrawn"] },
  { id: "archived", label: "Archived", stages: ["archived"] },
  { id: "saved", label: "Saved", stages: ["saved", "to_apply"] },
  { id: "bookmarks", label: "Bookmarks", stages: [], favorites: true },
];
