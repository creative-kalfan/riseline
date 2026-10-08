import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Sparkles, RefreshCw, ThumbsUp, X } from "lucide-react";
import {
  useRecommendations,
  useTopRecommendations,
  useRefreshRecommendations,
  useSaveRecommendation,
  useDismissRecommendation,
} from "@/hooks/api/useRecommendations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";

export const Route = createFileRoute("/_app/recommendations")({
  head: () => ({
    meta: [
      { title: "Recommendations · CareerOS" },
      {
        name: "description",
        content: "Preference-aware matches blending ATS score with your career profile.",
      },
    ],
  }),
  component: RecommendationsPage,
});

function RecommendationsPage() {
  const { data, isLoading, error } = useRecommendations({ limit: 20, sort: "highest-score" });
  const { data: topData } = useTopRecommendations(5);
  const refreshMutation = useRefreshRecommendations();
  const saveMutation = useSaveRecommendation();
  const dismissMutation = useDismissRecommendation();

  const recommendations = data?.data?.recommendations ?? [];
  const topRecommendations = topData?.data?.recommendations ?? [];

  const handleSave = async (id: string) => {
    await saveMutation.mutateAsync(id);
  };

  const handleDismiss = async (id: string) => {
    await dismissMutation.mutateAsync(id);
  };

  const handleRefresh = async () => {
    await refreshMutation.mutateAsync();
  };

  const isSaving = saveMutation.isPending;
  const isDismissing = dismissMutation.isPending;
  const isRefreshing = refreshMutation.isPending;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "excellent":
        return "bg-success/10 text-success border border-success/20";
      case "strong":
        return "bg-primary/10 text-primary border border-primary/20";
      case "good":
        return "bg-warning/10 text-warning border border-warning/20";
      case "possible":
        return "bg-muted text-muted-foreground border border-border/70";
      default:
        return "bg-muted text-muted-foreground border border-border/70";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8 || score >= 80) return "text-success";
    if (score >= 0.6 || score >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="w-full max-w-[1536px] mx-auto flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Recommendations"
        description="Preference-aware matches blending ATS score with your career profile."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg text-xs"
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshMutation.isPending ? "animate-spin" : ""}`}
            />
            {refreshMutation.isPending ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      <div className="space-y-6">
        {error && (
          <Card className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
            <div className="text-center text-destructive">
              <p className="font-medium text-sm">Failed to load recommendations</p>
              <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
            </div>
          </Card>
        )}

        {!error && topRecommendations.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Top Matches</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topRecommendations.map((rec) => (
                <Card
                  key={rec.id}
                  className="glass spatial-card spatial-card-hover flex flex-col justify-between rounded-xl border border-border/80 p-4 shadow-xs bg-surface"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
                          {String(rec.job?.title ?? "Job")}
                        </h3>
                        <p className="truncate text-xs text-muted-foreground mt-0.5">
                          {String(rec.job?.company ?? "")}
                        </p>
                      </div>
                      <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                    </div>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span
                        className={`font-mono text-xl font-bold ${getScoreColor(rec.matchScore)}`}
                      >
                        {Math.round(rec.matchScore <= 1 ? rec.matchScore * 100 : rec.matchScore)}%
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">match</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-border/40 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1 gap-1 rounded-lg text-xs font-semibold hover:border-primary/50 hover:text-primary"
                      onClick={() => handleSave(rec.id)}
                      disabled={saveMutation.isPending}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" /> Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleDismiss(rec.id)}
                      disabled={dismissMutation.isPending}
                    >
                      <X className="h-3.5 w-3.5" /> Dismiss
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!error && (
          <div>
            <h2 className="mb-3 text-sm font-semibold tracking-tight text-foreground">
              All Recommendations
            </h2>
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="rounded-xl border border-border/60 p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="mt-2 h-3.5 w-1/2" />
                    <Skeleton className="mt-4 h-7 w-20" />
                  </Card>
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <Card className="glass spatial-card rounded-xl border border-border/80 bg-surface/40 p-10 text-center shadow-xs">
                <Sparkles className="mx-auto h-8 w-8 text-primary/70 mb-2" />
                <h3 className="mt-1 text-sm font-semibold text-foreground">
                  No recommendations yet
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Complete your profile and upload a resume to receive tailored role
                  recommendations.
                </p>
                <Button
                  size="sm"
                  className="mt-4 rounded-lg text-xs font-semibold"
                  onClick={handleRefresh}
                  disabled={refreshMutation.isPending}
                >
                  {refreshMutation.isPending ? "Generating..." : "Generate Recommendations"}
                </Button>
              </Card>
            ) : (
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {recommendations.map((rec) => (
                  <motion.div key={rec.id} variants={staggerItem}>
                    <Card className="glass spatial-card spatial-card-hover flex flex-col justify-between rounded-xl border border-border/80 p-4 shadow-xs bg-surface">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
                              {String(rec.job?.title ?? "Job")}
                            </h3>
                            <p className="truncate text-xs text-muted-foreground mt-0.5">
                              {String(rec.job?.company ?? "")}
                            </p>
                          </div>
                          <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                        </div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span
                            className={`font-mono text-xl font-bold ${getScoreColor(rec.matchScore)}`}
                          >
                            {Math.round(
                              rec.matchScore <= 1 ? rec.matchScore * 100 : rec.matchScore,
                            )}
                            %
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">match</span>
                        </div>
                        <div className="mt-2 flex gap-3 text-xs text-muted-foreground font-mono">
                          <span>
                            Skills:{" "}
                            {Math.round(
                              rec.skillMatch <= 1 ? rec.skillMatch * 100 : rec.skillMatch,
                            )}
                            %
                          </span>
                          <span>
                            Keywords:{" "}
                            {Math.round(
                              rec.keywordMatch <= 1 ? rec.keywordMatch * 100 : rec.keywordMatch,
                            )}
                            %
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2 border-t border-border/40 pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 flex-1 gap-1 rounded-lg text-xs font-semibold hover:border-primary/50 hover:text-primary"
                          onClick={() => handleSave(rec.id)}
                          disabled={saveMutation.isPending}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" /> Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleDismiss(rec.id)}
                          disabled={dismissMutation.isPending}
                        >
                          <X className="h-3.5 w-3.5" /> Dismiss
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
