import { useQuery } from "@tanstack/react-query";
import { fetchDashboardTelemetry } from "../../api/dashboard";
import type { TelemetryTimelineItem } from "../../api/dashboard";
import type { TimelineEvent } from "@/lib/dashboard-data";

export const dashboardTelemetryQueryKey = ["dashboard", "telemetry"] as const;

export function useDashboardTelemetry() {
  return useQuery({
    queryKey: dashboardTelemetryQueryKey,
    queryFn: fetchDashboardTelemetry,
    staleTime: 1000 * 60,
  });
}

// ─── Mappers ────────────────────────────────────────────────────────────

const ACTION_TITLES: Record<string, string> = {
  tailored_version_created: "Tailored resume variant",
  application_tracked: "Application tracked",
  ats_analysis_completed: "ATS analysis completed",
  resume_created: "Resume added",
};

function kindForAction(action: string): TimelineEvent["kind"] {
  const a = action.toLowerCase();
  if (a.startsWith("ats_")) return "ats";
  if (a.startsWith("application_")) return "application";
  if (a.startsWith("interview_")) return "interview";
  if (a.startsWith("resume_") || a.startsWith("tailored_") || a.startsWith("version_"))
    return "resume";
  if (a.startsWith("job_") || a.startsWith("recommendation_")) return "job";
  return "job";
}

function titleForAction(action: string): string {
  return (
    ACTION_TITLES[action] ??
    action
      .split("_")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ")
  );
}

function timeAgo(dateStr: string): string {
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return "";
  const diff = Date.now() - time;
  if (diff < 0) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(time).toLocaleDateString();
}

/** Map the backend activity_timeline into widget-ready TimelineEvents. */
export function mapTelemetryToTimeline(items: TelemetryTimelineItem[]): TimelineEvent[] {
  return (items || []).slice(0, 10).map((item, index) => ({
    id: `telemetry-${index}`,
    kind: kindForAction(item.action || ""),
    title: titleForAction(item.action || "activity"),
    detail: item.description || "",
    time: item.timestamp ? timeAgo(item.timestamp) : "",
  }));
}
