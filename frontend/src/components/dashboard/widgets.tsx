import { Link } from "@tanstack/react-router";
import type { ComponentType, ReactNode } from "react";
import { motion, useReducedMotion, useMotionValue, useSpring } from "framer-motion";
import { staggerItem } from "@/lib/motion";
import { useRef } from "react";
import {
  Sparkles,
  Target,
  Clock,
  Users,
  GraduationCap,
  AlertTriangle,
  FileText,
  Search,
  Bot,
  KanbanSquare,
  Upload,
  ArrowUpRight,
  TrendingUp,
  Trophy,
  Flame,
  Calendar,
  CheckCircle2,
  CircleDashed,
  Compass,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  BarChart3,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  PriorityCard,
  TrendPoint,
  StatusSlice,
  ActivityHeat,
  SkillGap,
  CareerGoal,
  Recommendation,
  TimelineEvent,
  UpcomingItem,
  Achievement,
  CareerInsight,
} from "@/lib/dashboard-data";

/* ─────────────────────────────────────── Widget shell */

export function Widget({
  title,
  subtitle,
  action,
  children,
  className,
  span,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  span?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={cn(span, className)}>
      <Card className="relative h-full rounded-lg border-2 border-border p-4 sm:p-5 shadow-brutal-sm bg-surface">
        <div className="mb-3.5 flex items-start justify-between gap-3 border-b-2 border-border pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <h2 className="truncate text-xs font-bold uppercase tracking-wider font-mono text-foreground">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground font-mono">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

/* ─────────────────────────────────────── Progress ring */

export function ProgressRing({
  value,
  size = 80,
  stroke = 6,
  label,
  sublabel,
  tone = "primary",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  tone?: "primary" | "success" | "warning" | "accent";
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * c;
  const toneClass = {
    primary: "text-primary drop-shadow-[0_0_8px_var(--color-primary)]",
    success: "text-success drop-shadow-[0_0_8px_var(--color-success)]",
    warning: "text-warning drop-shadow-[0_0_8px_var(--color-warning)]",
    accent: "text-accent drop-shadow-[0_0_8px_var(--color-accent)]",
  }[tone];

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="fill-none stroke-border/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className={cn(
            "fill-none transition-[stroke-dasharray] duration-700 ease-out motion-reduce:transition-none",
            toneClass,
          )}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-mono text-lg font-bold leading-none tracking-tight text-foreground">
            {label ?? `${clamped}%`}
          </div>
          {sublabel && (
            <div className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground font-mono font-medium">
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── Executive Telemetry Ribbon */

export function ExecutiveTelemetryRibbon({
  greeting,
  name,
  streak,
  health,
  resumeScore,
  matchPoolCount,
  highFitCount,
  weeklyProgress,
  weeklyGoalLabel,
}: {
  greeting: string;
  name: string;
  streak: number;
  health: { overall: number; delta: number };
  resumeScore: number;
  matchPoolCount: number;
  highFitCount: number;
  weeklyProgress: number;
  weeklyGoalLabel: string;
}) {
  return (
    <motion.div variants={staggerItem}>
      <div className="relative overflow-hidden rounded-lg border-2 border-border bg-surface p-4 sm:p-5 shadow-brutal-md">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] xl:items-center">
          {/* Executive identity & direct commands */}
          <div className="min-w-0 flex flex-col justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-sm border-2 border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary shadow-brutal-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  Executive Telemetry
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-sm border-2 border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-warning shadow-brutal-xs">
                  <Flame className="h-3 w-3 text-warning shrink-0" />
                  <span>{streak}-Day Active Streak</span>
                </div>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl text-foreground">
                {greeting}, <span className="text-primary">{name}</span>
              </h1>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-lg">
                Primary flight deck: real-time ATS calibration, spatial skill alignment, and
                high-impact career directives.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                asChild
                size="sm"
                className="h-8 rounded-md text-xs font-bold shadow-brutal-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link to="/resumes">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-white" /> Open Resume Studio
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 rounded-md text-xs font-semibold border-2 border-border bg-surface hover:bg-surface-elevated shadow-brutal-xs"
              >
                <Link to="/jobs">
                  <Search className="mr-1.5 h-3.5 w-3.5 text-primary" /> Browse Match Pool
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 rounded-md text-xs font-semibold border-2 border-border bg-surface hover:bg-surface-elevated text-muted-foreground hover:text-foreground shadow-brutal-xs"
              >
                <Link to="/resumes">
                  <Target className="mr-1.5 h-3.5 w-3.5 text-primary" /> Match Intelligence
                </Link>
              </Button>
            </div>
          </div>

          {/* Telemetry Gauge Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 border-t-2 border-border pt-4 xl:border-t-0 xl:border-l-2 xl:border-border xl:pl-6 xl:pt-0">
            {/* 1. Health Score Ring */}
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-border bg-surface-elevated p-3 text-center shadow-brutal-xs hover:border-primary transition-all">
              <ProgressRing value={health.overall} tone="primary" sublabel="Health" />
              <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-success">
                <ArrowUpRight className="h-3 w-3" />+{health.delta}%
              </div>
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider font-semibold">
                Career Health
              </span>
            </div>

            {/* 2. ATS Readiness */}
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-border bg-surface-elevated p-3 text-center shadow-brutal-xs hover:border-primary transition-all">
              <ProgressRing value={resumeScore} tone="accent" sublabel="ATS" />
              <Badge
                variant="outline"
                className="h-4 border-primary/40 bg-primary/10 px-1.5 font-mono text-[9px] font-bold text-primary"
              >
                Target 90+
              </Badge>
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider font-semibold">
                ATS Readiness
              </span>
            </div>

            {/* 3. Matching Pool */}
            <div className="flex flex-col items-center justify-center gap-1 rounded-md border-2 border-border bg-surface-elevated p-3 text-center shadow-brutal-xs hover:border-primary transition-all">
              <div className="grid h-12 w-12 place-items-center rounded-md border-2 border-primary/40 bg-primary/10 text-primary shadow-brutal-xs">
                <Target className="h-6 w-6" />
              </div>
              <div className="mt-1 font-mono text-lg font-bold text-foreground">
                {matchPoolCount}{" "}
                <span className="text-xs font-normal text-muted-foreground">Roles</span>
              </div>
              <div className="text-[10px] font-mono text-emerald-400 font-bold">
                {highFitCount} High-Fit (80%+)
              </div>
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider font-semibold">
                Target Pool
              </span>
            </div>

            {/* 4. Weekly Velocity */}
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-border bg-surface-elevated p-3 text-center shadow-brutal-xs hover:border-primary transition-all">
              <ProgressRing value={weeklyProgress} tone="success" sublabel="Velocity" />
              <div className="truncate text-[10px] font-bold text-muted-foreground font-mono max-w-[90px]">
                {weeklyGoalLabel}
              </div>
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider font-semibold">
                Weekly Goal
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────── Legacy CommandHero */

export function CommandHero(props: {
  greeting: string;
  name: string;
  streak: number;
  health: { overall: number; delta: number };
  resume: number;
  weekly: number;
  weeklyLabel: string;
}) {
  return (
    <ExecutiveTelemetryRibbon
      greeting={props.greeting}
      name={props.name}
      streak={props.streak}
      health={props.health}
      resumeScore={props.resume}
      matchPoolCount={22}
      highFitCount={8}
      weeklyProgress={props.weekly}
      weeklyGoalLabel={props.weeklyLabel}
    />
  );
}

/* ─────────────────────────────────────── Action Directives Panel */

export interface CareerDirectiveItem {
  id: string;
  title: string;
  detail: string;
  scoreImpact?: string;
  badge: string;
  tone: "primary" | "success" | "warning" | "accent";
  actionLabel: string;
  href: string;
  icon: "resume" | "ats" | "jobs" | "skills" | "interview";
}

export function CareerActionDirectives({ directives }: { directives: CareerDirectiveItem[] }) {
  const iconMap: Record<CareerDirectiveItem["icon"], ComponentType<{ className?: string }>> = {
    resume: Sparkles,
    ats: Target,
    jobs: Search,
    skills: GraduationCap,
    interview: Calendar,
  };

  const toneClasses: Record<
    CareerDirectiveItem["tone"],
    { ring: string; badge: string; text: string; bg: string }
  > = {
    primary: {
      ring: "border-primary/50 hover:border-primary",
      badge: "border-2 border-primary/40 text-primary bg-primary/10",
      text: "text-primary",
      bg: "bg-primary/10 text-primary",
    },
    success: {
      ring: "border-success/50 hover:border-success",
      badge: "border-2 border-success/40 text-success bg-success/10",
      text: "text-success",
      bg: "bg-success/10 text-success",
    },
    warning: {
      ring: "border-warning/50 hover:border-warning",
      badge: "border-2 border-warning/40 text-warning bg-warning/10",
      text: "text-warning",
      bg: "bg-warning/10 text-warning",
    },
    accent: {
      ring: "border-primary/50 hover:border-primary",
      badge: "border-2 border-primary/40 text-primary bg-primary/10",
      text: "text-primary",
      bg: "bg-primary/10 text-primary",
    },
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden rounded-lg border-2 border-border bg-surface shadow-brutal-md p-4 sm:p-5">
      <div className="flex items-center justify-between border-b-2 border-border pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" />
          <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-foreground">
            High-Leverage Career Directives
          </h2>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] font-bold text-muted-foreground border-2 border-border"
        >
          {directives.length} PENDING
        </Badge>
      </div>

      <div className="mt-3.5 flex flex-col gap-2.5 grow justify-between">
        {directives.map((d) => {
          const Icon = iconMap[d.icon];
          const tone = toneClasses[d.tone];

          return (
            <div
              key={d.id}
              className={cn(
                "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border-2 border-border bg-surface p-3 transition-all hover:bg-surface-elevated hover:shadow-brutal-xs hover:border-primary",
                tone.ring,
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-border",
                    tone.bg,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {d.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn("text-[9px] font-mono uppercase px-1.5 py-0", tone.badge)}
                    >
                      {d.badge}
                    </Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground leading-snug">
                    {d.detail}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-border/40 sm:border-t-0">
                {d.scoreImpact && (
                  <span className="font-mono text-[11px] font-semibold text-emerald-400">
                    {d.scoreImpact}
                  </span>
                )}
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-mono font-medium rounded-lg border-border/80 group-hover:border-primary/50 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                >
                  <Link to={d.href}>
                    {d.actionLabel} <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── Pipeline & Distribution Instrument */

export function PipelineDistributionInstrument({
  applications,
  matchDistribution,
}: {
  applications: StatusSlice[];
  matchDistribution: StatusSlice[];
}) {
  const totalApps = applications.reduce((s, a) => s + a.value, 0);
  const totalMatches = matchDistribution.reduce((s, m) => s + m.value, 0);

  return (
    <div className="workstation-panel spatial-card relative rounded-xl border border-border/80 bg-surface p-4 sm:p-5 shadow-elevation-1">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Pipeline Distribution & Match Calibration
          </h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span>
            Active Pipeline: <strong className="text-foreground">{totalApps}</strong>
          </span>
          <span>•</span>
          <span>
            Match Pool: <strong className="text-foreground">{totalMatches}</strong>
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {/* Pipeline Breakdown Gauges */}
        <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-surface-instrument/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Application Conversion Stages
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">CONVERSION FLOW</span>
          </div>

          {/* Segmented Linear Track */}
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/60 p-0.5 gap-0.5">
            {applications.map((app) => {
              const pct = totalApps > 0 ? (app.value / totalApps) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={app.label}
                  style={{ width: `${pct}%`, backgroundColor: app.color }}
                  className="h-full rounded-xs transition-all hover:opacity-80"
                  title={`${app.label}: ${app.value} (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {applications.map((app) => (
              <div
                key={app.label}
                className="flex flex-col rounded-md border border-border/40 bg-surface/50 p-2 text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: app.color }} />
                  <span className="text-[11px] text-muted-foreground">{app.label}</span>
                </div>
                <span className="mt-1 font-mono text-sm font-bold text-foreground">
                  {app.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Match Tiers Calibration */}
        <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-surface-instrument/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Target Role Compatibility Tiers
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">FIT SPECTRUM</span>
          </div>

          <div className="space-y-2">
            {matchDistribution.map((tier) => {
              const pct = totalMatches > 0 ? Math.round((tier.value / totalMatches) * 100) : 0;
              return (
                <div key={tier.label} className="space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: tier.color }}
                      />
                      {tier.label}
                    </span>
                    <span className="font-medium text-foreground">
                      {tier.value} roles <span className="text-muted-foreground">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: tier.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── Priorities legacy tile */

const priorityIcon: Record<PriorityCard["kind"], ComponentType<{ className?: string }>> = {
  resume: Sparkles,
  jobs: Target,
  followup: Users,
  interview: Calendar,
  skills: GraduationCap,
  expiring: AlertTriangle,
};

const accentClass: Record<PriorityCard["accent"], string> = {
  primary: "text-primary bg-primary/10 ring-primary/20",
  success: "text-success bg-success/10 ring-success/20",
  warning: "text-warning bg-warning/10 ring-warning/25",
  destructive: "text-destructive bg-destructive/10 ring-destructive/20",
  accent: "text-accent bg-accent/10 ring-accent/25",
};

export function PriorityTile({ p }: { p: PriorityCard }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 300, damping: 25 });
  const springY = useSpring(rotateY, { stiffness: 300, damping: 25 });
  const reducedMotion = useReducedMotion();

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rotateY.set(((e.clientX - cx) / (rect.width / 2)) * 4);
    rotateX.set(-((e.clientY - cy) / (rect.height / 2)) * 4);
  }

  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  const Icon = priorityIcon[p.kind];
  return (
    <motion.div
      ref={ref}
      variants={staggerItem}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ perspective: "800px", rotateX: springX, rotateY: springY }}
      className="h-full"
    >
      <a
        href={p.href}
        className="group relative flex h-full flex-col overflow-hidden rounded-lg border-2 border-border bg-surface p-4 transition-all hover:border-primary hover:shadow-brutal-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1",
              accentClass[p.accent],
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          {p.count !== undefined && (
            <Badge variant="secondary" className="rounded-md font-mono text-xs">
              {p.count}
            </Badge>
          )}
        </div>
        <div className="mt-3 min-w-0 grow">
          <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
            {p.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {p.detail}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 font-mono">
            {p.meta}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground/90 group-hover:text-primary transition-colors">
            {p.cta}{" "}
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </a>
    </motion.div>
  );
}

/* ─────────────────────────────────────── Charts */

const chartAxis = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };
const gridStroke = "hsl(var(--border) / 0.5)";

export function TrendAreaChart({
  data,
  color = "hsl(var(--primary))",
}: {
  data: TrendPoint[];
  color?: string;
}) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={chartAxis} />
          <YAxis tickLine={false} axisLine={false} tick={chartAxis} domain={[40, 100]} />
          <Tooltip
            cursor={{ stroke: gridStroke }}
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#areaFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DualLineChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={chartAxis} />
          <YAxis tickLine={false} axisLine={false} tick={chartAxis} domain={[50, 100]} />
          <Tooltip
            cursor={{ stroke: gridStroke }}
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="secondary"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export type ChartSliceItem = {
  label?: string;
  name?: string;
  value: number;
  color?: string;
};

const DEFAULT_CHART_COLORS = [
  "oklch(0.64 0.21 258)",
  "oklch(0.66 0.18 290)",
  "oklch(0.74 0.16 152)",
  "oklch(0.78 0.15 75)",
  "oklch(0.64 0.22 27)",
];

export function DonutChart({
  data,
  centerLabel,
}: {
  data: (StatusSlice | ChartSliceItem)[];
  centerLabel: string;
}) {
  const normalized = data.map((d, i) => {
    const item = d as ChartSliceItem;
    return {
      label: item.label ?? item.name ?? `Item ${i + 1}`,
      value: item.value,
      color: item.color ?? DEFAULT_CHART_COLORS[i % DEFAULT_CHART_COLORS.length],
    };
  });

  const total = normalized.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <div className="relative h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={normalized}
              innerRadius={44}
              outerRadius={68}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {normalized.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="font-mono text-xl font-semibold text-foreground">{total}</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {centerLabel}
            </div>
          </div>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs">
        {normalized.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="ml-auto font-mono text-foreground/90 font-medium">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DistributionBars({ data }: { data: (StatusSlice | ChartSliceItem)[] }) {
  const normalized = data.map((d, i) => {
    const item = d as ChartSliceItem;
    return {
      label: item.label ?? item.name ?? `Item ${i + 1}`,
      value: item.value,
      color: item.color ?? DEFAULT_CHART_COLORS[i % DEFAULT_CHART_COLORS.length],
    };
  });

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={normalized} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={chartAxis} />
          <YAxis tickLine={false} axisLine={false} tick={chartAxis} />
          <Tooltip
            cursor={{ fill: "var(--surface-elevated)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {normalized.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────── Heatmap */

export function ActivityHeatmap({ data }: { data: ActivityHeat[] }) {
  const buckets = data[0]?.values.length ?? 7;
  return (
    <div className="grid gap-1.5">
      {data.map((row) => (
        <div key={row.day} className="grid grid-cols-[32px_1fr] items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {row.day}
          </span>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${buckets}, minmax(0, 1fr))` }}
          >
            {row.values.map((v, i) => (
              <div
                key={i}
                className="aspect-square rounded-[4px] ring-1 ring-inset ring-border/40 transition"
                style={{
                  background:
                    v === 0
                      ? "hsl(var(--muted) / 0.35)"
                      : `hsl(var(--primary) / ${0.2 + v * 0.18})`,
                }}
                title={`${row.day} · ${v} actions`}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0.2, 0.4, 0.6, 0.8].map((o) => (
          <span
            key={o}
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ background: `hsl(var(--primary) / ${o})` }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── Skill gap + goals */

export function SkillGapList({ items }: { items: SkillGap[] }) {
  return (
    <ul className="space-y-4">
      {items.map((s) => (
        <li key={s.skill}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="truncate font-medium">{s.skill}</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {s.current}→{s.target} · {s.jobs} jobs
            </span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-muted/40">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-primary to-accent transition-[width] duration-700 motion-reduce:transition-none"
              style={{ width: `${s.current}%` }}
            />
            <div
              className="absolute inset-y-0 w-0.5 bg-foreground/60"
              style={{ left: `${s.target}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function GoalList({ items }: { items: CareerGoal[] }) {
  return (
    <ul className="space-y-3.5">
      {items.map((g) => (
        <li key={g.id}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="truncate">{g.label}</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {g.progress}% · {g.target}
            </span>
          </div>
          <Progress value={g.progress} className="h-1.5" />
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────────────── Recommendations */

const recIcon: Record<Recommendation["kind"], ComponentType<{ className?: string }>> = {
  job: Target,
  resume: FileText,
  learning: GraduationCap,
  insight: TrendingUp,
  interview: Calendar,
};

export function RecommendationRow({ r }: { r: Recommendation }) {
  const Icon = recIcon[r.kind];
  return (
    <div className="group flex items-start gap-3 rounded-xl border border-transparent p-3 transition hover:border-border/60 hover:bg-background/30 motion-reduce:transition-none">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background/50 text-foreground/80 ring-1 ring-border/60">
        <Icon className="h-[16px] w-[16px]" />
      </div>
      <div className="min-w-0 grow">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-sm font-medium">{r.title}</h4>
          {r.score !== undefined && (
            <Badge variant="secondary" className="rounded-full font-mono text-[10px]">
              {r.score}%
            </Badge>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.detail}</p>
      </div>
      <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">{r.meta}</span>
    </div>
  );
}

/* ─────────────────────────────────────── Timeline */

const timelineDot: Record<TimelineEvent["kind"], string> = {
  resume: "bg-primary",
  ats: "bg-success",
  job: "bg-accent",
  application: "bg-warning",
  interview: "bg-foreground",
};

export function ActivityTimeline({ items }: { items: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-4 pl-5">
      <div className="absolute inset-y-1 left-[7px] w-px bg-border/60" />
      {items.map((e) => (
        <li key={e.id} className="relative">
          <span
            className={cn(
              "absolute -left-[18px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background/60",
              timelineDot[e.kind],
            )}
          />
          <div className="flex items-baseline justify-between gap-3">
            <h4 className="truncate text-xs font-semibold text-foreground">{e.title}</h4>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{e.time}</span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground leading-snug">
            {e.detail}
          </p>
        </li>
      ))}
    </ol>
  );
}

/* ─────────────────────────────────────── Upcoming */

const urgencyStyle: Record<UpcomingItem["urgency"], string> = {
  today: "text-destructive bg-destructive/10 ring-destructive/20",
  soon: "text-warning bg-warning/10 ring-warning/25",
  later: "text-muted-foreground bg-muted/40 ring-border/60",
};

export function UpcomingList({ items }: { items: UpcomingItem[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((u) => (
        <li
          key={u.id}
          className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/30 p-3"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background/60 ring-1 ring-border/60">
            <Calendar className="h-4 w-4 text-foreground/80" />
          </div>
          <div className="min-w-0 grow">
            <div className="flex items-center gap-2">
              <h4 className="truncate text-sm font-medium">{u.title}</h4>
              <span
                className={cn(
                  "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1",
                  urgencyStyle[u.urgency],
                )}
              >
                {u.when}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{u.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────────────── Quick command matrix */

const qaIcon: Record<string, ComponentType<{ className?: string }>> = {
  upload: Upload,
  search: Search,
  sparkles: Sparkles,
  file: FileText,
  bot: Bot,
  kanban: KanbanSquare,
  star: Target,
};

export function QuickActionsGrid({
  items,
}: {
  items: ReadonlyArray<{ id: string; label: string; icon: string; href: string }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((a) => {
        const Icon = qaIcon[a.icon] ?? Sparkles;
        return (
          <Link
            key={a.id}
            to={a.href}
            className="group flex flex-col items-start gap-2 rounded-md border-2 border-border bg-surface p-3 transition-all hover:border-primary hover:bg-surface-elevated hover:shadow-brutal-xs"
          >
            <div className="grid h-8 w-8 place-items-center rounded-sm border-2 border-primary/40 bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
              {a.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────── Achievements */

const tierRing: Record<Achievement["tier"], string> = {
  bronze: "text-amber-500 bg-amber-500/10 ring-amber-500/20",
  silver: "text-slate-300 bg-slate-300/10 ring-slate-300/20",
  gold: "text-yellow-400 bg-yellow-400/10 ring-yellow-400/20",
  platinum: "text-primary bg-primary/10 ring-primary/20",
};

export function AchievementCard({ a }: { a: Achievement }) {
  return (
    <div
      className={cn(
        "glass spatial-card relative flex h-full flex-col overflow-hidden rounded-xl border border-border/80 p-4 transition-colors",
        a.earned ? "bg-surface shadow-xs" : "bg-surface/50 opacity-90",
      )}
    >
      <div className="relative flex items-start justify-between">
        <div className={cn("grid h-9 w-9 place-items-center rounded-lg ring-1", tierRing[a.tier])}>
          <Trophy className="h-4 w-4" />
        </div>
        {a.earned ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : (
          <CircleDashed className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="relative mt-3 min-w-0">
        <h4 className="text-xs font-semibold text-foreground">{a.title}</h4>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {a.detail}
        </p>
      </div>
      <div className="relative mt-3 border-t border-border/40 pt-2.5">
        {a.earned ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
            Earned · {a.earnedAt}
          </span>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>In progress</span>
              <span className="font-mono">{a.progress}%</span>
            </div>
            <Progress value={a.progress ?? 0} className="h-1" />
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── Insight ribbon */

const insightStyle: Record<CareerInsight["kind"], { badge: string; border: string }> = {
  trend: { badge: "bg-primary/10 text-primary border-primary/40", border: "border-primary" },
  opportunity: {
    badge: "bg-success/10 text-success border-success/40",
    border: "border-success",
  },
  gap: { badge: "bg-warning/10 text-warning border-warning/40", border: "border-warning" },
};

export function InsightPill({ i }: { i: CareerInsight }) {
  const meta = insightStyle[i.kind];
  return (
    <div
      className={cn(
        "relative rounded-md border-2 border-border bg-surface p-3.5 shadow-brutal-xs transition-colors hover:border-primary",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-sm border-2", meta.badge)}
        >
          <TrendingUp className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            {i.kind === "trend" ? "Trend" : i.kind === "opportunity" ? "Opportunity" : "Next Step"}
          </div>
          <p className="mt-0.5 text-xs text-foreground/90 font-medium leading-snug">{i.text}</p>
        </div>
      </div>
    </div>
  );
}
