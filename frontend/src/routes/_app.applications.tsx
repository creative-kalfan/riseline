import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import {
  KanbanSquare,
  LayoutList,
  CalendarDays,
  GanttChartSquare,
  Search,
  Filter,
  Star,
  Bookmark,
  Archive,
  XCircle,
  Trophy,
  Briefcase,
  ClipboardList,
  MessageSquare,
  Sparkles,
  Building2,
  PanelLeft,
  PanelRight,
  ChevronRight,
  StickyNote,
  Paperclip,
  Users,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useApplications,
  useApplicationStats,
  useCreateApplication,
  useUpdateApplicationStatus,
  useDeleteApplication,
  useSetApplicationFavorite,
  useSetApplicationArchived,
  useAddApplicationChild,
  useUpdateApplicationChild,
  useDeleteApplicationChild,
} from "@/hooks/api/useApplications";
import { getCalendarEvents, searchApplications, sidebarFilters } from "@/lib/applications";
import { APPLICATION_STAGES } from "@/types/application";
import type { ApplicationStage, ApplicationStatus } from "@/types/application";
import type { ApplicationUI } from "@/lib/applications";
import {
  ApplicationCard,
  KanbanColumn,
  AppTimeline,
  InterviewRounds,
  AssessmentList,
  FollowUpRow,
  CompanyCard,
  SectionCard,
  StatsStrip,
  LabeledProgress,
  CompanyLogo,
  StagePill,
  UrgencyChip,
  StatRing,
} from "@/components/mission/parts";
import { MonthCalendar } from "@/components/mission/calendar";

export const Route = createFileRoute("/_app/applications")({
  head: () => ({
    meta: [
      { title: "Mission Control · CareerOS" },
      {
        name: "description",
        content:
          "Timeline, kanban and calendar for every application, interview and offer you run.",
      },
    ],
  }),
  component: MissionControl,
});

type ViewMode = "kanban" | "timeline" | "list" | "calendar";

const filterIcon = {
  all: LayoutList,
  interviews: Users,
  assessments: ClipboardList,
  offers: Trophy,
  rejected: XCircle,
  archived: Archive,
  saved: Bookmark,
  bookmarks: Star,
} as const;

