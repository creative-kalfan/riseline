import { useQueries } from "@tanstack/react-query";
import { useAuth } from "@/auth/useAuth";
import { jobsApi } from "@/api/jobs";
import { jobsQueryKeys } from "./useJobs";
import { applicationsApi } from "@/api/applications";
import { applicationQueryKeys } from "./useApplications";
import { recommendationsApi } from "@/api/recommendations";
import { notificationsApi } from "@/api/notifications";
import { NOTIFICATIONS_QUERY_KEY } from "./useNotifications";

type BackendResponse<T> = {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
};

// ─── Types ────────────────────────────────────────────────────────────────

export interface DashboardData {
  // User
  firstName: string;
  greeting: string;
  streakDays: number;

  // Health score derived from multiple sources
  healthScore: {
    overall: number;
    resume: number;
    applications: number;
    skills: number;
    weeklyProgress: number;
    weeklyGoalLabel: string;
  };

  // Application stats
  applicationsByStatus: { label: string; value: number; color: string }[];

  // Recent personalized jobs (for match distribution)
  jobMatchDistribution: { label: string; value: number; color: string }[];

  // Recommendations
  recommendations: {
    id: string;
    kind: "job" | "resume" | "learning" | "insight" | "interview";
    title: string;
    detail: string;
    meta: string;
    score?: number;
  }[];

  // Recent notifications (for activity timeline)
  recentActivity: {
    id: string;
    kind: "resume" | "ats" | "job" | "application" | "interview";
    title: string;
    detail: string;
    time: string;
  }[];

