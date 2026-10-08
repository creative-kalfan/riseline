import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { ArrowRight, Building2, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useGenerateInterviewPrep, useInterviewPrepSessions } from "@/hooks/api/useInterviewPrep";
import { useApplications } from "@/hooks/api/useApplications";
import { INTERVIEW_TYPE_LABELS } from "@/types/interview-prep";
import { PracticeGauntlet } from "@/components/interview-prep/practice-gauntlet";

export interface InterviewPrepSearchParams {
  applicationId?: string;
  interviewId?: string;
}

export const Route = createFileRoute("/_app/interview-prep")({
  validateSearch: (search: Record<string, unknown>): InterviewPrepSearchParams => ({
    applicationId: typeof search.applicationId === "string" ? search.applicationId : undefined,
    interviewId: typeof search.interviewId === "string" ? search.interviewId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Interview Prep · CareerOS" },
      {
        name: "description",
        content:
          "Role-specific interview preparation grounded in your resume and the job description.",
      },
    ],
  }),
  component: InterviewPrepListPage,
});

function InterviewPrepListPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);

  const { data, isLoading, isError, refetch } = useInterviewPrepSessions(search.applicationId);
  const { data: applications } = useApplications();
  const generate = useGenerateInterviewPrep();

  const sessions = data?.sessions ?? [];
  const contextApp = (applications ?? []).find((a) => a.id === search.applicationId);

  const handleGenerate = async (applicationId: string, interviewId?: string) => {
    setGenerating(true);
    try {
      const session = await generate.mutateAsync({
        application_id: applicationId,
        interview_id: interviewId,
      });
      toast.success("Preparation generated");
      navigate({ to: "/interview-prep/$sessionId", params: { sessionId: session.id } });
    } catch {
      toast.error("Generation failed — please retry");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        eyebrow="Interview Intelligence"
        title="Interview Prep — Practice Gauntlet"
        description="Role-specific drills grounded in your resume, with instant STAR coaching on every response."
        actions={
          contextApp && (
            <Button
              size="sm"
              className="gap-1.5"
              disabled={generating}
              onClick={() => handleGenerate(contextApp.id, search.interviewId)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? "Generating…" : "Generate preparation"}
            </Button>
          )
        }
      />

      {contextApp && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-border bg-card p-3.5 text-sm shadow-brutal-xs">
          <Building2 className="h-4 w-4 shrink-0 text-primary" />
          <p className="min-w-0 grow truncate text-xs sm:text-sm">
            Target Context: <span className="font-semibold tracking-tight">{contextApp.role}</span>
            <span className="font-mono text-muted-foreground"> @{contextApp.company}</span>
          </p>
          <Link
            to="/applications"
            className="shrink-0 font-mono text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            ← Mission Control
          </Link>
        </div>
      )}

      <PracticeGauntlet />

      {isLoading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg border-2 border-border/40" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load preparation sessions"
          description="Something went wrong fetching your interview prep."
          onRetry={() => refetch()}
        />
      ) : sessions.length === 0 ? (
        <EmptyState
          title="No preparation generated yet"
          description={
            search.applicationId
              ? "Generate your first preparation set for this interview — grounded in your resume and the job description."
              : "Open an application interview in Mission Control and choose “Prepare for Interview”."
          }
          action={
            search.applicationId ? (
              <Button
                size="sm"
                className="gap-1.5 border-2 border-primary shadow-brutal-primary font-mono text-xs uppercase tracking-wider"
                disabled={generating}
                onClick={() => handleGenerate(search.applicationId as string, search.interviewId)}
              >
                <Plus className="h-3.5 w-3.5" />
                {generating ? "Generating…" : "Generate preparation"}
              </Button>
            ) : (
              <Button size="sm" asChild className="border-2 border-primary shadow-brutal-primary font-mono text-xs uppercase tracking-wider">
                <Link to="/applications">Open Mission Control</Link>
              </Button>
            )
          }
        />
      ) : (
        <motion.ul variants={staggerItem} className="space-y-2.5">
          {sessions.map((s) => {
            const meta = s.source_metadata ?? {};
            return (
              <li key={s.id}>
                <Link
                  to="/interview-prep/$sessionId"
                  params={{ sessionId: s.id }}
                  className="group flex items-center gap-3 rounded-lg border-2 border-border/80 bg-card p-4 shadow-brutal-xs transition-all hover:border-primary/80 hover:shadow-brutal-sm"
                >
                  <div className="min-w-0 grow">
                    <p className="truncate text-sm font-semibold tracking-tight">
                      {meta.job_title ?? "Interview preparation"}
                      {meta.company_name ? (
                        <span className="font-mono text-xs text-muted-foreground font-normal"> · {meta.company_name}</span>
                      ) : null}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="rounded border border-border font-mono text-[10px] uppercase">
                        {INTERVIEW_TYPE_LABELS[s.interview_type] ?? s.interview_type}
                      </Badge>
                      <Badge variant="outline" className="rounded border border-border/80 font-mono text-[10px]">
                        {s.status === "ready"
                          ? `${s.question_count} questions · ${s.prepared_count} prepared`
                          : s.status === "generating"
                            ? "Generating…"
                            : "Failed — retry available"}
                      </Badge>
                      <Badge variant="outline" className="rounded border border-border/80 font-mono text-[10px] text-primary">
                        v{s.version}
                      </Badge>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </li>
            );
          })}
        </motion.ul>
      )}
    </motion.div>
  );
}
