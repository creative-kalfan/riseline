import { useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronDown,
  Circle,
  Dumbbell,
  FlaskConical,
  ListChecks,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryLabel, type InterviewPrepQuestion } from "@/types/interview-prep";
import { groundedEvidence, hasEvidenceGap } from "@/lib/interview-prep";

const difficultyTone: Record<string, string> = {
  foundational: "text-success bg-success/10 ring-success/20",
  intermediate: "text-primary bg-primary/10 ring-primary/20",
  advanced: "text-warning bg-warning/10 ring-warning/25",
};

interface QuestionCardProps {
  question: InterviewPrepQuestion;
  index: number;
  onTogglePrepared: (question: InterviewPrepQuestion) => void;
  onToggleBookmark: (question: InterviewPrepQuestion) => void;
  onPractice: (question: InterviewPrepQuestion) => void;
  updating?: boolean;
}

export function QuestionCard({
  question,
  index,
  onTogglePrepared,
  onToggleBookmark,
  onPractice,
  updating,
}: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const gap = hasEvidenceGap(question);
  const evidence = groundedEvidence(question);
  const framework = question.answer_framework;

  return (
    <article
      className={cn(
        "glass group relative flex w-full flex-col gap-3 rounded-xl border border-border/80 p-4 text-left shadow-xs transition-colors",
        question.is_prepared && "border-success/40 bg-success/[0.04]",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-elevated font-mono text-xs font-semibold ring-1 ring-border/80">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 grow">
          <h4 className="text-sm font-medium leading-snug">{question.question}</h4>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="rounded-full text-[11px]">
              {categoryLabel(question.category)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "rounded-full text-[11px] capitalize ring-1",
                difficultyTone[question.difficulty],
              )}
            >
              {question.difficulty}
            </Badge>
            {gap && (
              <Badge
                variant="outline"
                className="rounded-full text-[11px] text-warning ring-1 ring-warning/25"
              >
                Evidence gap noted
              </Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={question.is_bookmarked ? "Remove bookmark" : "Bookmark"}
            onClick={() => onToggleBookmark(question)}
            disabled={updating}
          >
            {question.is_bookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-warning" />
            ) : (
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={question.is_prepared ? "Mark as remaining" : "Mark prepared"}
            onClick={() => onTogglePrepared(question)}
            disabled={updating}
          >
            {question.is_prepared ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {question.rationale && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80" />
          <span>
            <span className="font-medium text-foreground/80">Why this matters: </span>
            {question.rationale}
          </span>
        </p>
      )}

      {expanded && (
        <div className="space-y-3 border-t border-border/50 pt-3">
          {evidence.length > 0 && (
            <section>
              <h5 className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <FlaskConical className="h-3 w-3" /> Resume evidence
              </h5>
              <ul className="space-y-1">
                {evidence.map((e, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-surface/60 px-2.5 py-1.5 text-xs ring-1 ring-border/60"
                  >
                    “{e}”
                  </li>
                ))}
              </ul>
            </section>
          )}

          {question.talking_points.length > 0 && (
            <section>
              <h5 className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <ListChecks className="h-3 w-3" /> Talking points
              </h5>
              <ul className="flex flex-wrap gap-1.5">
                {question.talking_points.map((t, i) => (
                  <li
                    key={i}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-foreground ring-1 ring-primary/20"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(question.gaps ?? []).length > 0 && (
            <section className="rounded-lg border border-warning/25 bg-warning/[0.06] px-2.5 py-2">
              <h5 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-warning">
                Gaps — not claimed as experience
              </h5>
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-foreground/80">
                {(question.gaps ?? []).map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </section>
          )}

          {framework?.steps?.length > 0 && (
            <section>
              <h5 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Answer framework · {framework.type}
              </h5>
              <ol className="flex flex-wrap items-center gap-1 text-xs">
                {framework.steps.map((step, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="rounded-md bg-surface-elevated px-2 py-1 font-mono ring-1 ring-border/60">
                      {i + 1}. {step}
                    </span>
                    {i < framework.steps.length - 1 && (
                      <span className="text-muted-foreground">→</span>
                    )}
                  </li>
                ))}
              </ol>
              {framework.guidance && (
                <p className="mt-1.5 text-xs text-muted-foreground">{framework.guidance}</p>
              )}
              {question.star_guidance && (
                <p className="mt-1 text-xs text-muted-foreground">{question.star_guidance}</p>
              )}
            </section>
          )}

          {(question.related_jd_requirements ?? []).length > 0 && (
            <section>
              <h5 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Maps to JD
              </h5>
              <ul className="space-y-0.5">
                {(question.related_jd_requirements ?? []).map((r, i) => (
                  <li key={i} className="text-xs text-foreground/80">
                    • {r}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(question.expected_signals ?? []).length > 0 && (
            <section>
              <h5 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                What a strong answer shows
              </h5>
              <ul className="space-y-0.5">
                {(question.expected_signals ?? []).map((s, i) => (
                  <li key={i} className="text-xs text-foreground/80">
                    • {s}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
          />
          {expanded ? "Show less" : "Show preparation"}
        </Button>
        <span className="grow" />
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => onPractice(question)}
        >
          <Dumbbell className="h-3.5 w-3.5" />
          Practice
        </Button>
      </div>
    </article>
  );
}