  // Upcoming items from applications
  upcoming: {
    id: string;
    kind: "interview" | "deadline" | "followup" | "expiring";
    title: string;
    detail: string;
    when: string;
    urgency: "today" | "soon" | "later";
  }[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useDashboardData() {
  const { user, profile } = useAuth();

  // Two-tier bootstrap (all fired in parallel via useQueries):
  // Tier-1 critical (blocks skeleton release in the route): personalized
  // jobs + application stats. Tier-2 deferred-hydration (widgets tolerate
  // undefined and fill in below the fold): recommendations + bounded
  // notifications. Telemetry (useDashboardTelemetry) stays a separate
  // graceful-degradation query owned by the route.
  const queries = useQueries({
    queries: [
      {
        queryKey: jobsQueryKeys.personalized({}),
        queryFn: ({ signal }) => jobsApi.getPersonalizedJobs({}, signal),
        staleTime: 60_000,
      },
      {
        queryKey: applicationQueryKeys.stats,
        queryFn: () => applicationsApi.getStats(),
        staleTime: 60_000,
      },
      {
        queryKey: ["recommendations", "top", 5] as const,
        queryFn: () => recommendationsApi.getTopRecommendations(5),
        staleTime: 60_000,
      },
      {
        // Bounded: the dashboard timeline renders 6 rows (formatActivity
        // slices defensively). The full history stays on /notifications.
        queryKey: [NOTIFICATIONS_QUERY_KEY, { limit: 6 }] as const,
        queryFn: () => notificationsApi.getAll({ limit: 6 }),
        staleTime: 60_000,
      },
    ],
  });

  const [jobsQuery, appsQuery, recsQuery, notifsQuery] = queries;
  // Skeleton release is Tier-1 gated: both critical queries pending without
  // data. Tier-2 (recs/notifs) hydrates progressively and never blocks it.
  const isTier1Loading =
    (jobsQuery.isLoading && !jobsQuery.data) || (appsQuery.isLoading && !appsQuery.data);
  const isAllLoading = queries.every((q) => q.isLoading && !q.data);
  const isAnyLoading = queries.some((q) => q.isLoading && !q.data);
  const isError = queries.every((q) => q.isError);

  // Derive dashboard data progressively from whatever queries have resolved
  const data: DashboardData | null = isAllLoading
    ? null
    : {
        firstName: user?.name?.split(" ")[0] || "there",
        greeting: getTimeOfDay(),
        streakDays: profile?.onboardingStep || 0,

        healthScore: {
          overall: calculateTruthfulHealthScore(
            profile?.onboardingStep || 0,
            appsQuery.data?.total || 0,
          ),
          resume: 0,
          applications: appsQuery.data?.total
            ? Math.min(100, Math.round((appsQuery.data.total / 10) * 100))
            : 0,
          skills: 0,
          weeklyProgress: appsQuery.data?.total ? Math.min(100, appsQuery.data.total * 20) : 0,
          weeklyGoalLabel: appsQuery.data?.total
            ? `${appsQuery.data.total} logged`
            : "Set target",
        },

        applicationsByStatus: formatAppStatus(appsQuery.data?.byStatus),
        jobMatchDistribution: formatMatchDistribution(jobsQuery.data?.jobs || []),

        recommendations: formatRecommendations(
          (recsQuery.data as any)?.data?.recommendations ||
          (Array.isArray(recsQuery.data) ? recsQuery.data : [])
        ),
        recentActivity: formatActivity(notifsQuery.data?.notifications || []),
        upcoming: formatUpcoming(appsQuery.data?.byStatus),
      };

  return {
    data,
    isLoading: isTier1Loading,
    isAllLoading,
    isAnyLoading,
    isJobsLoading: jobsQuery.isLoading && !jobsQuery.data,
    isAppsLoading: appsQuery.isLoading && !appsQuery.data,
    isRecsLoading: recsQuery.isLoading && !recsQuery.data,
    isNotifsLoading: notifsQuery.isLoading && !notifsQuery.data,
    isError,
    refetch: () => queries.forEach((q) => q.refetch()),
  };
}

// ─── Formatters ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  applied: "hsl(var(--primary))",
  screening: "hsl(var(--accent))",
  interview: "hsl(var(--success))",
  offer: "hsl(var(--warning))",
  rejected: "hsl(var(--muted-foreground))",
};

function formatAppStatus(byStatus?: Record<string, number>) {
  if (!byStatus) return [];
  return Object.entries(byStatus).map(([label, value]) => ({
    label,
    value,
    color: STATUS_COLORS[label.toLowerCase()] || "hsl(var(--muted-foreground))",
  }));
}

function formatMatchDistribution(jobs: any[]) {
  const buckets = { "90-100": 0, "80-89": 0, "70-79": 0, "<70": 0 };
  const colors = {
    "90-100": "hsl(var(--success))",
    "80-89": "hsl(var(--primary))",
    "70-79": "hsl(var(--accent))",
    "<70": "hsl(var(--muted-foreground))",
  };
  for (const job of jobs) {
    const score = (job as any).match?.overall ?? 0;
    if (score >= 90) buckets["90-100"]++;
    else if (score >= 80) buckets["80-89"]++;
    else if (score >= 70) buckets["70-79"]++;
    else buckets["<70"]++;
  }
  return Object.entries(buckets).map(([label, value]) => ({
    label,
    value,
    color: colors[label as keyof typeof colors],
  }));
}

function formatRecommendations(recs: any[]) {
  return recs.slice(0, 5).map((r: any) => ({
    id: r.id,
    kind: r.kind || "insight",
    title: r.title || r.jobTitle || "Recommendation",
    detail: r.detail || r.description || "",
    meta: r.meta || r.matchScore ? `${r.matchScore}% match` : "",
    score: r.matchScore,
  }));
}

function formatActivity(notifications: any[]) {
  const kindMap: Record<string, "resume" | "ats" | "job" | "application" | "interview"> = {
    ats_analysis: "ats",
    job_match: "job",
    application_update: "application",
    interview_scheduled: "interview",
    resume_update: "resume",
  };
  return (notifications || []).slice(0, 6).map((n: any) => ({
    id: n.id,
    kind: kindMap[n.type] || "job",
    title: n.title || "Activity",
    detail: n.message || "",
    time: n.created_at ? timeAgo(n.created_at) : "",
  }));
}

function formatUpcoming(byStatus?: Record<string, number>) {
  const items: {
    id: string;
    kind: "interview" | "deadline" | "followup" | "expiring";
    title: string;
    detail: string;
    when: string;
    urgency: "today" | "soon" | "later";
  }[] = [];
  if (byStatus?.interview && byStatus.interview > 0) {
    items.push({
      id: "u-interview",
      kind: "interview",
      title: `${byStatus.interview} upcoming interview${byStatus.interview > 1 ? "s" : ""}`,
      detail: "Check your applications for details",
      when: "Soon",
      urgency: "soon",
    });
  }
  return items;
}

function calculateTruthfulHealthScore(onboardingStep: number, appsTotal: number): number {
  // Truthful score: strictly bounded by real user progress, never fabricated.
  // Profile onboarding completion contributes up to 60%, real applications up to 40%.
  const onboardingContribution = Math.min(60, Math.round((onboardingStep / 4) * 60));
  const appContribution = Math.min(40, Math.round((appsTotal / 5) * 40));
  return onboardingContribution + appContribution;
}
