import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import {
  interviewPrepQueryKeys,
  useInterviewPrepSession,
  useRegenerateInterviewPrep,
  useUpdatePrepQuestion,
} from "@/hooks/api/useInterviewPrep";
import { useQueryClient } from "@tanstack/react-query";
import { PrepWorkspace } from "@/components/interview-prep/prep-workspace";
import type { InterviewPrepQuestion } from "@/types/interview-prep";

export const Route = createFileRoute("/_app/interview-prep/$sessionId")({
  head: () => ({
    meta: [{ title: "Interview Prep Session · CareerOS" }],
  }),
  component: InterviewPrepSessionPage,
});

function InterviewPrepSessionPage() {
  const { sessionId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: session, isLoading, isError, refetch } = useInterviewPrepSession(sessionId);
  const regenerate = useRegenerateInterviewPrep();
  const updateQuestion = useUpdatePrepQuestion(sessionId);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: interviewPrepQueryKeys.detail(sessionId) });

  const handleTogglePrepared = async (q: InterviewPrepQuestion) => {
    try {
      await updateQuestion.mutateAsync({
        questionId: q.id,
        data: { is_prepared: !q.is_prepared },
      });
    } catch {
      toast.error("Could not update progress");
    }
  };

  const handleToggleBookmark = async (q: InterviewPrepQuestion) => {
    try {
      await updateQuestion.mutateAsync({
        questionId: q.id,
        data: { is_bookmarked: !q.is_bookmarked },
      });
    } catch {
      toast.error("Could not update bookmark");
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerate.mutateAsync(sessionId);
      await invalidate();
      toast.success("Preparation regenerated from current context");
    } catch {
      toast.error("Regeneration failed — please retry");
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        eyebrow="Interview Intelligence"
        title="Preparation workspace"
        actions={
          <Button variant="outline" size="sm" className="gap-1.5 border-2 border-border shadow-brutal-xs font-mono text-xs uppercase" asChild>
            <Link to="/interview-prep">
              <ArrowLeft className="h-3.5 w-3.5" /> All sessions
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-36 rounded-lg border-2 border-border/40" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg border-2 border-border/40" />
          ))}
        </div>
      ) : isError || !session ? (
        <ErrorState
          title="Could not load this preparation session"
          description="It may have been deleted or you may not have access."
          onRetry={() => refetch()}
        />
      ) : session.status === "generating" ? (
        <div className="space-y-2.5">
          <div className="rounded-lg border-2 border-border bg-card p-6 text-center shadow-brutal-xs">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-primary" />
            <p className="mt-2 text-sm font-mono font-bold uppercase tracking-tight">Generating Telemetry & Drills…</p>
            <p className="mt-1 text-xs font-mono text-muted-foreground">
              Grounding questions in your resume and the job description. This updates
              automatically.
            </p>
          </div>
          <Skeleton className="h-28 rounded-lg border-2 border-border/40" />
          <Skeleton className="h-28 rounded-lg border-2 border-border/40" />
        </div>
      ) : session.status === "failed" ? (
        <EmptyState
          title="Preparation could not be generated"
          description={
            session.error ??
            "The AI service was unavailable. No fake questions were created — retry to generate for real."
          }
          action={
            <Button
              size="sm"
              className="gap-1.5 border-2 border-primary shadow-brutal-primary font-mono text-xs uppercase tracking-wider"
              disabled={regenerate.isPending}
              onClick={handleRegenerate}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {regenerate.isPending ? "Retrying…" : "Retry generation"}
            </Button>
          }
        />
      ) : (
        <PrepWorkspace
          session={session}
          onTogglePrepared={handleTogglePrepared}
          onToggleBookmark={handleToggleBookmark}
          onRegenerate={handleRegenerate}
          regenerating={regenerate.isPending}
          updating={updateQuestion.isPending}
        />
      )}
    </motion.div>
  );
}
