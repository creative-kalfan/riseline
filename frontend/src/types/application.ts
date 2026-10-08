// Types for the Applications (Mission Control) domain
// Aligned with the backend application lifecycle (sql/migrations/018_applications.sql)

export type ApplicationStatus =
  | "saved"
  | "to_apply"
  | "applied"
  | "screening"
  | "assessment"
  | "interview"
  | "offer"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type ApplicationStage =
  | "saved"
  | "to_apply"
  | "applied"
  | "screening"
  | "assessment"
  | "interview"
  | "offer"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "archived";

// Child entity path segments (mirror backend route registration)
export type ApplicationChildKind =
  "interviews" | "assessments" | "contacts" | "follow-ups" | "attachments";

export interface ApplicationInterview {
  id: string;
  application_id: string;
  name: string;
  scheduled_at: string | null;
  status: string;
  interviewer: string | null;
  notes: string | null;
}

export interface ApplicationAssessment {
  id: string;
  application_id: string;
  name: string;
  due_at: string | null;
  status: string;
  notes: string | null;
  result: string | null;
}

export interface ApplicationContact {
  id: string;
  application_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

export interface ApplicationFollowUp {
  id: string;
  application_id: string;
  title: string;
  due_at: string | null;
  status: string;
  notes: string | null;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  event_type: string;
  title: string;
  detail: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string | null;
  job_title: string;
  company_name: string;
  status: ApplicationStatus;
  application_date: string;
  notes: string | null;
  location?: string | null;
  salary?: string | null;
  match_score?: number | null;
  favorite?: boolean;
  archived?: boolean;
  source_url?: string | null;
  source_platform?: string | null;
  created_at?: string;
  updated_at?: string;
  // Enriched children returned by GET /applications and GET /applications/{id}
  interviews?: ApplicationInterview[];
  assessments?: ApplicationAssessment[];
  contacts?: ApplicationContact[];
  follow_ups?: ApplicationFollowUp[];
  events?: ApplicationEvent[];
  attachments?: { id: string; name: string; kind: string; storage_path?: string | null }[];
  // Derived by the backend service
  next_action?: { label: string; urgency: "today" | "soon" | "later" } | null;
  progress?: number;
}

export interface CreateApplicationRequest {
  job_title: string;
  company_name: string;
  job_id?: string;
  status?: ApplicationStatus;
  notes?: string;
  location?: string;
  salary?: string;
  match_score?: number;
  source_url?: string;
}

export interface UpdateApplicationStatusRequest {
  id: string;
  status: ApplicationStatus;
}

export interface ApplicationListResponse {
  applications: Application[];
  total: number;
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  interviewRate: number;
  offerRate: number;
  acceptanceRate: number;
  activeThisWeek: number;
  streakDays: number;
}

// Stage metadata for UI rendering
export const APPLICATION_STAGES: { id: ApplicationStage; label: string; tone: string }[] = [
  { id: "saved", label: "Saved", tone: "text-muted-foreground bg-muted/50 ring-border/60" },
  { id: "to_apply", label: "To Apply", tone: "text-muted-foreground bg-muted/50 ring-border/60" },
  { id: "applied", label: "Applied", tone: "text-primary bg-primary/10 ring-primary/20" },
  { id: "screening", label: "Screening", tone: "text-accent bg-accent/10 ring-accent/25" },
  { id: "assessment", label: "Assessment", tone: "text-accent bg-accent/10 ring-accent/25" },
  { id: "interview", label: "Interview", tone: "text-warning bg-warning/10 ring-warning/25" },
  { id: "offer", label: "Offer", tone: "text-success bg-success/10 ring-success/20" },
  { id: "accepted", label: "Accepted", tone: "text-success bg-success/15 ring-success/25" },
  {
    id: "rejected",
    label: "Rejected",
    tone: "text-destructive bg-destructive/10 ring-destructive/20",
  },
  {
    id: "withdrawn",
    label: "Withdrawn",
    tone: "text-destructive bg-destructive/10 ring-destructive/20",
  },
  { id: "archived", label: "Archived", tone: "text-muted-foreground bg-muted/40 ring-border/60" },
];

// Map from backend ApplicationStatus to frontend ApplicationStage
export function mapStatusToStage(status: ApplicationStatus): ApplicationStage {
  return status as ApplicationStage;
}

// Map from frontend ApplicationStage to backend ApplicationStatus.
// "archived" is a boolean flag on the backend, not a status, so it maps to the
// application's real stage (handled separately by the caller).
export function mapStageToStatus(stage: ApplicationStage): ApplicationStatus {
  if (stage === "archived") {
    return "applied";
  }
  return stage as ApplicationStatus;
}
