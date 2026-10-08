import { useState } from "react";
import {
  MapPin,
  Briefcase,
  Share2,
  Bookmark,
  ExternalLink,
  Building2,
  Sparkles,
  GraduationCap,
  DollarSign,
  Users,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Wand2,
  Clock,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobDescriptionRenderer } from "./job-description-renderer";
import { AIInsights } from "./ai-insights";
import type { Job, JobMatchResponse } from "@/types/jobs";
import { formatSalary, statusMeta, getMatchTier } from "@/lib/jobs";

export function JobDetails({
  job,
  onToggleBookmark,
  onEditResume,
  onTrackApplication,
  isTracked,
  isTracking,
  matchResult,
  isMatching,
  onRunMatch,
}: {
  job: Job;
  onToggleBookmark: () => void;
  onEditResume?: () => void;
  onTrackApplication?: () => void;
  isTracked?: boolean;
  isTracking?: boolean;
  matchResult?: JobMatchResponse;
  isMatching?: boolean;
  onRunMatch?: () => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"brief" | "fit">("brief");
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

  const showRealLogo = Boolean(job.companyLogoUrl) && !logoFailed;
  const status = statusMeta(job.status);
  const provenance = job.sourceProvenance;
  // Backend returns both matchScore (frontend alias) and overall (canonical);
  // read both so a fresh re-analyze result renders instead of falling back.
  const matchScore =
    matchResult?.match.matchScore ??
    matchResult?.match.overall ??
    job.match?.overall ??
    job.aiMatch ??
    0;
  const matchTier = getMatchTier(matchScore);

  const handleShare = () => {
    if (job.applyUrl) {
      navigator.clipboard.writeText(job.applyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background select-text">
      {/* Top Opportunity Header */}
      <div className="sticky top-0 z-10 border-b-2 border-border bg-surface px-5 py-3.5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {/* Company Logo / Avatar */}
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-sm font-bold text-foreground overflow-hidden border-2 border-border bg-surface-elevated"
              aria-hidden
            >
              {showRealLogo ? (
                <img
                  src={job.companyLogoUrl}
                  alt={`${job.company} logo`}
                  className="h-7 w-7 object-contain"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                job.companyLogo
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{job.company}</span>

                {provenance?.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{provenance.label}</span>
                  </span>
                )}

                {job.isVerifiedLive && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success border border-success/40 bg-success/10 px-1.5 py-0.5 rounded-sm font-mono">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified Live on ATS</span>
                  </span>
                )}

                {job.status !== "not_applied" && (
                  <Badge
                    variant="outline"
                    className={`h-5 rounded-sm border-2 px-1.5 text-[10px] font-mono font-bold ${status.tone}`}
                  >
                    {status.label}
                  </Badge>
                )}

                {job.massHiring === "VERIFIED_MASS_HIRING" && job.massHiringStatus !== "EXPIRED" && (
                  <Badge
                    variant="outline"
                    className="h-5 rounded-sm border-2 border-primary bg-primary text-primary-foreground px-2 text-[10px] font-mono font-black uppercase shadow-brutal-xs"
                  >
                    MASS HIRING
                  </Badge>
                )}
              </div>


              <h2 className="mt-0.5 text-base sm:text-lg font-extrabold tracking-tight text-foreground leading-snug break-words">
                {job.role}
              </h2>

              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {job.location}
                </span>
                <span>·</span>
                <span className="font-semibold uppercase tracking-wider text-[11px]">{job.workMode}</span>
                <span>·</span>
                <span className="font-mono text-foreground font-bold">
                  {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                </span>
                {job.massHiringDetails?.vacancy_count && (
                  <>
                    <span>·</span>
                    <span className="font-mono text-primary font-bold">
                      {job.massHiringDetails.vacancy_count}+ openings
                    </span>
                  </>
                )}
                {job.massHiringDetails?.deadline && (
                  <>
                    <span>·</span>
                    <span className="font-mono text-foreground font-semibold">
                      Apply by {job.massHiringDetails.deadline}
                    </span>
                  </>
                )}
                <span>·</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {job.postedAt}
                </span>
              </div>
            </div>
          </div>

          {/* Match Score Badge */}
          {matchScore > 0 && (
            <div className="shrink-0 text-right hidden sm:block">
              <div
                className={`inline-flex items-center gap-1.5 rounded-md border-2 px-2.5 py-1 text-xs font-bold font-mono shadow-brutal-xs ${matchTier.badgeClass}`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{matchScore}% Match</span>
              </div>
              <div className="text-[10px] font-mono uppercase font-semibold text-muted-foreground mt-0.5">
                {matchTier.label}
              </div>
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {(job.preferredApplyUrl || job.applyUrl) ? (
            <Button
              size="sm"
              className="h-9 px-4 rounded-md text-xs font-bold gap-1.5 shadow-brutal-primary bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary"
              onClick={() => {
                window.open((job.preferredApplyUrl || job.applyUrl) as string, "_blank", "noopener,noreferrer");
              }}
            >
              <span>{job.preferredApplyUrl ? "Apply Directly (Preferred)" : "Apply on Site"}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              className="h-9 px-4 rounded-md text-xs font-bold gap-1.5 opacity-60 cursor-not-allowed border-2 border-border"
              disabled
            >
              No direct link
            </Button>
          )}


          {onEditResume && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3.5 rounded-md text-xs font-bold gap-1.5 border-2 border-primary text-primary bg-primary/10 hover:bg-primary/20 shadow-brutal-xs"
              onClick={onEditResume}
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Tailor Resume</span>
            </Button>
          )}

          {onTrackApplication && (
            <Button
              size="sm"
              variant={isTracked ? "secondary" : "outline"}
              className={`h-9 px-3.5 rounded-md text-xs font-bold gap-1.5 border-2 shadow-brutal-xs ${
                isTracked
                  ? "bg-success/15 text-success border-success"
                  : "border-border bg-surface hover:bg-surface-elevated text-foreground"
              }`}
              onClick={onTrackApplication}
              disabled={isTracking || isTracked}
            >
              {isTracked ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  <span>Tracked</span>
                </>
              ) : (
                <>
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>{isTracking ? "Tracking..." : "Track Application"}</span>
                </>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className={`h-9 px-3 rounded-md text-xs font-bold gap-1.5 border-2 shadow-brutal-xs ${
              job.bookmarked
                ? "text-warning bg-warning/10 border-warning"
                : "border-border bg-surface text-foreground hover:bg-surface-elevated"
            }`}
            onClick={onToggleBookmark}
          >
            <Bookmark className="h-3.5 w-3.5" fill={job.bookmarked ? "currentColor" : "none"} />
            <span>{job.bookmarked ? "Saved" : "Save"}</span>
          </Button>

          {job.applyUrl && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-md border-2 border-border text-muted-foreground hover:text-foreground shadow-brutal-xs ml-auto"
              onClick={handleShare}
              title={copied ? "Copied!" : "Copy job link"}
              aria-label="Share opportunity"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Also listed on multi-source links */}
        {job.alsoListedOn && job.alsoListedOn.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted-foreground font-mono">
            <span className="font-semibold text-foreground">Also listed on:</span>
            {job.alsoListedOn.map((item, idx) => (
              <a
                key={idx}
                href={item.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline hover:text-primary transition-colors uppercase"
              >
                {item.source}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ))}
          </div>
        )}

        {/* Tab switcher */}
        <div className="inline-flex items-center rounded-md border-2 border-border bg-background p-0.5 text-xs">

          <button
            type="button"
            onClick={() => setActiveTab("brief")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-sm transition-all ${
              activeTab === "brief"
                ? "bg-surface-elevated text-foreground border border-border shadow-brutal-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Role Brief & Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("fit")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-sm transition-all ${
              activeTab === "fit"
                ? "bg-surface-elevated text-foreground border border-border shadow-brutal-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Fit & Intelligence</span>
            {matchScore > 0 && (
              <span className="rounded-sm px-1.5 py-0.2 text-[10px] font-mono font-bold bg-primary text-primary-foreground">
                {matchScore}%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tabbed Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-5 space-y-4 max-w-4xl">
          {activeTab === "brief" ? (
            <>
              {/* Ghost Risk Banner if present */}
              {job.ghostRisk && (
                <div
                  className={`rounded-lg border-2 p-3.5 space-y-2 text-xs shadow-brutal-xs ${
                    job.ghostRisk.level === "high"
                      ? "border-warning bg-warning/10 text-foreground"
                      : "border-border bg-surface-elevated text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-warning" />
                      Ghost Job Risk Assessment: {job.ghostRisk.level?.toUpperCase()} ({job.ghostRisk.score ?? 0}%)
                    </span>
                  </div>
                  {job.ghostRisk.signals && job.ghostRisk.signals.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-muted-foreground">
                      {job.ghostRisk.signals.map((sig, sIdx) => (
                        <li key={sIdx}>{sig}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Role Overview & Sanitized Description */}
              <section className="space-y-2">

                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Role Overview
                  </h3>
                  {(job.overview?.length ?? 0) > 420 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOverviewExpanded((prev) => !prev)}
                      className="h-6 px-2 text-[11px] font-medium text-primary hover:text-primary/80 gap-1"
                    >
                      <span>{isOverviewExpanded ? "Show less" : "Show more"}</span>
                      {isOverviewExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                <div className="relative rounded-lg border-2 border-border bg-surface p-4 shadow-brutal-xs">
                  <div
                    className={
                      (job.overview?.length ?? 0) > 420 && !isOverviewExpanded
                        ? "max-h-[260px] overflow-hidden relative transition-all duration-200"
                        : "relative transition-all duration-200"
                    }
                  >
                    <JobDescriptionRenderer description={job.overview} />
                    {(job.overview?.length ?? 0) > 420 && !isOverviewExpanded && (
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface via-surface/80 to-transparent pointer-events-none" />
                    )}
                  </div>
                  {(job.overview?.length ?? 0) > 420 && !isOverviewExpanded && (
                    <div className="pt-2 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsOverviewExpanded(true)}
                        className="h-7 text-[11px] font-bold gap-1 rounded-md px-3 border-2 border-border bg-surface shadow-brutal-xs hover:bg-surface-elevated"
                      >
                        <span>Read full job description</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                </div>
              </section>

              {/* Core Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <ParamCard
                  icon={Briefcase}
                  label="Employment"
                  value={job.employmentType || "Full-time"}
                />
                <ParamCard
                  icon={Layers}
                  label="Experience"
                  value={job.experience || "Not specified"}
                />
                <ParamCard
                  icon={GraduationCap}
                  label="Education"
                  value={job.education || "Any background"}
                />
                <ParamCard
                  icon={DollarSign}
                  label="Compensation"
                  value={formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                />
              </div>

              {/* Responsibilities list if structured array is available */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    Key Responsibilities
                  </h3>
                  <div className="rounded-lg border-2 border-border bg-surface p-4 shadow-brutal-xs">
                    <ul className="space-y-2 text-[12.5px] leading-relaxed text-foreground/90">
                      {job.responsibilities.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-sm bg-primary shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* Requirements list if structured array is available */}
              {job.requirements && job.requirements.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    Qualifications & Requirements
                  </h3>
                  <div className="rounded-lg border-2 border-border bg-surface p-4 shadow-brutal-xs">
                    <ul className="space-y-2 text-[12.5px] leading-relaxed text-foreground/90">
                      {job.requirements.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-sm bg-primary shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* Tech Stack Chips */}
              {job.techStack && job.techStack.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Target Technologies
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {job.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-sm border-2 border-border bg-surface-elevated px-2.5 py-1 text-xs font-mono font-bold text-foreground shadow-2xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Recruiter Note if available */}
              {job.recruiterNote && (
                <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 text-xs font-medium italic text-foreground shadow-brutal-xs">
                  &ldquo;{job.recruiterNote}&rdquo;
                </div>
              )}
            </>
          ) : (
            <AIInsights
              job={job}
              matchResult={matchResult}
              isMatching={isMatching}
              onRunMatch={onRunMatch}
              onOptimizeResume={onEditResume}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ParamCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border-2 border-border bg-surface p-3 shadow-brutal-xs">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <div className="mt-1.5 truncate text-xs font-bold text-foreground">{value}</div>
    </div>
  );
}

export function JobDetailsEmpty() {
  return (
    <div className="grid h-full place-items-center p-8 text-center select-none">
      <div className="max-w-[280px] space-y-3">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-surface-elevated text-muted-foreground border-2 border-border shadow-brutal-xs">
          <Briefcase className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">Select an opportunity</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Choose a job from the list to view the full brief, qualifications, and instant resume
            fit analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
