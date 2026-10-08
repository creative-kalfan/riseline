"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Plus, Upload, ArrowUpRight, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTemplates } from "@/hooks/api/useTemplates";
import { TemplateCard } from "@/components/resume/templates/template-card";
import { TemplatePreview } from "@/components/resume/templates/template-preview";
import { getErrorMessage } from "@/utils/api-error";

export function ResumeTemplatesPage() {
  const { data, isLoading, isError, error } = useTemplates();
  const templates = data?.templates ?? [];
  const [viewMode, setViewMode] = useState<"gallery" | "preview">("gallery");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const selectedTemplateData = templates.find((t) => t.slug === selectedTemplate) ?? null;

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          eyebrow="Templates"
          title="Resume Templates"
          description="Choose a professional resume template to showcase your career."
        />
        <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 bg-surface-elevated/30 py-24 text-center">
          <div className="max-w-[320px]">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-destructive/25 to-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="mt-4 text-sm font-semibold">Couldn't load templates</div>
            <div className="mt-1 text-xs text-muted-foreground">{getErrorMessage(error)}</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-lg text-xs"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "preview" && selectedTemplateData) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setViewMode("gallery")}
          >
            <ArrowUpRight className="h-4 w-4 rotate-180" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{selectedTemplateData.name}</h1>
            <p className="text-xs text-muted-foreground">{selectedTemplateData.description}</p>
          </div>
        </div>
        <TemplatePreview template={selectedTemplateData} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Templates"
        title="Resume Templates"
        description="Choose a professional resume template to showcase your career."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/resumes/setup">
                <Upload className="mr-1.5 h-4 w-4" /> Import
              </Link>
            </Button>
            <Button asChild className="rounded-xl shadow-[var(--shadow-glow)]">
              <Link to="/resumes/setup">
                <Plus className="mr-1.5 h-4 w-4" /> New resume
              </Link>
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="glass relative h-full overflow-hidden rounded-2xl border-border/60 p-5"
            >
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 bg-surface-elevated/30 py-24 text-center">
          <div className="max-w-[280px]">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/25 to-accent/25">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-4 text-sm font-semibold">No templates available</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Check back later for new templates.
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onSelect={(template) => {
                setSelectedTemplate(template.slug);
                setViewMode("preview");
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
