import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useRef } from "react";
import { ArrowRight, AlertCircle, Sparkles, Target, Zap, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { perfMark, perfMeasure } from "@/lib/perf-marks";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
// Split: career-3d-topology statically imports three.js (~500KB). Lazy keeps
// it (and WebGL init) off the dashboard critical path; the skeleton holds
// layout until the chunk resolves. Only rendered for the 3D horizon below.
const Career3DTopology = lazy(() =>
  import("@/components/dashboard/career-3d-topology").then((m) => ({
    default: m.Career3DTopology,
  })),
);
import {
  Widget,
  ExecutiveTelemetryRibbon,
  CareerActionDirectives,
  PipelineDistributionInstrument,
  ActivityTimeline,
  UpcomingList,
  QuickActionsGrid,
  InsightPill,
} from "@/components/dashboard/widgets";
import { useDashboardData, type DashboardData } from "@/hooks/api/useDashboardData";
import { useDashboardTelemetry, mapTelemetryToTimeline } from "@/hooks/api/useDashboardTelemetry";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Center · CareerOS" },
      {
        name: "description",
        content:
          "Your executive career cockpit — real-time ATS telemetry, 3D skill topology, matching pool calibration, and high-impact directives.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading, isError, refetch } = useDashboardData();
  // Live backend telemetry (GET /api/dashboard). Values below prefer these
  // real counts; the aggregated hook above remains as graceful degradation.
  const telemetryQuery = useDashboardTelemetry();
  const telemetry = telemetryQuery.data?.data;
  const telemetryLoading = telemetryQuery.isLoading && !telemetryQuery.data;
  const telemetryFailed = telemetryQuery.isError && !telemetry;
  const liveAtsScore = telemetry?.average_ats_score ?? 0;

  // Timing-only (dev / VITE_PERF_MARKS=1): mount → Tier-1 usable →
  // noncritical hydration, so dashboard data legs are measurable.
  const mountedRef = useRef(false);
  const usableMarkedRef = useRef(false);
  const hydratedMarkedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      perfMark("careeros:dashboard-mounted");
    }
  }, []);
  useEffect(() => {
    if (data && !isLoading && !usableMarkedRef.current) {
      usableMarkedRef.current = true;
      perfMark("careeros:dashboard-usable");
      perfMeasure(
        "careeros:dashboard-mount-to-usable",
        "careeros:dashboard-mounted",
        "careeros:dashboard-usable",
      );
    }
    if (telemetry && !hydratedMarkedRef.current) {
      hydratedMarkedRef.current = true;
      perfMark("careeros:noncritical-hydrated");
      perfMeasure(
        "careeros:dashboard-mount-to-hydrated",
        "careeros:dashboard-mounted",
        "careeros:noncritical-hydrated",
      );
    }
  }, [data, isLoading, telemetry]);

  // `data` is derived progressively from live backend queries (jobs, applications,
  // recommendations, notifications). If telemetry loads before data queries,
  // we provide a minimal truthful projection rather than blocking behind a blank screen.
  const fallbackData: DashboardData = {
    firstName: "there",
    greeting: "Welcome",
    streakDays: 0,
    healthScore: {
      overall: liveAtsScore,
      resume: liveAtsScore,
      applications: telemetry?.applications_tracked ?? 0,
      skills: 0,
      weeklyProgress: 0,
      weeklyGoalLabel: "Track your progress",
    },
    applicationsByStatus: [],
    jobMatchDistribution: [],
    recommendations: [],
    recentActivity: [],
    upcoming: [],
  };

  const activeData = data || (telemetry ? fallbackData : null);

  // Real backend timeline wins when telemetry loaded; otherwise keep the
  // aggregated activity (or the empty state below when there is nothing).
  const timelineItems = telemetry
    ? mapTelemetryToTimeline(telemetry.activity_timeline)
    : (activeData?.recentActivity ?? []);
  const matchCount = (activeData?.jobMatchDistribution ?? []).reduce(
    (s: number, d: { label: string; value: number }) => s + d.value,
    0,
  );
  const highFitCount =
    activeData?.jobMatchDistribution.find(
      (d: { label: string; value: number }) => d.label.includes("High") || d.label.includes("90"),
    )?.value ?? 0;

  if (isError && !telemetry) {
    return (
      <div className="w-full max-w-[1536px] mx-auto flex flex-col items-center justify-center gap-4 px-4 sm:px-6 lg:px-8 py-20">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-base font-semibold">Failed to load command deck telemetry</h2>
        <p className="text-xs text-muted-foreground">
          Could not load your live workspace data. Please verify connectivity and try again.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-lg">
          Re-initialize Telemetry
        </Button>
      </div>
    );
  }

  // Progressive loading: skeleton holds only while Tier-1 critical data
  // (jobs + app stats, via useDashboardData isLoading) AND telemetry are
  // both pending without data. Tier-2 (recs, bounded notifs) hydrates below
  // the fold and never blocks first paint.
  if (isLoading && telemetryLoading) {
    return (
      <div className="w-full max-w-[1536px] mx-auto flex flex-col gap-5 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-40 rounded-md" />
            <Skeleton className="h-7 w-72 rounded-lg" />
            <Skeleton className="h-3 w-96 max-w-full rounded-md" />
          </div>
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Skeleton className="h-64 rounded-xl lg:col-span-5" />
          <Skeleton className="h-64 rounded-xl lg:col-span-7" />
        </div>
      </div>
    );
  }

  // Defensive: only display empty notice if completely lacking workspace data
  if (!activeData) {
    return (
      <div className="w-full max-w-[1536px] mx-auto flex flex-col items-center justify-center gap-4 px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Sparkles className="h-10 w-10 text-primary/60" />
        <h2 className="text-base font-semibold">No workspace data yet</h2>
        <p className="max-w-sm text-xs text-muted-foreground">
          Upload a resume and complete onboarding to populate your command deck with
          real telemetry.
        </p>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="rounded-lg">
            <Link to="/resumes">Open Resume Studio</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link to="/onboarding">Complete onboarding</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Structured High-Leverage Career Directives.
  // Details describe real workspace counts or plain next actions — never
  // fabricated roles, companies, or score deltas.
  const careerDirectives = [
    {
      id: "d-tailor",
      title: "Tailor Resume for Top Match",
      detail: telemetry
        ? `${telemetry.tailored_versions} tailored variant${telemetry.tailored_versions === 1 ? "" : "s"} across ${telemetry.total_resumes} resume${telemetry.total_resumes === 1 ? "" : "s"} in your workspace.`
        : "Open Resume Studio to tailor your resume to a target role.",
      badge: "Urgent Directive",
      tone: "primary" as const,
      actionLabel: "Open Studio",
      href: "/resumes",
      icon: "resume" as const,
    },
    {
      id: "d-ats",
      title: "Run ATS Diagnostics",
      detail: "Scan your active resume against target job descriptions.",
      badge: "High Impact",
      tone: "accent" as const,
      actionLabel: "Run Scan",
      href: "/resumes",
      icon: "ats" as const,
    },
    {
      id: "d-roles",
      title: "Review Recommended Roles",
      detail:
        matchCount > 0
          ? `${highFitCount} high-fit opportunities in your match pool of ${matchCount}.`
          : "Complete your profile to surface high-fit opportunities.",
      scoreImpact: `${matchCount} Total Pool`,
      badge: "Market Match",
      tone: "success" as const,
      actionLabel: "View Pool",
      href: "/jobs",
      icon: "jobs" as const,
    },
    {
      id: "d-skills",
      title: "Align In-Demand Skill Gaps",
      detail: "Review skill gaps from your latest ATS scans and recommendations.",
      badge: "Skill Velocity",
      tone: "warning" as const,
      actionLabel: "Review Gaps",
      href: "/recommendations",
      icon: "skills" as const,
    },
  ];

  return (
    <motion.div
      className="w-full max-w-[1536px] mx-auto flex flex-col gap-5 px-4 sm:px-6 lg:px-8 py-5"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* Flight Deck Header */}
      <motion.div variants={staggerItem}>
        <PageHeader
          eyebrow="Flight Deck • Command Center"
          title="Career Intelligence Cockpit"
          description="Real-time telemetry, 3D skill topology constellation, and high-impact tactical directives."
          actions={
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-lg text-xs font-mono">
                <Link to="/recommendations">
                  All Directives <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* 1. TOP HORIZON: Sleek Executive Telemetry Ribbon */}
      <ExecutiveTelemetryRibbon
        greeting={activeData.greeting}
        name={activeData.firstName}
        streak={activeData.streakDays}
        health={{
          overall: activeData.healthScore.overall,
          delta: 0,
        }}
        resumeScore={liveAtsScore}
        matchPoolCount={matchCount}
        highFitCount={highFitCount}
        weeklyProgress={activeData.healthScore.weeklyProgress}
        weeklyGoalLabel={activeData.healthScore.weeklyGoalLabel}
      />

      {/* 1b. LIVE WORKSPACE TELEMETRY (GET /api/dashboard) */}
      <motion.div variants={staggerItem}>
        {telemetryLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-md border-2 border-border" />
            ))}
          </div>
        ) : telemetry ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Resumes", value: telemetry.total_resumes },
              { label: "Tailored Variants", value: telemetry.tailored_versions },
              { label: "Applications Tracked", value: telemetry.applications_tracked },
              { label: "Parse Queue", value: telemetry.active_jobs_in_queue },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between rounded-md border-2 border-border bg-surface px-4 py-3 shadow-brutal-xs"
              >
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
                  {stat.label}
                </span>
                <span className="font-mono text-lg font-bold text-foreground">{stat.value}</span>
              </div>
            ))}
          </div>
        ) : telemetryFailed ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border-2 border-warning/40 bg-warning/10 px-4 py-2.5">
            <p className="text-[11px] text-muted-foreground font-mono">
              Live telemetry unavailable — showing cached workspace data.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => telemetryQuery.refetch()}
              className="h-7 rounded-md text-[11px] font-mono border-2 border-border"
            >
              Retry Telemetry
            </Button>
          </div>
        ) : null}
      </motion.div>

      {/* 2. PRIMARY COMMAND HORIZON: 2-Column Cockpit Layout */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Left Column (7 cols on xl / 12 on lg): 3D Career Vector & Skill Topology Canvas */}
        <div className="xl:col-span-7 col-span-12 flex flex-col">
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <Career3DTopology careerScore={activeData.healthScore.overall} className="h-full" />
          </Suspense>
        </div>

        {/* Right Column (5 cols on xl / 12 on lg): High-Leverage Career Action Directives */}
        <div className="xl:col-span-5 col-span-12 flex flex-col">
          <CareerActionDirectives directives={careerDirectives} />
        </div>
      </motion.div>

      {/* 3. SECONDARY HORIZON: Streamlined Pipeline & Calibration */}
      <motion.div variants={staggerItem}>
        <PipelineDistributionInstrument
          applications={activeData.applicationsByStatus}
          matchDistribution={activeData.jobMatchDistribution}
        />
      </motion.div>

      {/* 4. TERTIARY HORIZON: Command Matrix & Telemetry Activity Stream */}
      <motion.section
        variants={staggerItem}
        aria-labelledby="tactical-deck"
        className="grid grid-cols-1 gap-5 lg:grid-cols-12"
      >
        {/* Left: Quick Command Matrix */}
        <Widget
          title="Tactical Command Matrix"
          subtitle="One-click operations & workspace launchers"
          span="lg:col-span-5 col-span-12"
        >
          <QuickActionsGrid
            items={[
              { id: "qa-1", label: "Upload / Sync Resume", icon: "upload", href: "/resumes" },
              { id: "qa-2", label: "Run ATS Diagnostics", icon: "sparkles", href: "/resumes" },
              { id: "qa-3", label: "Explore Match Pool", icon: "search", href: "/jobs" },
              { id: "qa-4", label: "Open Copilot Studio", icon: "bot", href: "/copilot" },
              {
                id: "qa-5",
                label: "Pipeline Kanban Tracker",
                icon: "kanban",
                href: "/applications",
              },
              { id: "qa-6", label: "AI Recommendations", icon: "star", href: "/recommendations" },
            ]}
          />
        </Widget>

        {/* Right: Recent Audit & Activity Stream */}
        <Widget
          title="Operational Telemetry Stream"
          subtitle="Real-time audit log across your career workspace"
          span="lg:col-span-7 col-span-12"
          action={
            <Button asChild size="sm" variant="ghost" className="h-7 rounded-lg text-xs font-mono">
              <Link to="/recommendations">Full Audit</Link>
            </Button>
          }
        >
          {timelineItems.length > 0 ? (
            <ActivityTimeline items={timelineItems} />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
              <Activity className="h-6 w-6 text-primary/60 mb-2 animate-pulse" />
              <span>Telemetry stream active. Workspace events will record in real-time.</span>
            </div>
          )}
        </Widget>
      </motion.section>
    </motion.div>
  );
}
