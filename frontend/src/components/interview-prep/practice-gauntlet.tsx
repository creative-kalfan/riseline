import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Dumbbell,
  Loader2,
  MinusCircle,
  Sparkles,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-tooltip";
import { getErrorMessage } from "@/utils/api-error";
import { useResumes } from "@/hooks/api/useResumes";
import { useCritiqueResponse, useGenerateDrills } from "@/hooks/api/useInterviewPrep";
import {
  DRILL_TYPE_LABELS,
  SENIORITY_OPTIONS,
  categoryLabel,
  type CritiqueResponseResult,
  type DrillQuestion,
  type DrillType,
  type StarCoverage,
} from "@/types/interview-prep";

const DRILL_TONE: Record<DrillType, string> = {
  technical_screen: "text-primary bg-primary/10 ring-primary/20",
  behavioral_star: "text-accent bg-accent/10 ring-accent/25",
  live_scenario: "text-warning bg-warning/10 ring-warning/25",
};

const COVERAGE_META: Record<StarCoverage, { label: string; className: string }> = {
  present: {
    label: "Present",
    className: "border-success/40 bg-success/10 text-success",
  },
  partial: {
    label: "Partial",
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  missing: {
    label: "Missing",
    className: "border-border/60 bg-muted/40 text-muted-foreground",
  },
};

function CoverageIcon({ coverage }: { coverage: StarCoverage }) {
  if (coverage === "present") return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  if (coverage === "partial") return <MinusCircle className="h-3.5 w-3.5 text-warning" />;
  return <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" />;
}

function DrillCritique({ critique }: { critique: CritiqueResponseResult }) {
  return (
    <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/[0.04] p-3.5">
      <h5 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3 w-3 text-primary" />
        Instant AI critique — STAR coaching, not a hiring score
      </h5>
      <div className="grid gap-2 sm:grid-cols-2">
        {critique.dimensions.map((d) => {
          const meta = COVERAGE_META[d.coverage];
          return (
            <div
              key={d.dimension}
              className="space-y-1.5 rounded-lg border border-border/60 bg-background/70 p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <CoverageIcon coverage={d.coverage} />
                  {d.dimension}
                </span>
                <Badge variant="outline" className={cn("rounded-full text-[10px]", meta.className)}>
                  {meta.label}
                </Badge>
              </div>
              {d.feedback && <p className="text-xs text-foreground/85">{d.feedback}</p>}
              {d.evidence_quote && (
                <p className="rounded-md bg-muted/50 px-2 py-1 text-[11px] italic text-muted-foreground">
                  “{d.evidence_quote}”
                </p>
              )}
              {d.suggestion && (
                <p className="text-[11px] text-foreground/80">
                  <span className="font-medium text-primary">Try: </span>
                  {d.suggestion}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {critique.strengths.length > 0 && (
        <div className="space-y-1">
          <h6 className="text-[11px] font-semibold uppercase tracking-wider text-success">
            What is working
          </h6>
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-foreground/85">
            {critique.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {critique.improvements.length > 0 && (
        <div className="space-y-1">
          <h6 className="text-[11px] font-semibold uppercase tracking-wider text-warning">
            Highest-leverage fixes
          </h6>
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-foreground/85">
            {critique.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {critique.honest_note && (
        <p className="rounded-lg border border-border/60 bg-surface/60 px-2.5 py-2 text-[11px] text-muted-foreground">
          {critique.honest_note}
        </p>
      )}
    </div>
  );
}

function DrillCard({
  drill,
  index,
  targetRole,
  defaultJobDescription,
}: {
  drill: DrillQuestion;
  index: number;
  targetRole: string;
  defaultJobDescription: string;
}) {
  const [response, setResponse] = useState("");
  const [critique, setCritique] = useState<CritiqueResponseResult | null>(null);
  const critiqueMutation = useCritiqueResponse();
  const { toast } = useToast();

  const canCritique = response.trim().length >= 10 && !critiqueMutation.isPending;

  const handleCritique = async () => {
    if (!canCritique) return;
    setCritique(null);
    try {
      const result = await critiqueMutation.mutateAsync({
        question: drill.question,
        category: drill.category,
        response_text: response.trim(),
        target_role: targetRole || undefined,
        job_description: defaultJobDescription || undefined,
      });
      setCritique(result);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <article className="glass space-y-3 rounded-xl border border-border/80 p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-elevated font-mono text-xs font-semibold ring-1 ring-border/80">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 grow">
          <h4 className="text-sm font-medium leading-snug">{drill.question}</h4>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn("rounded-full text-[11px] ring-1", DRILL_TONE[drill.drill_type])}
            >
              {DRILL_TYPE_LABELS[drill.drill_type]}
            </Badge>
            <Badge variant="secondary" className="rounded-full text-[11px]">
              {categoryLabel(drill.category)}
            </Badge>
            <Badge variant="outline" className="rounded-full text-[11px] capitalize">
              {drill.difficulty}
            </Badge>
          </div>
        </div>
      </div>

      {drill.rationale && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Why this drill: </span>
          {drill.rationale}
        </p>
      )}

      {drill.talking_points.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {drill.talking_points.slice(0, 6).map((t, i) => (
            <li
              key={i}
              className="rounded-full bg-primary/10 px-2.5 py-1 text-xs ring-1 ring-primary/20"
            >
              {t}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`drill-response-${index}`} className="text-xs font-medium">
          Your response {drill.drill_type === "behavioral_star" ? "(aim for STAR: Situation → Task → Action → Result)" : ""}
        </Label>
        <Textarea
          id={`drill-response-${index}`}
          placeholder={
            drill.drill_type === "behavioral_star"
              ? "Situation: … Task: … Action: … Result: …"
              : "Type your practice response here…"
          }
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={4}
        />
      </div>

      {critiqueMutation.isError && !critique && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
          <span className="text-muted-foreground">
            {getErrorMessage(critiqueMutation.error)}
          </span>
        </div>
      )}

      {critique && <DrillCritique critique={critique} />}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          disabled={!canCritique}
          onClick={handleCritique}
        >
          {critiqueMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {critiqueMutation.isPending ? "Critiquing…" : critique ? "Re-critique" : "Get STAR critique"}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          Qualitative coaching only — never a hiring score.
        </span>
      </div>
    </article>
  );
}

/**
 * Practice Gauntlet: role-first mock interview drills with STAR coaching.
 * Stateless — needs no application. Drills are grounded in the selected
 * resume + optional JD; critique judges only the typed response.
 */
export function PracticeGauntlet() {
  const [targetRole, setTargetRole] = useState("");
  const [seniority, setSeniority] = useState<string>("mid");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeId, setResumeId] = useState<string>("auto");
  const { toast } = useToast();

  const { data: resumesData } = useResumes();
  const resumes = useMemo(() => resumesData?.resumes ?? [], [resumesData]);
  const drillsMutation = useGenerateDrills();
  const drills = drillsMutation.data?.drills ?? [];

  const grouped = useMemo(() => {
    const order: DrillType[] = ["technical_screen", "behavioral_star", "live_scenario"];
    return order
      .map((type) => ({
        type,
        label: DRILL_TYPE_LABELS[type],
        questions: drills.filter((d) => d.drill_type === type),
      }))
      .filter((g) => g.questions.length > 0);
  }, [drills]);

  const handleGenerate = async () => {
    if (targetRole.trim().length < 2) {
      toast.error("Enter a target role (e.g. Backend Engineer)");
      return;
    }
    try {
      await drillsMutation.mutateAsync({
        target_role: targetRole.trim(),
        seniority,
        job_description: jobDescription.trim() || undefined,
        resume_id: resumeId === "auto" ? undefined : resumeId,
        question_count: 6,
      });
      toast.success("Practice drills generated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <section className="workstation-panel space-y-4 rounded-xl border border-border/80 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
          <Swords className="h-4 w-4" />
        </div>
        <div className="min-w-0 grow">
          <h2 className="text-sm font-semibold tracking-tight">Practice Gauntlet</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Role-specific mock drills — technical screen, STAR behavioral, and live
            scenario — grounded in your resume. Type a response to get instant STAR coaching.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 rounded-full font-mono text-[11px]">
          <Dumbbell className="mr-1 h-3 w-3" /> Drills
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_160px]">
        <div className="space-y-1.5">
          <Label htmlFor="gauntlet-role" className="text-xs font-medium">
            Target role
          </Label>
          <Input
            id="gauntlet-role"
            placeholder="e.g. Backend Engineer, Product Designer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Seniority</Label>
          <Select value={seniority} onValueChange={setSeniority}>
            <SelectTrigger>
              <SelectValue placeholder="Seniority" />
            </SelectTrigger>
            <SelectContent>
              {SENIORITY_OPTIONS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="gauntlet-jd" className="text-xs font-medium">
            Job description <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="gauntlet-jd"
            placeholder="Paste a JD excerpt to ground drills in real requirements…"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Resume context</Label>
          <Select value={resumeId} onValueChange={setResumeId}>
            <SelectTrigger>
              <SelectValue placeholder="Resume" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto — most recent parsed resume</SelectItem>
              {resumes.map((r: { id: string; name?: string; role?: string }) => (
                <SelectItem key={r.id} value={r.id}>
                  {((r.name || r.role || "Untitled resume") as string).slice(0, 40)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Drills reuse your verified resume evidence. Missing JD skills surface as
            honest gaps — never as fake experience.
          </p>
          <Button
            size="sm"
            className="mt-1 gap-1.5"
            disabled={drillsMutation.isPending}
            onClick={handleGenerate}
          >
            {drillsMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Swords className="h-3.5 w-3.5" />
            )}
            {drillsMutation.isPending ? "Generating drills…" : "Generate drills"}
          </Button>
        </div>
      </div>

      {drillsMutation.isError && (
        <Card className="border-rose-500/30 bg-rose-500/5 p-3">
          <div className="flex items-start gap-2 text-xs">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <span className="text-muted-foreground">
              {getErrorMessage(drillsMutation.error)}
            </span>
          </div>
        </Card>
      )}

      {drillsMutation.isPending && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      )}

      {drills.length > 0 && (
        <div className="space-y-5">
          {drillsMutation.data?.assumption_note && (
            <p className="text-xs text-muted-foreground">{drillsMutation.data.assumption_note}</p>
          )}
          {grouped.map((group) => (
            <div key={group.type} className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label} · {group.questions.length}
              </h3>
              {group.questions.map((drill, i) => (
                <DrillCard
                  key={`${group.type}-${i}-${drill.question.slice(0, 24)}`}
                  drill={drill}
                  index={drills.indexOf(drill)}
                  targetRole={targetRole.trim()}
                  defaultJobDescription={jobDescription.trim()}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