function MissionControl() {
  const navigate = useNavigate();
  const [filterId, setFilterId] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("kanban");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>("");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Dialog open states
  const [addAppOpen, setAddAppOpen] = useState(false);
  const [addInterviewOpen, setAddInterviewOpen] = useState(false);
  const [addAssessmentOpen, setAddAssessmentOpen] = useState(false);
  const [addFollowUpOpen, setAddFollowUpOpen] = useState(false);

  // Live backend data
  const { data: applications = [], isLoading, isError, error } = useApplications();
  const { data: stats } = useApplicationStats();

  // Mutations
  const createMutation = useCreateApplication();
  const updateStatusMutation = useUpdateApplicationStatus();
  const deleteMutation = useDeleteApplication();
  const favoriteMutation = useSetApplicationFavorite();
  const archiveMutation = useSetApplicationArchived();
  const addChildMutation = useAddApplicationChild();
  const updateChildMutation = useUpdateApplicationChild();
  const deleteChildMutation = useDeleteApplicationChild();

  // Derive the active application from the list
  const active = useMemo(() => {
    if (!activeId && applications.length > 0) {
      return applications[0];
    }
    return (
      applications.find((a) => a.id === activeId) ??
      (applications.length > 0 ? applications[0] : null)
    );
  }, [applications, activeId]);

  // Update active ID when data loads
  useEffect(() => {
    if (!activeId && applications.length > 0) {
      setActiveId(applications[0].id);
    }
  }, [applications, activeId]);

  // Get current sidebar filter definition
  const currentFilter = useMemo(() => {
    return sidebarFilters.find((s) => s.id === filterId) ?? sidebarFilters[0];
  }, [filterId]);

  // Filter application set
  const filtered = useMemo(() => {
    let list = applications;
    if (currentFilter.favorites) list = list.filter((a) => a.favorite);
    else if (currentFilter.stages.length)
      list = list.filter((a) => currentFilter.stages.includes(a.stage));
    if (query.trim()) {
      list = searchApplications(list, query);
    }
    return list;
  }, [currentFilter, query, applications]);

  const byStage = useMemo(() => {
    const groups: Record<string, ApplicationUI[]> = {};
    filtered.forEach((a) => {
      if (!groups[a.stage]) groups[a.stage] = [];
      groups[a.stage].push(a);
    });
    return groups;
  }, [filtered]);

  // Calendar events derived from real applications
  const calendarEvents = useMemo(() => getCalendarEvents(applications), [applications]);

  // All follow-ups aggregated across applications
  const allFollowUps = useMemo(() => {
    return applications.flatMap((a) =>
      (a.followUps ?? []).map((f) => ({
        ...f,
        applicationId: a.id,
        company: a.company,
        role: a.role,
        kind: "task" as const,
        status: (f.status === "completed" ? "completed" : "pending") as "completed" | "pending",
        note: f.notes ?? "",
      })),
    );
  }, [applications]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        (document.querySelector("input[data-mc-search]") as HTMLInputElement | null)?.focus();
        return;
      }
      if (e.key === "j" || e.key === "k") {
        const idx = filtered.findIndex((a) => a.id === activeId);
        const next = e.key === "j" ? Math.min(filtered.length - 1, idx + 1) : Math.max(0, idx - 1);
        if (filtered[next]) setActiveId(filtered[next].id);
      }
      if (e.key === "[") setLeftOpen((v) => !v);
      if (e.key === "]") setRightOpen((v) => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, activeId]);

  const kanbanStages: ApplicationStage[] = [
    "saved",
    "to_apply",
    "applied",
    "screening",
    "assessment",
    "interview",
    "offer",
    "accepted",
    "rejected",
  ];

  // Action handlers
  const handleStatusChange = async (appId: string, status: ApplicationStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: appId, status });
      toast.success(`Stage updated to ${status}`);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to update stage");
    }
  };

  const handleToggleFavorite = async (app: ApplicationUI) => {
    try {
      await favoriteMutation.mutateAsync({ id: app.id, favorite: !app.favorite });
      toast.success(app.favorite ? "Removed from bookmarks" : "Bookmarked application");
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to update bookmark");
    }
  };

  const handleToggleArchive = async (app: ApplicationUI) => {
    const isArchived = app.stage === "archived";
    try {
      await archiveMutation.mutateAsync({ id: app.id, archived: !isArchived });
      toast.success(isArchived ? "Restored from archive" : "Application archived");
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to archive application");
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await deleteMutation.mutateAsync(appId);
      toast.success("Application deleted");
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to delete application");
    }
  };

  const handleDeleteChild = async (
    appId: string,
    kind: "interviews" | "assessments" | "contacts" | "follow-ups",
    childId: string,
  ) => {
    try {
      await deleteChildMutation.mutateAsync({ applicationId: appId, kind, childId });
      toast.success("Item deleted");
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to delete item");
    }
  };

  const handleToggleFollowUp = async (appId: string, followUpId: string, completed: boolean) => {
    try {
      await updateChildMutation.mutateAsync({
        applicationId: appId,
        kind: "follow-ups",
        childId: followUpId,
        data: { status: completed ? "completed" : "pending" },
      });
      toast.success(completed ? "Follow-up completed" : "Follow-up pending");
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to update follow-up");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-[1536px] mx-auto flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          eyebrow="Mission Control"
          title="Your hiring journey, orchestrated"
          description="Every application, interview and offer — with AI keeping you one step ahead."
        />
        <div className="grid gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 flex-1 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="w-full max-w-[1536px] mx-auto flex flex-col items-center justify-center gap-4 px-4 sm:px-6 lg:px-8 py-20">
        <ErrorState
          title="Failed to load applications"
          error={error}
          onRetry={() => window.location.reload()}
          className="max-w-md"
        />
      </div>
    );
  }

  // Empty state
  if (applications.length === 0) {
    return (
      <div className="w-full max-w-[1536px] mx-auto flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          eyebrow="Mission Control"
          title="Your hiring journey, orchestrated"
          description="Every application, interview and offer — with AI keeping you one step ahead."
        />
        <EmptyState
          icon={Briefcase}
          title="No applications yet"
          description="Start tracking your job applications by adding your first one or discovering roles in Job Intelligence."
          action={
            <Button className="rounded-xl shadow-xs" onClick={() => setAddAppOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add your first application
            </Button>
          }
          className="p-16"
        />
        <AddApplicationDialog
          open={addAppOpen}
          onOpenChange={setAddAppOpen}
          onCreate={async (data) => {
            const res = await createMutation.mutateAsync(data);
            setActiveId(res.id);
            setAddAppOpen(false);
            toast.success("Application created", { description: `${res.role} at ${res.company}` });
          }}
          isSubmitting={createMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1536px] mx-auto flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6 select-text">
      <PageHeader
        eyebrow="Mission Control"
        title="Your hiring journey, orchestrated"
        description="Every application, interview and offer — with AI keeping you one step ahead."
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              className="hidden rounded border-2 border-border shadow-brutal-xs hover:shadow-brutal-sm lg:inline-flex"
              aria-label="Toggle filters"
              onClick={() => setLeftOpen((v) => !v)}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden rounded border-2 border-border shadow-brutal-xs hover:shadow-brutal-sm xl:inline-flex"
              aria-label="Toggle AI assistant"
              onClick={() => setRightOpen((v) => !v)}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
            <Button
              className="rounded border-2 border-primary shadow-brutal-primary font-mono text-xs uppercase tracking-wider"
              onClick={() => setAddAppOpen(true)}
            >
              <Sparkles className="mr-1.5 h-4 w-4" /> Add Application
            </Button>
          </>
        }
      />

      {stats && (
        <StatsStrip
          applications={stats.applications}
          interviewRate={stats.interviewRate}
          offerRate={stats.offerRate}
          acceptanceRate={stats.acceptanceRate}
          streakDays={stats.streakDays}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-border bg-card p-2 sm:p-2.5 shadow-brutal-xs">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-mc-search
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, role, location…    ⌘M"
            className="h-10 rounded border-2 border-border bg-background pl-9 text-xs sm:text-sm font-sans"
          />
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList className="rounded border-2 border-border bg-muted/40 p-1">
            <TabsTrigger value="kanban" className="gap-1.5 rounded font-mono text-xs font-bold uppercase">
              <KanbanSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5 rounded font-mono text-xs font-bold uppercase">
              <GanttChartSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5 rounded font-mono text-xs font-bold uppercase">
              <LayoutList className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5 rounded font-mono text-xs font-bold uppercase">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" className="h-10 rounded border-2 border-border font-mono text-xs uppercase tracking-wider shadow-brutal-xs hover:shadow-brutal-sm">
          <Filter className="mr-1.5 h-3.5 w-3.5" /> Filters
        </Button>
      </div>

      {/* Three-pane layout */}
      <div
        className={cn(
          "grid gap-4 transition-[grid-template-columns] duration-300 motion-reduce:transition-none",
          leftOpen &&
            rightOpen &&
            "xl:grid-cols-[220px_minmax(0,1fr)_320px] lg:grid-cols-[220px_minmax(0,1fr)]",
          leftOpen && !rightOpen && "lg:grid-cols-[220px_minmax(0,1fr)]",
          !leftOpen && rightOpen && "xl:grid-cols-[minmax(0,1fr)_320px]",
          !leftOpen && !rightOpen && "grid-cols-1",
        )}
      >
        {/* LEFT SIDEBAR */}
        {leftOpen && (
          <aside className="hidden rounded-lg border-2 border-border bg-card p-3 lg:block shadow-brutal-xs">
            <div className="mb-2 px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Directives
            </div>
            <nav className="flex flex-col gap-1">
              {sidebarFilters.map((f) => {
                const Icon = (filterIcon as Record<string, typeof LayoutList>)[f.id] ?? LayoutList;
                const count = f.favorites
                  ? applications.filter((a) => a.favorite).length
                  : f.stages.length
                    ? applications.filter((a) => f.stages.includes(a.stage)).length
                    : applications.filter((a) => !["saved", "archived"].includes(a.stage)).length;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilterId(f.id)}
                    className={cn(
                      "group flex items-center gap-2 rounded border-2 px-2.5 py-1.5 text-left text-xs font-medium transition-all",
                      filterId === f.id
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-brutal-xs"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 truncate">{f.label}</span>
                    <span className="ml-auto font-mono text-[10px] font-bold">{count}</span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-4 mb-2 px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Temporal Views
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setView("calendar")}
                className="flex items-center gap-2 rounded border-2 border-transparent px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground transition-all"
              >
                <CalendarDays className="h-3.5 w-3.5" /> Calendar View
              </button>
              <button
                onClick={() => setView("timeline")}
                className="flex items-center gap-2 rounded border-2 border-transparent px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground transition-all"
              >
                <GanttChartSquare className="h-3.5 w-3.5" /> Timeline View
              </button>
            </div>
          </aside>
        )}

        {/* CENTER */}
        <section className="min-w-0">
          {view === "kanban" && (
            <ScrollArea className="rounded-lg border-2 border-border bg-card/40 p-3 shadow-brutal-xs">
              <motion.div
                className="flex min-w-max gap-3"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {kanbanStages.map((s) => (
                  <motion.div key={s} variants={staggerItem}>
                    <KanbanColumn
                      stage={s}
                      apps={byStage[s] ?? []}
                      activeId={active?.id}
                      onSelect={setActiveId}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </ScrollArea>
          )}

          {view === "list" && (
            <motion.div
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {filtered.map((a) => (
                <motion.div key={a.id} variants={staggerItem}>
                  <ApplicationCard app={a} active={a.id === active?.id} onSelect={setActiveId} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {view === "timeline" && (
            <div className="rounded-lg border-2 border-border bg-card p-5 shadow-brutal-xs">
              <h3 className="mb-4 text-xs font-mono font-bold uppercase tracking-wider">Weekly Pipeline Progression</h3>
              <div className="space-y-6">
                {filtered.map((a) => (
                  <div key={a.id} className="grid grid-cols-[minmax(0,180px)_1fr] gap-4">
                    <button
                      onClick={() => setActiveId(a.id)}
                      className="flex items-start gap-2 text-left cursor-pointer"
                    >
                      <CompanyLogo label={a.logo} size={32} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{a.company}</div>
                        <div className="truncate text-[11px] font-mono text-muted-foreground">{a.role}</div>
                      </div>
                    </button>
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <StagePill stage={a.stage} />
                        {a.nextAction && (
                          <UrgencyChip
                            urgency={a.nextAction.urgency}
                            label={`${a.nextAction.label} · ${a.nextAction.when}`}
                          />
                        )}
                      </div>
                      <div className="relative h-2 overflow-hidden rounded-none border border-border/60 bg-muted/60">
                        <div
                          className="absolute inset-y-0 left-0 bg-primary"
                          style={{ width: `${a.progress}%` }}
                        />
                      </div>
                      <div className="mt-2 flex gap-4 font-mono text-[11px] text-muted-foreground">
                        <span>Updated {a.updatedAt}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "calendar" && (
            <div className="rounded-lg border-2 border-border bg-card p-5 shadow-brutal-xs">
              <MonthCalendar
                year={new Date().getFullYear()}
                month={new Date().getMonth()}
                events={calendarEvents}
              />
            </div>
          )}

          {/* Application detail */}
          {active && (
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <SectionCard
                title={active.company}
                subtitle={active.role}
                icon={Building2}
                action={
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(active)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-warning transition cursor-pointer"
                      title={active.favorite ? "Bookmarked" : "Add bookmark"}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          active.favorite ? "fill-warning text-warning" : "text-muted-foreground",
                        )}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(active)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition cursor-pointer"
                      title={active.stage === "archived" ? "Unarchive" : "Archive"}
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteApplication(active.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive transition cursor-pointer"
                      title="Delete application"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                }
              >
                <div className="flex items-start gap-3">
                  <CompanyLogo label={active.logo} size={44} />
                  <div className="min-w-0 grow text-xs text-muted-foreground">
                    {active.location && <div>{active.location}</div>}
                    {active.salary && (
                      <div className="mt-0.5 text-foreground/90">{active.salary}</div>
                    )}
                    {active.recruiter && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <Users className="h-3 w-3" /> {active.recruiter.name} ·{" "}
                        {active.recruiter.role}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <span className="text-[11px] font-medium text-muted-foreground">Stage</span>
                  <Select
                    value={active.stage === "archived" ? "applied" : active.stage}
                    onValueChange={(val) => handleStatusChange(active.id, val as ApplicationStatus)}
                  >
                    <SelectTrigger className="h-7 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICATION_STAGES.filter((s) => s.id !== "archived").map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-3">
                  <LabeledProgress label="Pipeline progress" value={active.progress} />
                </div>
                {active.notes && (
                  <div className="mt-4 rounded-xl border border-border/80 bg-surface/40 p-3 shadow-xs">
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <StickyNote className="h-3 w-3" /> Notes
                    </div>
                    <p className="text-xs text-foreground/85">{active.notes}</p>
                  </div>
                )}
                {active.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {active.attachments.map((f) => (
                      <span
                        key={f.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface-elevated/60 px-2 py-1 text-[11px] shadow-2xs"
                      >
                        <Paperclip className="h-3 w-3" /> {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Interview rounds"
                subtitle="Schedule & notes"
                icon={Users}
                action={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => setAddInterviewOpen(true)}
                  >
                    <Plus className="h-3 w-3" /> Add round
                  </Button>
                }
              >
                <InterviewRounds
                  rounds={active.interviews}
                  onDelete={(id) => handleDeleteChild(active.id, "interviews", id)}
                  onPrepare={(interviewId) =>
                    navigate({
                      to: "/interview-prep",
                      search: { applicationId: active.id, interviewId },
                    })
                  }
                />
                <div className="mt-4 border-t border-border/60 pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Assessments
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1.5 text-[11px] gap-1"
                      onClick={() => setAddAssessmentOpen(true)}
                    >
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>
                  <AssessmentList
                    items={active.assessments}
                    onDelete={(id) => handleDeleteChild(active.id, "assessments", id)}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="History"
                subtitle="Every touchpoint"
                icon={ChevronRight}
                action={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => setAddFollowUpOpen(true)}
                  >
                    <Plus className="h-3 w-3" /> Add task
                  </Button>
                }
              >
                <AppTimeline items={active.history} />
              </SectionCard>
            </div>
          )}
        </section>

        {/* RIGHT SIDEBAR */}
        {rightOpen && (
          <aside className="hidden flex-col gap-4 xl:flex">
            <SectionCard title="Company research" icon={Building2}>
              {active && <CompanyCard app={active} />}
            </SectionCard>

            <SectionCard title="Career progress" icon={Trophy}>
              {stats && (
                <div className="flex items-center justify-around">
                  <StatRing value={stats.interviewRate} label="Interview" tone="primary" />
                  <StatRing value={stats.offerRate} label="Offer" tone="accent" />
                  <StatRing value={stats.acceptanceRate} label="Accept" tone="success" />
                </div>
              )}
            </SectionCard>
          </aside>
        )}
      </div>

      {/* Follow-up section */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Follow-ups"
          subtitle="Pending & completed"
          icon={MessageSquare}
          action={
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => setAddFollowUpOpen(true)}
            >
              <Plus className="h-3 w-3" /> New follow-up
            </Button>
          }
        >
          {allFollowUps.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No follow-ups recorded yet. Add one to stay proactive.
            </p>
          ) : (
            <div className="space-y-2">
              {allFollowUps.map((f) => (
                <FollowUpRow
                  key={f.id}
                  f={f}
                  onToggleComplete={(_id, completed) =>
                    f.applicationId && handleToggleFollowUp(f.applicationId, f.id, completed)
                  }
                  onDelete={() =>
                    f.applicationId && handleDeleteChild(f.applicationId, "follow-ups", f.id)
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Interview center"
          subtitle="Upcoming & scheduled rounds"
          icon={Briefcase}
        >
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Upcoming Rounds
              </div>
              <InterviewRounds
                rounds={applications
                  .flatMap((a) =>
                    a.interviews.map((r) => ({
                      ...r,
                      name: `${a.company} · ${r.name}`,
                      appId: a.id,
                    })),
                  )
                  .filter((r) => r.status === "scheduled")}
                onDelete={(id) => {
                  const target = applications.find((a) => a.interviews.some((iv) => iv.id === id));
                  if (target) handleDeleteChild(target.id, "interviews", id);
                }}
                onPrepare={(id) => {
                  const target = applications.find((a) => a.interviews.some((iv) => iv.id === id));
                  if (target)
                    navigate({
                      to: "/interview-prep",
                      search: { applicationId: target.id, interviewId: id },
                    });
                }}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Add Application Dialog */}
      <AddApplicationDialog
        open={addAppOpen}
        onOpenChange={setAddAppOpen}
        onCreate={async (data) => {
          const res = await createMutation.mutateAsync(data);
          setActiveId(res.id);
          setAddAppOpen(false);
          toast.success("Application created", { description: `${res.role} at ${res.company}` });
        }}
        isSubmitting={createMutation.isPending}
      />

      {/* Add Interview Dialog */}
      {active && (
        <AddChildDialog
          open={addInterviewOpen}
          onOpenChange={setAddInterviewOpen}
          title="Schedule Interview Round"
          description={`Add an interview round for ${active.role} at ${active.company}`}
          fields={[
            {
              id: "name",
              label: "Round Name",
              placeholder: "e.g. Technical Screen, System Design",
              required: true,
            },
            { id: "scheduled_at", label: "Scheduled Date & Time", type: "datetime-local" },
            {
              id: "interviewer",
              label: "Interviewer / Contact",
              placeholder: "e.g. Jane Doe (Tech Lead)",
            },
            {
              id: "notes",
              label: "Preparation Notes",
              placeholder: "Key topics, zoom link, questions",
            },
          ]}
          onSubmit={async (data) => {
            await addChildMutation.mutateAsync({
              applicationId: active.id,
              kind: "interviews",
              data: {
                name: data.name,
                scheduled_at: data.scheduled_at || null,
                interviewer: data.interviewer || null,
                notes: data.notes || null,
                status: "scheduled",
              },
            });
            setAddInterviewOpen(false);
            toast.success("Interview scheduled", { description: data.name });
          }}
          isSubmitting={addChildMutation.isPending}
        />
      )}

      {/* Add Assessment Dialog */}
      {active && (
        <AddChildDialog
          open={addAssessmentOpen}
          onOpenChange={setAddAssessmentOpen}
          title="Add Assessment"
          description={`Track an assessment for ${active.role} at ${active.company}`}
          fields={[
            {
              id: "name",
              label: "Assessment Name",
              placeholder: "e.g. Take-home project, HackerRank",
              required: true,
            },
            { id: "due_at", label: "Due Date & Time", type: "datetime-local" },
            {
              id: "notes",
              label: "Instructions / Link",
              placeholder: "Requirements, submission link",
            },
          ]}
          onSubmit={async (data) => {
            await addChildMutation.mutateAsync({
              applicationId: active.id,
              kind: "assessments",
              data: {
                name: data.name,
                due_at: data.due_at || null,
                notes: data.notes || null,
                status: "pending",
              },
            });
            setAddAssessmentOpen(false);
            toast.success("Assessment added", { description: data.name });
          }}
          isSubmitting={addChildMutation.isPending}
        />
      )}

      {/* Add Follow-Up Dialog */}
      {active && (
        <AddChildDialog
          open={addFollowUpOpen}
          onOpenChange={setAddFollowUpOpen}
          title="Add Follow-up Task"
          description={`Set a reminder for ${active.role} at ${active.company}`}
          fields={[
            {
              id: "title",
              label: "Task Title",
              placeholder: "e.g. Send thank-you note, email recruiter",
              required: true,
            },
            { id: "due_at", label: "Due Date", type: "date" },
            { id: "notes", label: "Details", placeholder: "Specific points to follow up on" },
          ]}
          onSubmit={async (data) => {
            await addChildMutation.mutateAsync({
              applicationId: active.id,
              kind: "follow-ups",
              data: {
                title: data.title,
                due_at: data.due_at || null,
                notes: data.notes || null,
                status: "pending",
              },
            });
            setAddFollowUpOpen(false);
            toast.success("Follow-up task created", { description: data.title });
          }}
          isSubmitting={addChildMutation.isPending}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────── Add Application Dialog Modal

function AddApplicationDialog({
  open,
  onOpenChange,
  onCreate,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    job_title: string;
    company_name: string;
    location?: string;
    salary?: string;
    status?: ApplicationStatus;
    notes?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("applied");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !companyName.trim()) {
      toast.error("Job title and company name are required");
      return;
    }
    await onCreate({
      job_title: jobTitle.trim(),
      company_name: companyName.trim(),
      location: location.trim() || undefined,
      salary: salary.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
    });
    setJobTitle("");
    setCompanyName("");
    setLocation("");
    setSalary("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add New Application</DialogTitle>
            <DialogDescription>
              Track an opportunity directly in Mission Control with real-time lifecycle tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground/90">
                Job Title <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="mt-1 h-9 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/90">
                Company Name <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="mt-1 h-9 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground/90">Location</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote, San Francisco"
                  className="mt-1 h-9 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/90">Salary</label>
                <Input
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. $140,000 - $160,000"
                  className="mt-1 h-9 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/90">Initial Stage</label>
              <Select value={status} onValueChange={(val) => setStatus(val as ApplicationStatus)}>
                <SelectTrigger className="mt-1 h-9 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saved">Saved</SelectItem>
                  <SelectItem value="to_apply">To Apply</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/90">Notes</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Referral contact, application link, notes"
                className="mt-1 h-9 rounded-lg"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-lg text-xs">
              {isSubmitting ? "Creating..." : "Save Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────── Generic Add Child Entity Dialog

function AddChildDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fields: {
    id: string;
    label: string;
    placeholder?: string;
    type?: string;
    required?: boolean;
  }[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const [form, setForm] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
    setForm({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.id}>
                <label className="text-xs font-semibold text-foreground/90">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </label>
                <Input
                  type={f.type || "text"}
                  required={f.required}
                  value={form[f.id] || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.id]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="mt-1 h-9 rounded-lg"
                />
              </div>
            ))}
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-lg text-xs">
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
