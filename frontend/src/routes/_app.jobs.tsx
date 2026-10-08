import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { slideInRight } from "@/lib/motion";
import { Briefcase, AlertTriangle, WifiOff, Lock, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdditionalFiltersDrawer } from "@/components/jobs/filters-pane";
import { PrimaryFiltersBar } from "@/components/jobs/primary-filters-bar";
import { JobList } from "@/components/jobs/job-list";
import { JobDetails, JobDetailsEmpty } from "@/components/jobs/job-details";
import { JobSearch } from "@/components/jobs/job-search";
import { Button } from "@/components/ui/button";
import { usePersonalizedJobs, jobsQueryKeys } from "@/hooks/api/useJobs";
import { useSavedJobs } from "@/hooks/api/useSavedJobs";
import { jobsApi } from "@/api/jobs";
import { useSaveJob } from "@/hooks/api/useSaveJob";
import { useMatchJobs } from "@/hooks/api/useMatchJobs";
import { useApplyToJob, useApplications } from "@/hooks/api/useApplications";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/api-error";
import { JobResumeDialog } from "@/components/jobs/job-resume-dialog";
import type { Job, JobSearchFilters } from "@/types/jobs";

type JobSearchParams = {
  q?: string;
  location?: string;
  company?: string;
  skills?: string[];
  remote?: boolean;
  employmentType?: string;
  experience?: string;
  sort?: "best-match" | "newest" | "oldest" | "salary";
  page?: number;
  verifiedLiveOnly?: boolean;
};

export const Route = createFileRoute("/_app/jobs")({
  validateSearch: (search: Record<string, unknown>): JobSearchParams => {
    return {
      q: typeof search.q === "string" ? search.q : undefined,
      location: typeof search.location === "string" ? search.location : undefined,
      company: typeof search.company === "string" ? search.company : undefined,
      skills: Array.isArray(search.skills)
        ? (search.skills as string[])
        : typeof search.skills === "string"
          ? (search.skills as string).split(",").filter(Boolean)
          : undefined,
      remote:
        typeof search.remote === "boolean"
          ? search.remote
          : search.remote === "true"
            ? true
            : search.remote === "false"
              ? false
              : undefined,
      employmentType: typeof search.employmentType === "string" ? search.employmentType : undefined,
      experience: typeof search.experience === "string" ? search.experience : undefined,
      sort:
        search.sort === "newest" ||
        search.sort === "oldest" ||
        search.sort === "salary" ||
        search.sort === "best-match"
          ? search.sort
          : undefined,
      page: typeof search.page === "number" ? search.page : Number(search.page) || undefined,
      verifiedLiveOnly:
        typeof search.verifiedLiveOnly === "boolean"
          ? search.verifiedLiveOnly
          : search.verifiedLiveOnly === "true"
            ? true
            : search.verifiedLiveOnly === "false"
              ? false
              : undefined,
    };
  },

  head: () => ({
    meta: [
      { title: "Job Intelligence · CareerOS" },
      {
        name: "description",
        content:
          "Intelligent opportunity workspace: discovery, role briefs, and fit analysis against your candidate profile.",
      },
    ],
  }),
  component: JobsPage,
});

function useMediaQuery(q: string) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(q);
    setM(mql.matches);
    const l = (e: MediaQueryListEvent) => setM(e.matches);
    mql.addEventListener("change", l);
    return () => mql.removeEventListener("change", l);
  }, [q]);
  return m;
}

const PAGE_SIZE = 20;

