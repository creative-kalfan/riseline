import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-tooltip";
import { useResumes } from "@/hooks/api/useResumes";
import { versionsApi } from "@/api/versions";
import { FileText, Loader2 } from "lucide-react";
import { formatDate } from "@/utils/date";
import type { Job } from "@/types/jobs";
import type { ResumeListRecord } from "@/types/resume";

type Step = "jd" | "resume" | "creating";

export function JobResumeDialog({
  job,
  open,
  onOpenChange,
}: {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: resumesData, isLoading: resumesLoading } = useResumes();

  const [step, setStep] = useState<Step>("jd");
  const [jd, setJd] = useState(job.overview || "");
  const [isCreating, setIsCreating] = useState(false);

  const hasStoredJd = Boolean(job.overview?.trim());

  useEffect(() => {
    if (open) {
      setStep("jd");
      setJd(job.overview || "");
      setIsCreating(false);
    }
  }, [open, job.overview]);

  const resumes = resumesData?.resumes ?? [];

  function handleContinueFromJd() {
    if (!jd.trim()) {
      toast.error("Please provide a job description");
      return;
    }
    setStep("resume");
  }

  async function handleCreateVersion(resumeId: string) {
    setIsCreating(true);
    try {
      const result = await versionsApi.create(resumeId, {
        version_name: `${job.role} at ${job.company}`,
        source: "job_specific",
        target_job_id: job.id,
        target_job_title: job.role,
        target_company: job.company,
        target_job_url: job.applyUrl || undefined,
        job_description: jd.trim(),
      });
      onOpenChange(false);
      navigate({
        to: "/resumes/$id",
        params: { id: resumeId },
        search: { versionId: result.version.id },
      });
    } catch {
      toast.error("Failed to create job-specific version");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-2 border-border bg-surface shadow-brutal-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-extrabold uppercase tracking-tight text-sm">
            <FileText className="h-4 w-4 text-primary" />
            Edit Resume for This Job
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tailor your resume for <span className="font-bold text-foreground">{job.role}</span>{" "}
            at <span className="font-bold text-foreground">{job.company}</span>.
          </DialogDescription>
        </DialogHeader>

        {step === "jd" && (
          <div className="space-y-4 pt-1">
            {hasStoredJd ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                    Job Description
                  </span>
                  <Badge variant="secondary" className="rounded-sm text-[10px] font-mono font-bold bg-primary text-primary-foreground border border-primary">
                    Stored
                  </Badge>
                </div>
                <ScrollArea className="max-h-48 rounded-lg border-2 border-border bg-background p-3.5 shadow-brutal-xs">
                  <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-foreground/90">
                    {job.overview}
                  </p>
                </ScrollArea>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Job description unavailable
                </span>
                <p className="text-xs text-muted-foreground">
                  Paste the job description below to tailor your resume.
                </p>
                <Textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="min-h-[160px] resize-y rounded-md border-2 border-border text-xs font-medium"
                />
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t-2 border-border/40">
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 rounded-md text-xs font-semibold border-2 border-border shadow-brutal-xs"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button size="sm" className="h-8.5 rounded-md text-xs font-bold border-2 border-primary bg-primary hover:bg-primary/90 text-primary-foreground shadow-brutal-primary" onClick={handleContinueFromJd}>
                Continue
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "resume" && (
          <div className="space-y-4 pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Select Resume
            </span>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {resumesLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-14 animate-pulse rounded-lg border-2 border-border bg-surface-elevated" />
                    ))}
                  </div>
                ) : resumes.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No resumes found. Upload a resume first.
                  </p>
                ) : (
                  resumes.map((resume: ResumeListRecord) => (
                    <button
                      key={resume.id}
                      onClick={() => handleCreateVersion(resume.id)}
                      disabled={isCreating}
                      className="flex w-full items-center gap-3 rounded-lg border-2 border-border bg-background p-3 text-left transition hover:border-primary hover:bg-surface-elevated hover:shadow-brutal-xs disabled:opacity-60 cursor-pointer"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-border bg-surface text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-foreground">{resume.name}</div>
                        <div className="mt-0.5 text-[10.5px] font-mono text-muted-foreground">
                          Updated {formatDate(resume.updatedAt)}
                        </div>
                      </div>
                      {isCreating && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="pt-2 border-t-2 border-border/40">
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 rounded-md text-xs font-semibold border-2 border-border shadow-brutal-xs"
                onClick={() => setStep("jd")}
                disabled={isCreating}
              >
                Back
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
