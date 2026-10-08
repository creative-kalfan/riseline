import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { ResumeUpload } from "@/components/resume/resume-upload";
import { ResumeSetupChoices } from "@/components/resume/resume-setup-choices";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Target } from "lucide-react";
import { ResumeQuestionnaire } from "@/components/resume/resume-questionnaire";
import { ResumeReview } from "@/components/resume/resume-review";

type SetupPageSearch = {
  mode?: string;
  resumeId?: string;
  jobTitle?: string;
  company?: string;
  jobDescription?: string;
};

export const Route = createFileRoute("/_app/resumes/setup")({
  head: () => ({
    meta: [
      { title: "Resume Setup · CareerOS" },
      {
        name: "description",
        content: "Set up your resume profile to get started with AI-powered job matching.",
      },
    ],
  }),
  component: ResumeSetupPage,
});

function ResumeSetupPage() {
  const navigate = useNavigate();
  const searchResult = useSearch({ from: "/_app/resumes/setup" });
  const search = searchResult as unknown as SetupPageSearch;
  const mode = search.mode;
  const resumeId = search.resumeId;

  // Active, mutable form state. Search params are only used to seed the
  // initial values (and for navigation); typing must update this state so the
  // fields stay in sync visually and values persist while interacting.
  const [jobTitle, setJobTitle] = useState(search.jobTitle || "");
  const [company, setCompany] = useState(search.company || "");
  const [jobDescription, setJobDescription] = useState(search.jobDescription || "");
  const [stageResumeId, setStageResumeId] = useState("");
  const [uploadFailed, setUploadFailed] = useState(false);

  // Start Optimization is actionable only when a real resume has been
  // successfully registered and all three job fields are populated, and there
  // is no active upload/register failure. stageResumeId is the authoritative
  // "registered resume" signal for this fresh upload flow.
  const readyResumeId = stageResumeId || resumeId;
  const canStartOptimization =
    Boolean(readyResumeId) &&
    !uploadFailed &&
    jobTitle.trim().length > 0 &&
    company.trim().length > 0 &&
    jobDescription.trim().length > 0;

  const handleStartOptimization = useCallback(
    (targetResumeId: string) => {
      if (!targetResumeId) return;
      // Navigate to Studio with the resume ID and the current form values.
      navigate({
        to: "/resumes/$id",
        params: { id: targetResumeId },
        search: { jobTitle, company, jobDescription },
      });
    },
    [navigate, jobTitle, company, jobDescription],
  );

  if (mode === "upload") {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          eyebrow="Workspace"
          title="Optimize my resume for a job"
          description="Upload your resume and add a target job description. CareerOS will analyze what to improve while preserving your resume's original look and structure."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <ResumeUpload
            embedded
            onResumeUploaded={(newResumeId) => {
              // Store the new resume id. Parent owns navigation via "Start Optimization" button.
              setStageResumeId(newResumeId);
              setUploadFailed(false);
            }}
            onUploadError={() => {
              // Keep Start Optimization disabled while a fresh register attempt fails.
              setUploadFailed(true);
            }}
          />

          {/* Target job panel (matched glass card) */}
          <Card className="glass flex h-full flex-col rounded-2xl border-border/60 p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Target className="h-4 w-4" />
                </div>
                <h2 className="text-base font-semibold tracking-tight">Target job</h2>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Add the job you&apos;re targeting so CareerOS can tailor your resume.
              </p>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="target-job-title"
                  className="text-[13px] font-medium text-foreground/90"
                >
                  Job title
                </Label>
                <Input
                  id="target-job-title"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="bg-surface-elevated/30 border-border/60"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="target-company"
                  className="text-[13px] font-medium text-foreground/90"
                >
                  Company
                </Label>
                <Input
                  id="target-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="bg-surface-elevated/30 border-border/60"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="target-job-description"
                  className="text-[13px] font-medium text-foreground/90"
                >
                  Job description
                </Label>
                <Textarea
                  id="target-job-description"
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="resize-none bg-surface-elevated/30 border-border/60"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Single CTA spanning the complete workflow (not just the right-side form) */}
        <Button
          variant="default"
          size="lg"
          onClick={() => handleStartOptimization(readyResumeId || "")}
          className="w-full rounded-xl shadow-[var(--shadow-glow)]"
          disabled={!canStartOptimization}
        >
          <Sparkles className="mr-1.5 h-4 w-4" /> Start Optimization
        </Button>
      </div>
    );
  }

  if (mode === "build") {
    return <ResumeQuestionnaire />;
  }
  if (mode === "review" && resumeId) {
    return <ResumeReview resumeId={resumeId} />;
  }

  return <ResumeSetupChoices />;
}
