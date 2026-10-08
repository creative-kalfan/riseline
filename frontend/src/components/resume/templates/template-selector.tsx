"use client";

import { useState } from "react";
import { ResumeTemplate } from "@/types/resume";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TemplateCard } from "./template-card";

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ResumeTemplate[];
  selectedTemplateId?: string;
  onSelect: (template: ResumeTemplate) => void;
  isLoading?: boolean;
}

export function TemplateSelector({
  open,
  onOpenChange,
  templates,
  selectedTemplateId,
  onSelect,
  isLoading,
}: TemplateSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = templates.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.targetRoles.some((r) => r.toLowerCase().includes(q)) ||
      t.layoutType.toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Select a professional template to render your resume. Your data stays the same across
            all templates.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <ScrollArea className="h-[60vh]">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted/50" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No templates match your search.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onSelect={(template) => {
                    onSelect(template);
                    onOpenChange(false);
                  }}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
