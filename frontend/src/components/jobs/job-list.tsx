import { useState } from "react";
import {
  Bookmark,
  MapPin,
  Sparkles,
  Building2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  SearchX,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Job } from "@/types/jobs";
import { formatSalary, getMatchTier } from "@/lib/jobs";

export function JobList({
  jobs,
  selectedId,
  onSelect,
  loading,
  onToggleBookmark,
  query,
  onClearFilters,
  page = 1,
  total,
  pageSize = 20,
  isFetching,
}: {
  jobs: Job[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  onToggleBookmark: (id: string) => void;
  query?: string;
  onClearFilters?: () => void;
  page?: number;
  total?: number;
  pageSize?: number;
  isFetching?: boolean;
}) {
  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = total !== undefined ? Math.min(startIdx + jobs.length - 1, total) : jobs.length;
  const hasRange = total !== undefined && total > jobs.length && jobs.length > 0;

  const countLabel = loading
    ? "Searching opportunities..."
    : isFetching
      ? "Updating..."
      : hasRange
        ? `Showing ${startIdx.toLocaleString()}–${endIdx.toLocaleString()} of ${total.toLocaleString()} opportunities`
        : total !== undefined
          ? `${total.toLocaleString()} ${total === 1 ? "opportunity" : "opportunities"}`
          : `${jobs.length.toLocaleString()} opportunities`;

  return (
    <div className="flex h-full flex-col select-none">
      {/* Header bar: count + status */}
      <div className="flex items-center justify-between gap-2 border-b-2 border-border px-4 py-2.5 bg-surface">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold tracking-tight text-foreground truncate uppercase font-mono">
            {countLabel}
          </span>
          {isFetching && !loading && (
            <span
              className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary"
              aria-label="Updating page"
            />
          )}
          {query && (
            <span className="text-[11px] text-muted-foreground truncate max-w-[130px] font-mono">
              for &ldquo;{query}&rdquo;
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono uppercase font-semibold text-muted-foreground shrink-0 tracking-wider">
          Ranked by match
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2.5">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border-2 border-border bg-surface p-3"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 rounded-md shrink-0 border border-border" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-sm" />
                    <Skeleton className="h-3 w-1/2 rounded-sm" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-3.5 w-16 rounded-sm" />
                      <Skeleton className="h-3.5 w-20 rounded-sm" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {!loading &&
            jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                selected={job.id === selectedId}
                onSelect={() => onSelect(job.id)}
                onToggleBookmark={() => onToggleBookmark(job.id)}
              />
            ))}

          {!loading && jobs.length === 0 && (
            <div className="grid place-items-center rounded-lg border-2 border-dashed border-border bg-surface p-8 text-center my-6 shadow-brutal-sm">
              <div className="max-w-[260px] space-y-3">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-surface-elevated border-2 border-border text-muted-foreground">
                  <SearchX className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground uppercase tracking-tight">
                    No matching opportunities
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Try adjusting search keywords or clearing additional filters.
                  </p>
                </div>
                {onClearFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearFilters}
                    className="h-8 rounded-md text-xs font-semibold border-2 border-border shadow-brutal-xs"
                  >
                    Reset filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function JobCard({
  job,
  selected,
  onSelect,
  onToggleBookmark,
}: {
  job: Job;
  selected: boolean;
  onSelect: () => void;
  onToggleBookmark: () => void;
}) {
  const matchScore = job.match?.overall ?? job.aiMatch;
  const matchTier = getMatchTier(matchScore);
  const [logoFailed, setLogoFailed] = useState(false);
  const showRealLogo = Boolean(job.companyLogoUrl) && !logoFailed;
  const provenance = job.sourceProvenance;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={selected}
      className={`group relative block w-full cursor-pointer rounded-lg border-2 p-3 text-left transition-all duration-150 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        selected
          ? "border-primary bg-surface-elevated shadow-brutal-xs"
          : "border-border bg-surface hover:border-border hover:bg-surface-elevated/70 hover:shadow-brutal-xs hover:translate-x-0.5"
      }`}
    >
      {/* Active selection vertical indicator */}
      {selected && (
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-xs bg-primary" />
      )}

      <div className="flex items-start gap-3">
        {/* Company Logo / Avatar */}
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-xs font-bold text-foreground overflow-hidden border-2 border-border bg-surface-elevated"
          aria-hidden
        >
          {showRealLogo ? (
            <img
              src={job.companyLogoUrl}
              alt={`${job.company} logo`}
              className="h-6 w-6 object-contain"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            job.companyLogo
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Header row: Company name + Provenance + Bookmark */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">
                {job.company}
              </span>
              {provenance?.verified && (
                <span
                  title={provenance.label}
                  className="inline-flex items-center text-[10px] text-success shrink-0"
                >
                  <ShieldCheck className="h-3 w-3" />
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark();
              }}
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-md transition-colors ${
                job.bookmarked
                  ? "text-warning hover:text-warning"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
              }`}
              aria-label={job.bookmarked ? "Unsave job" : "Save job"}
            >
              <Bookmark className="h-3.5 w-3.5" fill={job.bookmarked ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Job Title */}
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            {job.massHiring === "VERIFIED_MASS_HIRING" && job.massHiringStatus !== "EXPIRED" && (
              <span className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[9.5px] font-black tracking-wider uppercase border-2 border-primary bg-primary text-primary-foreground shadow-brutal-xs">
                MASS HIRING
              </span>
            )}
            {job.isVerifiedLive && (

              <span
                title="Verified live on ATS"
                className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase border border-success/40 bg-success/10 text-success"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                Live
              </span>
            )}
            {job.ghostRisk && job.ghostRisk.level === "high" && (
              <span
                title={job.ghostRisk.signals?.join(", ") || "Stale or reposted posting risk"}
                className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase border border-warning/40 bg-warning/10 text-warning"
              >
                High Ghost Risk
              </span>
            )}
            <h3 className="line-clamp-2 break-words text-[13.5px] font-bold tracking-tight text-foreground leading-snug">
              {job.role}
            </h3>
          </div>


          {/* Metadata badges row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium">
              <MapPin className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate max-w-[120px]">{job.location}</span>
            </span>
            <span>·</span>
            <span className="font-mono text-[10.5px] font-semibold text-foreground">
              {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
            </span>
            {job.massHiringDetails?.vacancy_count && (
              <>
                <span>·</span>
                <span className="font-mono text-[10.5px] font-bold text-primary">
                  {job.massHiringDetails.vacancy_count}+ openings
                </span>
              </>
            )}
          </div>

          {/* Bottom tag bar: Match score + Work mode + Freshness */}
          <div className="mt-2.5 flex items-center justify-between gap-1 pt-1.5 border-t-2 border-border/40 text-[10.5px]">
            <div className="flex items-center gap-1.5">
              {matchScore > 0 && (
                <span
                  className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10.5px] font-bold border-2 ${matchTier.badgeClass}`}
                >
                  {matchScore}% match
                </span>
              )}
              <span className="rounded-sm px-1.5 py-0.5 bg-surface-elevated border border-border text-foreground font-mono text-[10px] uppercase font-semibold">
                {job.workMode}
              </span>
            </div>

            <span className="text-[10px] text-muted-foreground font-mono font-medium">{job.postedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
