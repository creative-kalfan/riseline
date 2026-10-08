import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  FileText,
  Clock,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useResumes } from "@/hooks/api/useResumes";
import { request } from "@/utils/request";
import { formatDate } from "@/utils/date";
import { API_ENDPOINTS } from "@/constants/api";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/ats-history")({
  head: () => ({
    meta: [
      { title: "ATS History · CareerOS" },
      { name: "description", content: "View your ATS analysis history across all resumes." },
    ],
  }),
  component: ATSHistoryPage,
});

interface ATSReport {
  id: string;
  resume_id: string;
  job_description: string;
  ats_score: number;
  skill_match_score: number;
  keyword_match_score: number;
  semantic_similarity_score: number;
  missing_skills: string[];
  missing_keywords: string[];
  matched_skills: string[];
  matched_keywords: string[];
  recommendations: string[];
  engine_version: string;
  created_at: string;
}

function ATSHistoryPage() {
  const { data: resumesData, isLoading: resumesLoading } = useResumes();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const resumeId = selectedResumeId || resumesData?.resumes?.[0]?.id || null;

  const {
    data: historyData,
    isLoading: historyLoading,
    isError,
  } = useQuery({
    queryKey: ["ats-history", resumeId],
    queryFn: () =>
      request<{ reports: ATSReport[]; total: number; page: number; pageSize: number }>({
        method: "GET",
        path: API_ENDPOINTS.ATS.HISTORY(resumeId!),
      }),
    enabled: !!resumeId,
    staleTime: 30_000,
  });

  const reports = useMemo(() => historyData?.reports || [], [historyData?.reports]);
  const resumes = resumesData?.resumes || [];

  const scoreTrend = useMemo(() => {
    if (reports.length < 2) return null;
    const sorted = [...reports].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const first = sorted[0].ats_score;
    const last = sorted[sorted.length - 1].ats_score;
    const diff = last - first;
    return { first, last, diff, improved: diff > 0 };
  }, [reports]);

  if (resumesLoading) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          eyebrow="Analytics"
          title="ATS History"
          description="Loading your ATS analysis history..."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-20 items-center justify-center gap-4">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold">No resumes yet</h2>
        <p className="text-sm text-muted-foreground">
          Upload a resume to start analyzing your ATS scores.
        </p>
        <Button asChild>
          <Link to="/resumes">Upload Resume</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Analytics"
        title="ATS History"
        description="View your ATS analysis history across all resumes."
      />

      {/* Resume selector */}
      {resumes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {resumes.map((r: any) => (
            <Button
              key={r.id}
              variant={r.id === resumeId ? "default" : "outline"}
              size="sm"
              className={`font-mono text-xs border-2 uppercase tracking-wide transition-all ${
                r.id === resumeId
                  ? "border-primary shadow-brutal-primary"
                  : "border-border/80 shadow-brutal-xs hover:border-primary"
              }`}
              onClick={() => setSelectedResumeId(r.id)}
            >
              {r.title || "Untitled Resume"}
            </Button>
          ))}
        </div>
      )}

      {/* Score trend card */}
      {scoreTrend && (
        <Card className="border-2 border-border shadow-brutal-sm bg-card">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Score Trajectory Telemetry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold tracking-tight text-foreground">{scoreTrend.last}</span>
                <span className="text-xs font-mono text-muted-foreground uppercase">Latest ATS</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 border-2 border-border/60 rounded font-mono text-xs font-bold">
                {scoreTrend.improved ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : scoreTrend.diff === 0 ? (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                )}
                <span
                  className={
                    scoreTrend.improved
                      ? "text-emerald-400"
                      : scoreTrend.diff === 0
                        ? "text-muted-foreground"
                        : "text-rose-400"
                  }
                >
                  {scoreTrend.diff > 0 ? "+" : ""}
                  {scoreTrend.diff} pts
                </span>
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                Base: <span className="font-semibold text-foreground">{scoreTrend.first}</span> over <span className="font-semibold text-foreground">{reports.length}</span> historical runs
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports list */}
      {historyLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg border-2 border-border/40" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 border-2 border-dashed border-rose-500/30 rounded-lg">
          <AlertCircle className="h-12 w-12 text-rose-400" />
          <h2 className="text-lg font-mono font-bold uppercase">Failed to load history</h2>
          <p className="text-xs font-mono text-muted-foreground">
            Could not load ATS history for this resume profile.
          </p>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 border-2 border-dashed border-border/80 rounded-lg">
          <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-lg font-mono font-bold uppercase">No ATS analyses logged</h2>
          <p className="text-xs font-mono text-muted-foreground">
            Run an ATS analysis to generate verification telemetries.
          </p>
          <Button asChild className="border-2 border-primary shadow-brutal-primary font-mono text-xs uppercase tracking-wider">
            <Link to="/resumes">Open Resume Studio</Link>
          </Button>
        </div>
      ) : (
        <ScrollArea className="max-h-[600px] pr-2">
          <div className="flex flex-col gap-3">
            {reports.map((report: ATSReport) => {
              const scoreColor =
                report.ats_score >= 80
                  ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/5"
                  : report.ats_score >= 60
                    ? "text-amber-400 border-amber-500/40 bg-amber-500/5"
                    : "text-rose-400 border-rose-500/40 bg-rose-500/5";
              return (
                <Card key={report.id} className="border-2 border-border/70 hover:border-primary/80 transition-all shadow-brutal-xs hover:shadow-brutal-sm bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`px-2.5 py-0.5 border-2 rounded font-mono text-xl font-bold ${scoreColor}`}>
                            {report.ats_score}%
                          </div>
                          <Badge variant="outline" className="font-mono text-[10px] uppercase border-border/80 tracking-wider">
                            Engine {report.engine_version || "v1"}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                          <div className="p-2 border border-border/50 rounded bg-muted/20">
                            <span className="text-muted-foreground block text-[10px] uppercase">Keyword Match</span>
                            <span className="font-bold text-foreground">{report.keyword_match_score}%</span>
                          </div>
                          <div className="p-2 border border-border/50 rounded bg-muted/20">
                            <span className="text-muted-foreground block text-[10px] uppercase">Skill Match</span>
                            <span className="font-bold text-foreground">{report.skill_match_score}%</span>
                          </div>
                          <div className="p-2 border border-border/50 rounded bg-muted/20">
                            <span className="text-muted-foreground block text-[10px] uppercase">Semantic Similarity</span>
                            <span className="font-bold text-foreground">{report.semantic_similarity_score}%</span>
                          </div>
                        </div>
                        {report.missing_keywords.length > 0 && (
                          <div className="mt-2.5 text-xs">
                            <span className="font-mono text-[11px] font-bold uppercase text-muted-foreground mr-1">
                              Missing Keywords:
                            </span>
                            <span className="font-mono text-[11px] text-rose-400/90">
                              {report.missing_keywords.slice(0, 5).join(", ")}
                              {report.missing_keywords.length > 5 &&
                                ` +${report.missing_keywords.length - 5} more`}
                            </span>
                          </div>
                        )}
                        {report.recommendations.length > 0 && (
                          <div className="mt-1 text-xs">
                            <span className="font-mono text-[11px] font-bold uppercase text-muted-foreground mr-1">
                              Directives:
                            </span>
                            <span className="font-mono text-[11px] text-foreground">
                              {report.recommendations.length} action items identified
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(report.created_at)}
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono border-border/80 max-w-[200px] truncate">
                          {report.job_description?.slice(0, 30)}...
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
