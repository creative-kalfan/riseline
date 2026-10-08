"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type JobDescriptionFormValues = {
  jobTitle?: string;
  company?: string;
  jobDescription: string;
};

export type ATSAnalysisDialogProps = {
  resumeId: string;
  onClose: () => void;
  onAnalyze: (values: JobDescriptionFormValues) => void;
  defaultValues?: {
    jobTitle?: string;
    company?: string;
    jobDescription?: string;
  };
};

export function ATSAnalysisDialog({
  resumeId: _resumeId,
  onClose,
  onAnalyze,
  defaultValues,
}: ATSAnalysisDialogProps) {
  const [jobTitle, setJobTitle] = useState(defaultValues?.jobTitle ?? "");
  const [company, setCompany] = useState(defaultValues?.company ?? "");
  const [jobDescription, setJobDescription] = useState(defaultValues?.jobDescription ?? "");

  const onSubmit = () => {
    onAnalyze({ jobTitle, company, jobDescription });
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl border-2 border-border shadow-brutal-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <DialogTitle className="text-lg font-mono font-bold uppercase tracking-tight">
              Analyze Resume Against Job
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Compare your active resume version against a target job description to evaluate ATS compatibility,
            keyword density, and semantic alignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ats-job-title" className="block text-xs font-mono font-medium text-foreground">
              Target Job Title <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="ats-job-title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="h-10 border-2 font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ats-company" className="block text-xs font-mono font-medium text-foreground">
              Target Company <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="ats-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="h-10 border-2 font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ats-job-description" className="block text-xs font-mono font-medium text-foreground">
              Job Description <span className="text-primary font-bold">(Required)</span>
            </Label>
            <Textarea
              id="ats-job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              placeholder="Paste the complete target job description here..."
              className="min-h-[160px] resize-y border-2 text-sm leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-2 border-border font-mono text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!jobDescription.trim()}
              className="flex-1 font-mono text-xs uppercase tracking-wider shadow-brutal-primary-md"
            >
              Run ATS Analysis
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
