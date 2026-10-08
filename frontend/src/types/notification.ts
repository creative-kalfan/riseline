// Types for the Notifications domain
// Aligned with backend API contract and database schema

export type NotificationType =
  | "HIGH_MATCH_RECOMMENDATION"
  | "RECOMMENDATION_SCORE_CHANGED"
  | "ATS_SCORE_IMPROVED"
  | "RESUME_PARSING_COMPLETED"
  | "CRAWLER_SYNC_COMPLETED"
  | "APPLICATION_STATUS_UPDATED"
  | "NEW_RECOMMENDATION_AVAILABLE"
  | "JOB_EXPIRES_SOON";

export type NotificationPriority = "low" | "medium" | "high" | "critical";

export type NotificationDeliveryChannel = "in_app" | "email" | "push" | "sms";

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  payload_json: Record<string, unknown>;
  priority: NotificationPriority;
  is_read: boolean;
  delivery_channel: NotificationDeliveryChannel;
  created_at: string;
  read_at: string | null;
}

export interface NotificationPreferenceRecord {
  id?: string;
  user_id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
  high_match_threshold: number;
  daily_digest: boolean;
  weekly_digest: boolean;
  quiet_hours?: {
    startHour: number;
    endHour: number;
    timezoneOffsetMinutes?: number;
  } | null;
  updated_at?: string;
}

export interface NotificationListResponse {
  notifications: NotificationRecord[];
}

export interface NotificationFilters {
  isRead?: boolean;
  channel?: NotificationDeliveryChannel;
  type?: NotificationType;
  limit?: number;
}

// UI-facing notification type with display helpers
export interface NotificationUI {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  timeAgo: string;
}

// Transform backend NotificationRecord to UI format
export function transformNotification(n: NotificationRecord): NotificationUI {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    priority: n.priority,
    isRead: n.is_read,
    createdAt: n.created_at,
    readAt: n.read_at,
    timeAgo: timeAgo(n.created_at),
  };
}

export function transformNotifications(notifications: NotificationRecord[]): NotificationUI[] {
  return notifications.map(transformNotification);
}

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
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Priority display config
export const priorityConfig: Record<NotificationPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "text-muted-foreground bg-muted/50" },
  medium: { label: "Medium", color: "text-primary bg-primary/10" },
  high: { label: "High", color: "text-warning bg-warning/10" },
  critical: { label: "Critical", color: "text-destructive bg-destructive/10" },
};

// Type display config
export const typeLabels: Record<NotificationType, string> = {
  HIGH_MATCH_RECOMMENDATION: "High Match",
  RECOMMENDATION_SCORE_CHANGED: "Score Changed",
  ATS_SCORE_IMPROVED: "ATS Improved",
  RESUME_PARSING_COMPLETED: "Parsing Complete",
  CRAWLER_SYNC_COMPLETED: "Sync Complete",
  APPLICATION_STATUS_UPDATED: "Status Update",
  NEW_RECOMMENDATION_AVAILABLE: "New Recommendation",
  JOB_EXPIRES_SOON: "Expiring Soon",
};
