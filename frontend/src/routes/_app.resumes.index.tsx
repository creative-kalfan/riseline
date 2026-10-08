import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, slideInRight } from "@/lib/motion";
import {
  Target,
  FilePlus2,
  ChevronRight,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useResumes } from "@/hooks/api/useResumes";
import { formatDate } from "@/utils/date";

export const Route = createFileRoute("/_app/resumes/")({
  head: () => ({
    meta: [
      { title: "Resume Studio · CareerOS" },
      {
        name: "description",
        content:
          "Turn your resume into a job-winning application. Upload your resume, add a target job, and analyze what to improve while preserving your resume's original look and structure.",
      },
    ],
  }),
  component: ResumesPage,
});

function ResumesPage() {
  const { data: resumesData, isLoading } = useResumes();
  const resumes = resumesData?.resumes ?? [];

  return (
    <div className="w-full max-w-[1536px] mx-auto flex flex-col gap-8 px-4 sm:px-6 lg:px-8 py-6">
      <PageHeader
        eyebrow="Workspace"
        title="Turn your resume into a job-winning application"
        description="Upload your resume, add a target job, and CareerOS analyzes what to improve — while preserving your resume's original look and structure."
      />

      {/* Primary Intent Cards */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={staggerItem}>
          <Link
            to="/resumes/setup"
            search={{ mode: "upload", jobTitle: "", company: "", jobDescription: "" }}
            className="group text-left cursor-pointer"
          >
            <Card className="relative flex h-full min-h-54 flex-col rounded-lg border-2 border-border p-6 shadow-brutal-sm bg-surface hover:border-primary hover:shadow-brutal-primary transition-all duration-150 select-none">
              <div className="flex h-full flex-col relative z-10">
                <div className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary border-2 border-primary/40 shadow-brutal-xs">
                  <Target className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <div className="text-base font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    Optimize my resume for a job
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    Tailor a resume against a specific job description. Get ATS alignment,
                    requirement tracking, and AI-powered suggestions.
                  </div>
                </div>
                <div className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold text-primary uppercase font-mono tracking-wider transition-all group-hover:gap-2">
                  Start optimization{" "}
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Link to="/resumes/setup" className="group text-left cursor-pointer">
            <Card className="relative flex h-full min-h-54 flex-col rounded-lg border-2 border-border p-6 shadow-brutal-sm bg-surface hover:border-primary hover:shadow-brutal-primary transition-all duration-150 select-none">
              <div className="flex h-full flex-col relative z-10">
                <div className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary border-2 border-primary/40 shadow-brutal-xs">
                  <FilePlus2 className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <div className="text-base font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    Create / Upload resume
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    Build or establish your master resume profile. Upload a PDF/DOCX or build from
                    scratch with guided structure.
                  </div>
                </div>
                <div className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold text-primary uppercase font-mono tracking-wider transition-all group-hover:gap-2">
                  Upload or create{" "}
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>
      </motion.div>

      {/* Existing Resumes Workspace Section */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b-2 border-border pb-3">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-tight text-foreground font-mono">Your Resumes</h2>
            <p className="text-xs text-muted-foreground">
              Master resumes and tailored version documents.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="h-8 rounded-md text-xs font-bold border-2 border-border shadow-brutal-xs gap-1">
            <Link to="/resumes/setup">
              <Plus className="h-3.5 w-3.5" /> New
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border-2 border-border p-4 bg-surface space-y-3 shadow-brutal-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-surface-elevated animate-pulse shrink-0 border border-border" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-40 rounded-sm bg-surface-elevated animate-pulse" />
                    <div className="h-2.5 w-24 rounded-sm bg-surface-elevated/70 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <Card className="rounded-lg border-2 border-dashed border-border p-8 text-center bg-surface shadow-brutal-sm">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-surface-elevated border-2 border-border text-muted-foreground mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">No resumes in workspace yet</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Upload a resume or build from scratch to start optimizing with live ATS intelligence.
            </p>
          </Card>
        ) : (
          <motion.div
            className="grid gap-3 sm:grid-cols-2"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {resumes.map((resume) => (
              <motion.div
                key={resume.id}
                variants={staggerItem}
                whileHover={{ scale: 1.008, transition: { duration: 0.15 } }}
              >
                <Link to="/resumes/$id" params={{ id: resume.id }} className="group block">
                  <Card className="rounded-lg border-2 border-border p-4 transition-all hover:border-primary hover:shadow-brutal-xs bg-surface">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-border bg-surface-elevated text-muted-foreground group-hover:text-primary group-hover:border-primary transition-colors">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {resume.name || "Untitled Resume"}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            {resume.role && (
                              <span className="truncate max-w-[140px] font-medium">{resume.role}</span>
                            )}
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              <Clock className="h-3 w-3" />
                              {formatDate(resume.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {resume.atsScore != null && resume.atsScore > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs font-mono font-bold border-2 border-primary bg-primary/10 text-primary rounded-sm"
                          >
                            ATS {Math.round(resume.atsScore)}
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