function JobsPage() {
  const queryClient = useQueryClient();
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const query = searchParams.q ?? "";
  const location = searchParams.location ?? "";
  const company = searchParams.company ?? "";
  const rawSkills = searchParams.skills;
  const skills = useMemo(() => rawSkills ?? [], [rawSkills]);
  const remote = searchParams.remote;
  const employmentType = searchParams.employmentType;
  const experience = searchParams.experience;
  const sort = searchParams.sort ?? "best-match";
  const page = searchParams.page ?? 1;
  const verifiedLiveOnly = searchParams.verifiedLiveOnly;

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileViewingDetail, setMobileViewingDetail] = useState(false);
  const [editResumeJob, setEditResumeJob] = useState<Job | null>(null);

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const updateSearch = (updates: Partial<JobSearchParams>) => {
    setSelectedId(null);
    navigate({
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev, ...updates };
        Object.keys(next).forEach((key) => {
          if (
            next[key] === undefined ||
            next[key] === "" ||
            (Array.isArray(next[key]) && (next[key] as unknown[]).length === 0)
          ) {
            delete next[key];
          }
        });
        return next as JobSearchParams;
      },
      replace: true,
    });
  };

  // Debounced search input handler
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleQueryChange(v: string) {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      updateSearch({ q: v.trim() || undefined, page: 1 });
      setSelectedId(null);
    }, 280);
  }

  function handleWorkModeSelect(mode: "Remote" | "On-site" | "All") {
    if (mode === "Remote") {
      updateSearch({ remote: true, page: 1 });
    } else if (mode === "On-site") {
      updateSearch({ remote: false, page: 1 });
    } else {
      updateSearch({ remote: undefined, page: 1 });
    }
  }

  function handleExperienceSelect(exp: string | undefined) {
    updateSearch({ experience: exp, page: 1 });
  }

  function handleEmploymentTypeSelect(type: string | undefined) {
    updateSearch({ employmentType: type, page: 1 });
  }

  function handleLocationChange(loc: string | undefined) {
    updateSearch({ location: loc, page: 1 });
  }

  function handleDrawerApply(applied: Record<string, string[]>) {
    const nextCompany = applied.company?.[0] || undefined;
    const nextLoc = applied.location?.[0] || undefined;
    const nextSkills = applied.skills && applied.skills.length > 0 ? applied.skills : undefined;
    const nextSort = (applied.sort?.[0] as JobSearchFilters["sort"]) || undefined;

    updateSearch({
      company: nextCompany,
      location: nextLoc || location,
      skills: nextSkills,
      sort: nextSort,
      page: 1,
    });
  }

  function handleResetAll() {
    updateSearch({
      q: undefined,
      company: undefined,
      location: undefined,
      remote: undefined,
      employmentType: undefined,
      experience: undefined,
      skills: undefined,
      sort: undefined,
      page: 1,
    });
    setSelectedId(null);
  }

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const filters: JobSearchFilters = useMemo(
    () => ({
      role: query || undefined,
      location: location || undefined,
      company: company || undefined,
      skills: skills.length > 0 ? skills : undefined,
      remote,
      employmentType,
      experience,
      sort,
      page,
      pageSize: PAGE_SIZE,
      verifiedLiveOnly,
    }),
    [query, location, company, skills, remote, employmentType, experience, sort, page, verifiedLiveOnly],
  );


  const { data, isLoading, isError, error, isFetching, refetch } = usePersonalizedJobs({
    ...filters,
    includeAts: true,
  });

  // Saved jobs are the bookmark source of truth: merge them over the
  // personalized feed so saved state survives pagination, refresh, and
  // navigation. The feed itself never carries bookmark flags.
  const { data: savedJobs = [] } = useSavedJobs();
  const savedIds = useMemo(() => new Set(savedJobs.map((j) => j.id)), [savedJobs]);
  const jobs = useMemo(
    () =>
      (data?.jobs ?? []).map((j) =>
        savedIds.has(j.id) && !j.bookmarked ? { ...j, bookmarked: true, status: "saved" as const } : j,
      ),
    [data?.jobs, savedIds],
  );
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const [pageDirection, setPageDirection] = useState<1 | -1>(1);
  const shouldReduceMotion = useReducedMotion();

  const pageVariants: Variants = {
    enter: (direction: number) =>
      shouldReduceMotion
        ? { opacity: 0 }
        : {
            opacity: 0,
            scale: 0.98,
            rotateY: direction * 4,
            z: -30,
          },
    center: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      z: 0,
      transition: {
        duration: shouldReduceMotion ? 0.15 : 0.28,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
    exit: (direction: number) =>
      shouldReduceMotion
        ? { opacity: 0 }
        : {
            opacity: 0,
            scale: 0.98,
            rotateY: -direction * 4,
            z: -30,
            transition: {
              duration: shouldReduceMotion ? 0.12 : 0.22,
              ease: [0.22, 1, 0.36, 1] as const,
            },
          },
  };

  const handlePrevPage = () => {
    if (page <= 1 || isFetching) return;
    setPageDirection(-1);
    updateSearch({ page: page - 1 });
  };

  const handleNextPage = () => {
    if (page >= totalPages || !data?.hasNext || isFetching) return;
    setPageDirection(1);
    updateSearch({ page: page + 1 });
  };

  // Prefetch next page when available
  useEffect(() => {
    if (!data?.hasNext) return;
    const nextFilters = { ...filters, page: page + 1, includeAts: true };
    queryClient.prefetchQuery({
      queryKey: jobsQueryKeys.personalized(nextFilters),
      queryFn: () => jobsApi.getPersonalizedJobs(nextFilters),
    });
  }, [data?.hasNext, filters, page, queryClient]);

  const selected = useMemo(
    () => jobs.find((j) => j.id === selectedId) ?? jobs[0] ?? null,
    [jobs, selectedId],
  );

  // When jobs change (page switch or filter change), sync selectedId to the valid job on current page
  useEffect(() => {
    if (jobs.length > 0) {
      const existsOnPage = jobs.some((j) => j.id === selectedId);
      if (!existsOnPage) {
        setSelectedId(jobs[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [jobs, selectedId]);

  const { saveJob, unsaveJob } = useSaveJob();
  const { matchJobAsync, isMatching, matchResult, matchError } = useMatchJobs();
  const { data: applications = [] } = useApplications();
  const applyMutation = useApplyToJob();

  // Only show the fresh re-analyze result when it belongs to the currently
  // selected job. The match mutation is global (not per-job), so without this
  // guard a previous job's score would linger on the newly selected job.
  const effectiveMatchResult = useMemo(() => {
    if (!matchResult || !selected) return undefined;
    const resultJob = matchResult.job as unknown as Record<string, unknown>;
    const resultId =
      (resultJob.id as string | undefined) ??
      (resultJob.externalJobId as string | undefined) ??
      (resultJob.external_job_id as string | undefined);
    if (resultId && resultId === selected.id) return matchResult;
    return undefined;
  }, [matchResult, selected]);

  const handleRunMatch = async () => {
    if (!selected || isMatching) return;
    try {
      await matchJobAsync({
        jobId: selected.id,
        job: {
          id: selected.id,
          title: selected.role,
          companyName: selected.company,
          location: selected.location,
          description: selected.overview,
          requirements: selected.requirements,
          responsibilities: selected.responsibilities,
          skills: selected.techStack,
        },
      });
    } catch (err: unknown) {
      toast.error("Re-analyze failed", { description: getErrorMessage(err) });
    }
  };

  useEffect(() => {
    if (matchError) {
      toast.error("Re-analyze failed", { description: getErrorMessage(matchError) });
    }
  }, [matchError]);

  const isTracked = useMemo(() => {
    if (!selected) return false;
    return applications.some(
      (a) =>
        a.id === selected.id ||
        (a.company.toLowerCase() === selected.company.toLowerCase() &&
          a.role.toLowerCase() === selected.role.toLowerCase()),
    );
  }, [applications, selected]);

  const handleTrackApplication = async (jobToTrack: Job) => {
    try {
      await applyMutation.mutateAsync(jobToTrack.id);
      toast.success("Application tracked in Mission Control", {
        description: `${jobToTrack.role} at ${jobToTrack.company}`,
        action: {
          label: "View in Mission Control",
          onClick: () => navigate({ to: "/applications" }),
        },
      });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (
        msg.toLowerCase().includes("already tracked") ||
        (err as { status?: number })?.status === 409
      ) {
        toast.info("This job is already tracked in Mission Control", {
          action: {
            label: "Open Mission Control",
            onClick: () => navigate({ to: "/applications" }),
          },
        });
      } else {
        toast.error("Failed to track application", { description: msg });
      }
    }
  };

  function toggleBookmark(id: string) {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    if (job.bookmarked) unsaveJob(id);
    else saveJob(id);
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    if (!isDesktop) {
      setMobileViewingDetail(true);
    }
  }

  // Keyboard navigation shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (!selected) return;
      const idx = jobs.findIndex((j) => j.id === selected.id);
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const n = jobs[Math.min(jobs.length - 1, idx + 1)];
        if (n) setSelectedId(n.id);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const n = jobs[Math.max(0, idx - 1)];
        if (n) setSelectedId(n.id);
      } else if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleBookmark(selected.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, jobs]);

  // Compute active counts for badges
  const activeAdditionalCount =
    (company.trim() ? 1 : 0) + skills.length + (sort && sort !== "best-match" ? 1 : 0);

  const totalActiveCount =
    activeAdditionalCount +
    (query.trim() ? 1 : 0) +
    (location.trim() ? 1 : 0) +
    (remote !== undefined ? 1 : 0) +
    (experience ? 1 : 0) +
    (employmentType ? 1 : 0);

  const currentWorkMode = remote === true ? "Remote" : remote === false ? "On-site" : "All";

  return (
    <div className="flex h-[calc(100dvh-56px)] flex-col bg-background">
      {/* Top Workspace Bar: Search & Page Identity */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b-2 border-border bg-surface px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 shrink-0 hidden sm:block">
            <h1 className="truncate text-sm font-extrabold tracking-tight text-foreground flex items-center gap-2 uppercase font-mono">
              <Briefcase className="h-4 w-4 text-primary" />
              Job Intelligence
            </h1>
          </div>

          <div className="min-w-0 max-w-lg flex-1">
            <JobSearch value={query} onChange={handleQueryChange} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isFetching && !isLoading && (
            <span
              className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary"
              aria-label="Updating data"
              title="Updating..."
            />
          )}
        </div>
      </div>

      {/* Primary Filters Bar */}
      <PrimaryFiltersBar
        workMode={currentWorkMode}
        experience={experience}
        employmentType={employmentType}
        location={location}
        verifiedLiveOnly={verifiedLiveOnly}
        onWorkModeSelect={handleWorkModeSelect}
        onExperienceSelect={handleExperienceSelect}
        onEmploymentTypeSelect={handleEmploymentTypeSelect}
        onLocationChange={handleLocationChange}
        onToggleVerifiedLive={() => updateSearch({ verifiedLiveOnly: verifiedLiveOnly ? undefined : true, page: 1 })}
        onOpenAdditional={() => setDrawerOpen(true)}
        onResetAll={handleResetAll}
        activeAdditionalCount={activeAdditionalCount}
        totalActiveCount={totalActiveCount}
      />


      {/* Recoverable inline error when query fails but previous jobs exist */}
      {isError && jobs.length > 0 && (
        <div className="border-b-2 border-destructive bg-destructive/10 px-4 py-2 flex items-center justify-between text-xs text-destructive font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Failed to load requested page ({getErrorMessage(error)}). Current opportunities
              preserved.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-6.5 px-2.5 text-[11px] font-bold border-2 border-destructive hover:bg-destructive/15 text-destructive"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      {/* Full-screen error state only if initial query fails completely */}
      {isError && jobs.length === 0 ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        /* Main 2-Zone Workspace */
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Desktop 2-Zone View */}
          {isDesktop ? (
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(380px,430px)_1fr]">
              {/* Left Zone: Opportunities Stream */}
              <div className="min-h-0 border-r-2 border-border flex flex-col bg-background">
                <div className="flex-1 min-h-0 [perspective:1200px]">
                  {/* mode="sync": next page renders immediately; exit plays underneath */}
                  <AnimatePresence mode="sync" custom={pageDirection}>
                    <motion.div
                      key={`desktop-page-${page}`}
                      custom={pageDirection}
                      variants={pageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="h-full flex flex-col [transform-style:preserve-3d] will-change-[transform,opacity]"
                    >
                      <JobList
                        jobs={jobs}
                        selectedId={selected?.id ?? null}
                        onSelect={handleSelect}
                        loading={isLoading}
                        onToggleBookmark={toggleBookmark}
                        query={query}
                        onClearFilters={handleResetAll}
                        page={page}
                        total={total}
                        pageSize={PAGE_SIZE}
                        isFetching={isFetching}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
                {!isLoading && totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                    isFetching={isFetching}
                    hasNext={data?.hasNext}
                    hasPrevious={data?.hasPrevious}
                  />
                )}
              </div>

              {/* Right Zone: Opportunity Intelligence & Brief */}
              <div className="min-h-0 flex-1 flex flex-col bg-background">
                {/* mode="sync": newly selected job renders immediately on select */}
                <AnimatePresence mode="sync">
                  {selected ? (
                    <motion.div
                      key={selected.id}
                      variants={slideInRight}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="h-full"
                    >
                      <JobDetails
                        job={selected}
                        onToggleBookmark={() => toggleBookmark(selected.id)}
                        onEditResume={() => setEditResumeJob(selected)}
                        onTrackApplication={() => handleTrackApplication(selected)}
                        isTracked={isTracked}
                        isTracking={applyMutation.isPending}
                        matchResult={effectiveMatchResult}
                        isMatching={isMatching}
                        onRunMatch={handleRunMatch}
                      />
                    </motion.div>
                  ) : (
                    !isLoading && <JobDetailsEmpty />
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            /* Mobile & Tablet Responsive View */
            <div className="flex min-h-0 flex-1 flex-col">
              {mobileViewingDetail && selected ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  {/* Mobile Back Button */}
                  <div className="border-b border-border/80 bg-surface/80 px-4 py-2 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileViewingDetail(false)}
                      className="h-7.5 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to list
                    </Button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <JobDetails
                      job={selected}
                      onToggleBookmark={() => toggleBookmark(selected.id)}
                      onEditResume={() => setEditResumeJob(selected)}
                      onTrackApplication={() => handleTrackApplication(selected)}
                      isTracked={isTracked}
                      isTracking={applyMutation.isPending}
                      matchResult={effectiveMatchResult}
                      isMatching={isMatching}
                      onRunMatch={handleRunMatch}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex-1 min-h-0 [perspective:1200px]">
                    {/* mode="sync": next page renders immediately; exit plays underneath */}
                    <AnimatePresence mode="sync" custom={pageDirection}>
                      <motion.div
                        key={`mobile-page-${page}`}
                        custom={pageDirection}
                        variants={pageVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="h-full flex flex-col [transform-style:preserve-3d] will-change-[transform,opacity]"
                      >
                        <JobList
                          jobs={jobs}
                          selectedId={selected?.id ?? null}
                          onSelect={handleSelect}
                          loading={isLoading}
                          onToggleBookmark={toggleBookmark}
                          query={query}
                          onClearFilters={handleResetAll}
                          page={page}
                          total={total}
                          pageSize={PAGE_SIZE}
                          isFetching={isFetching}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  {!isLoading && totalPages > 1 && (
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      total={total}
                      onPrev={handlePrevPage}
                      onNext={handleNextPage}
                      isFetching={isFetching}
                      hasNext={data?.hasNext}
                      hasPrevious={data?.hasPrevious}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Additional Filters Drawer */}
      <AdditionalFiltersDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        values={{
          company,
          location,
          skills,
          sort,
        }}
        onApply={handleDrawerApply}
        onReset={handleResetAll}
      />

      {/* Tailor Resume Modal Dialog */}
      {editResumeJob && (
        <JobResumeDialog
          job={editResumeJob}
          open={Boolean(editResumeJob)}
          onOpenChange={(open) => {
            if (!open) setEditResumeJob(null);
          }}
        />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
  isFetching,
  hasNext,
  hasPrevious,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  isFetching?: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
}) {
  const canPrev = (hasPrevious ?? page > 1) && !isFetching;
  const canNext = (hasNext ?? page < totalPages) && !isFetching;

  return (
    <div className="flex items-center justify-between gap-2 border-t-2 border-border px-4 py-2 text-xs text-muted-foreground font-mono bg-surface">
      <span className="truncate font-semibold">
        PAGE {page} OF {totalPages} ({total.toLocaleString()} TOTAL)
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs font-bold border-2 border-border shadow-brutal-xs"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          PREV
        </Button>
        <span className="px-1.5 text-[11px] font-bold text-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs font-bold border-2 border-border shadow-brutal-xs"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next page"
        >
          NEXT
        </Button>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message = getErrorMessage(error);
  const isUnauthorized = message.toLowerCase().includes("unauthorized");
  const isNetwork =
    message.toLowerCase().includes("network") || message.toLowerCase().includes("timeout");

  const Icon = isUnauthorized ? Lock : isNetwork ? WifiOff : AlertTriangle;
  const title = isUnauthorized
    ? "Sign in required"
    : isNetwork
      ? "Connection error"
      : "Could not load opportunities";

  return (
    <div className="grid flex-1 place-items-center p-10 text-center">
      <div className="max-w-[320px] space-y-3">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-destructive/15 text-destructive border-2 border-destructive shadow-brutal-xs">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
        <Button variant="outline" size="sm" className="mt-2 rounded-md text-xs font-bold border-2 border-border shadow-brutal-xs" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}
