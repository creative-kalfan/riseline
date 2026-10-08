"use client";

import { Link } from "@tanstack/react-router";
import { FileText, ExternalLink, Info } from "lucide-react";
import { ResumeTemplate } from "@/types/resume";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TemplateCardProps {
  template: ResumeTemplate;
  resumeId?: string;
  onSelect?: (template: ResumeTemplate) => void;
}

export function TemplateCard({ template, resumeId, onSelect }: TemplateCardProps) {
  const layoutLabel = template.columnCount > 1 ? `${template.columnCount}-Column` : "Single Column";
  const pageLabel = template.pagePreference === "one-page" ? "1 Page" : "Flexible";

  const content = (
    <div className="glass group relative flex h-full flex-col overflow-hidden rounded-2xl border-border/60 p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevation-2)]">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-linear-to-br from-primary/20 to-accent/10 blur-3xl transition group-hover:scale-125" />

      <div className="relative flex items-start justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-background/50 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <Badge variant="secondary" className="rounded-full text-[10px]">
          {layoutLabel}
        </Badge>
      </div>

      <div className="relative mt-4">
        <div className="truncate text-base font-semibold tracking-tight">{template.name}</div>
        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {template.description}
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="rounded-full text-[10px]">
          {layoutLabel}
        </Badge>
        <Badge variant="outline" className="rounded-full text-[10px]">
          {pageLabel}
        </Badge>
        {template.targetRoles.slice(0, 2).map((role) => (
          <Badge key={role} variant="outline" className="rounded-full text-[10px]">
            {role}
          </Badge>
        ))}
      </div>

      <div className="relative mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>{template.license || "Open Source"}</span>
        </div>
        {template.sourceUrl && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={template.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </TooltipTrigger>
              <TooltipContent>View original template</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );

  if (onSelect) {
    return (
      <button onClick={() => onSelect(template)} className="text-left">
        {content}
      </button>
    );
  }

  const href = resumeId ? `/resumes/${resumeId}?template=${template.slug}` : "/resumes/setup";
  const linkHref = href as any;

  return (
    <Link to={linkHref} className="group animate-fade-in">
      {content}
    </Link>
  );
}
