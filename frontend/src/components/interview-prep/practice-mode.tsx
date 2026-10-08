import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { categoryLabel, type InterviewPrepQuestion } from "@/types/interview-prep";
import { groundedEvidence } from "@/lib/interview-prep";

interface PracticeModeProps {
  questions: InterviewPrepQuestion[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkPrepared: (question: InterviewPrepQuestion) => void;
}

const SELF_CHECK_ITEMS = [
  "Directly answers what was asked (relevance)",
  "Uses real resume evidence, not invented details",
  "Follows the answer framework structure",
  "States the outcome or learning clearly",
  "Connects back to the job requirement",
] as const;

/**
 * First-version Practice Mode: question → think → reveal talking points.
 * Self-check is a private reflection checklist — it never claims objective
 * interview scoring.
 */
export function PracticeMode({
  questions,
  initialIndex,
  open,
  onOpenChange,
  onMarkPrepared,
}: PracticeModeProps) {
  const [index, setIndex] = useState(initialIndex);
  const [revealed, setRevealed] = useState(false);
  const [notes, setNotes] = useState("");
  const [checked, setChecked] = useState<boolean[]>(() => SELF_CHECK_ITEMS.map(() => false));

  const current = questions[Math.min(index, Math.max(0, questions.length - 1))];

  const openAt = (i: number) => {
    setIndex(i);
    setRevealed(false);
    setNotes("");
    setChecked(SELF_CHECK_ITEMS.map(() => false));
  };

  if (!current) return null;

  const toggleCheck = (i: number) => setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) openAt(initialIndex);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Practice
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              {index + 1} / {questions.length}
            </span>
          </DialogTitle>
          <DialogDescription>
            Think through your answer first, then reveal your talking points to compare.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-surface/40 p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {categoryLabel(current.category)}
            </p>
            <p className="text-sm font-medium leading-snug">{current.question}</p>
          </div>

          <div>
            <label
              htmlFor="practice-notes"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Your answer outline (private — stays in this browser)
            </label>
            <Textarea
              id="practice-notes"
              placeholder="Sketch your Situation → Action → Result before peeking…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {revealed ? (
            <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/[0.05] p-3.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your evidence-anchored talking points
              </h4>
              {current.talking_points.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {current.talking_points.map((t, i) => (
                    <li
                      key={i}
                      className="rounded-full bg-primary/10 px-2.5 py-1 text-xs ring-1 ring-primary/20"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No talking points — this question marks an evidence gap. Frame an honest learning
                  plan instead of bluffing.
                </p>
              )}
              {groundedEvidence(current).length > 0 && (
                <ul className="space-y-1">
                  {groundedEvidence(current).map((e, i) => (
                    <li key={i} className="text-xs text-foreground/80">
                      • “{e}”
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-border/50 pt-2.5">
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Self-check (reflection only — not a score)
                </h4>
                <ul className="space-y-1.5">
                  {SELF_CHECK_ITEMS.map((item, i) => (
                    <li key={item}>
                      <label className="flex cursor-pointer items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={checked[i]}
                          onChange={() => toggleCheck(i)}
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        <span className={checked[i] ? "text-foreground" : "text-muted-foreground"}>
                          {item}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full gap-2" onClick={() => setRevealed(true)}>
              <Eye className="h-4 w-4" /> Reveal talking points
            </Button>
          )}
          {revealed && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => setRevealed(false)}
            >
              <EyeOff className="h-3.5 w-3.5" /> Hide again
            </Button>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={index === 0}
              onClick={() => openAt(index - 1)}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={index >= questions.length - 1}
              onClick={() => openAt(index + 1)}
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={current.is_prepared}
            onClick={() => onMarkPrepared(current)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {current.is_prepared ? "Prepared" : "Mark prepared"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
