import { useMemo, useState } from "react";
import { AlertTriangle, Bookmark, Building2, CalendarClock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  INTERVIEW_PREP_CATEGORIES,
  INTERVIEW_TYPE_LABELS,
  type InterviewPrepCategory,
  type InterviewPrepQuestion,
  type InterviewPrepSession,
} from "@/types/interview-prep";
import {
  computePrepProgress,
  filterQuestions,
  groupQuestionsByCategory,
  progressSummary,
} from "@/lib/interview-prep";
import { QuestionCard } from "./question-card";
import { PracticeMode } from "./practice-mode";

interface PrepWorkspaceProps {
  session: InterviewPrepSession;
  onTogglePrepared: (question: InterviewPrepQuestion) => void;
  onToggleBookmark: (question: InterviewPrepQuestion) => void;
  onRegenerate: () => void;
  regenerating?: boolean;
  updating?: boolean;
}

export function PrepWorkspace({
  session,
  onTogglePrepared,
  onToggleBookmark,
  onRegenerate,
  regenerating,
  updating,
}: PrepWorkspaceProps) {
  const [category, setCategory] = useState<InterviewPrepCategory | "all">("all");
  const [preparedFilter, setPreparedFilter] = useState<"all" | "prepared" | "remaining">("all");
  const [practiceIndex, setPracticeIndex] = useState<number | null>(null);

  const questions = useMemo(() => session.questions ?? [], [session]);
  const progress = useMemo(() => computePrepProgress(session), [session]);
  const filtered = useMemo(
    () => filterQuestions(questions, { category, prepared: preparedFilter }),
    [questions, category, preparedFilter],
  );
  const groups = useMemo(() => groupQuestionsByCategory(filtered), [filtered]);
  const meta = session.source_metadata ?? {};
  const gaps = meta.gaps ?? [];

  const practiceQueue = useMemo(() => {
    const remaining = questions.filter((q) => !q.is_prepared);
    return remaining.length > 0 ? remaining : questions;
  }, [questions]);

  const openPractice = (question: InterviewPrepQuestion) => {
    const idx = practiceQueue.findIndex((q) => q.id === question.id);
    setPracticeIndex(idx >= 0 ? idx : 0);
  };

  const pct = progress.total > 0 ? Math.round((progress.prepared / progress.total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="workstation-panel rounded-xl p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span className="truncate">{meta.company_name ?? "Unknown company"}</span>
              {meta.scheduled_at && (
                <span className="flex items-center gap-1 font-mono">
                  <CalendarClock className="h-3 w-3" />
                  {new Date(meta.scheduled_at).toLocaleString()}
                </span>
              )}
            </div>
            <h2 className="mt-1 truncate text-lg font-semibold tracking-tight">
              {meta.job_title ?? "Interview preparation"}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="rounded-full">
                {INTERVIEW_TYPE_LABELS[session.interview_type] ?? session.interview_type}
              </Badge>
              {session.interview_name && (
                <Badge variant="outline" className="rounded-full">
                  {session.interview_name}
                </Badge>
              )}
              <Badge variant="outline" className="rounded-full font-mono">
                v{session.version}
              </Badge>
              {meta.assumed_type && (
                <Badge
                  variant="outline"
                  className="rounded-full text-warning ring-1 ring-warning/25"
                >
                  Balanced set — round type unknown
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onRegenerate}
            disabled={regenerating}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", regenerating && "animate-spin")} />
            {regenerating ? "Regenerating…" : "Regenerate"}
          </Button>
        </div>

        {/* Transparent progress — counts only, never a fake score */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{progressSummary(progress)}</span>
            <span className="font-mono text-muted-foreground">{pct}% prepared</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        {session.is_stale && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/[0.06] px-3 py-2.5 text-xs">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-warning">This preparation may be stale.</p>
              <p className="text-foreground/80">
                {session.stale_reason ?? "The underlying context changed."} Regenerate to rebuild
                from current context.
              </p>
            </div>
          </div>
        )}

        {meta.assumption_note && (
          <p className="mt-2 text-xs text-muted-foreground">{meta.assumption_note}</p>
        )}
      </header>

      {/* Category filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterPill active={category === "all"} onClick={() => setCategory("all")}>
          All ({questions.length})
        </FilterPill>
        {INTERVIEW_PREP_CATEGORIES.map((c) => {
          const count = questions.filter((q) => q.category === c.id).length;
          if (count === 0) return null;
          return (
            <FilterPill key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
              {c.label} ({count})
            </FilterPill>
          );
        })}
        <span className="mx-1 h-4 w-px bg-border" />
        {(["all", "remaining", "prepared"] as const).map((f) => (
          <FilterPill key={f} active={preparedFilter === f} onClick={() => setPreparedFilter(f)}>
            {f === "all" ? "All states" : f === "remaining" ? "Remaining" : "Prepared"}
          </FilterPill>
        ))}
      </div>

      {/* Gaps ribbon */}
      {gaps.length > 0 && (
        <div className="rounded-xl border border-border/80 bg-surface/40 p-3.5">
          <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Bookmark className="h-3 w-3" /> Known gaps — prepare honest framing
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {gaps.slice(0, 12).map((g, i) => (
              <li
                key={i}
                className="rounded-full bg-warning/10 px-2.5 py-1 text-xs ring-1 ring-warning/25"
              >
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Question groups */}
      {groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 p-6 text-center text-sm text-muted-foreground">
          No questions match this filter.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.category} className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label} · {group.questions.length}
            </h3>
            {group.questions.map((q) => {
              const globalIndex = questions.findIndex((x) => x.id === q.id);
              return (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={globalIndex}
                  onTogglePrepared={onTogglePrepared}
                  onToggleBookmark={onToggleBookmark}
                  onPractice={openPractice}
                  updating={updating}
                />
              );
            })}
          </section>
        ))
      )}

      <PracticeMode
        questions={practiceQueue}
        initialIndex={practiceIndex ?? 0}
        open={practiceIndex !== null}
        onOpenChange={(o) => {
          if (!o) setPracticeIndex(null);
        }}
        onMarkPrepared={onTogglePrepared}
      />
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors",
        active
          ? "bg-primary/15 text-primary ring-primary/30"
          : "bg-surface/40 text-muted-foreground ring-border/60 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
