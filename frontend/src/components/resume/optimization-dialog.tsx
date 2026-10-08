"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export type OptimizationDialogProps = {
  resumeId: string;
  analysisId: string;
  onClose: () => void;
  onAccept: (values: {
    optimizationType: string;
    currentText: string;
    suggestedText: string;
    explanation: string;
  }) => void;
  onReject: () => void;
};

export function OptimizationDialog({
  resumeId: _resumeId,
  analysisId: _analysisId,
  onClose,
  onAccept,
  onReject,
}: OptimizationDialogProps) {
  const [optimizationType, setOptimizationType] = useState("summary");
  const [currentText, setCurrentText] = useState("");
  const [suggestedText, setSuggestedText] = useState("");
  const [explanation, setExplanation] = useState("");

  const handleAccept = () => {
    onAccept({ optimizationType, currentText, suggestedText, explanation });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-background p-6 shadow-2xl transform overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 rounded-full p-1 hover:bg-secondary/60 cursor-pointer"
          onClick={onClose}
          aria-label="Close optimization dialog"
        >
          <X className="h-4 w-4" />
        </Button>

        <h2 className="text-xl font-semibold tracking-tight mb-6">Optimize Resume</h2>

        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium mb-2">Optimization Type</Label>
            <Select value={optimizationType} onValueChange={setOptimizationType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select target version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Professional Summary</SelectItem>
                <SelectItem value="experience_bullet">Experience Bullet</SelectItem>
                <SelectItem value="project_bullet">Project Bullet</SelectItem>
                <SelectItem value="skills_alignment">Skills Alignment</SelectItem>
                <SelectItem value="keyword_placement">Keyword Placement</SelectItem>
                <SelectItem value="section_prioritization">Section Prioritization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">Current Text</Label>
            <Textarea
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              rows={3}
              placeholder="Current text from resume..."
              className="h-[150px] resize-y w-full border border-border/60 rounded-md p-3 text-sm focus-visible:ring-0"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">Suggested Text</Label>
            <Textarea
              value={suggestedText}
              onChange={(e) => setSuggestedText(e.target.value)}
              rows={3}
              placeholder="Suggested optimization..."
              className="h-[150px] resize-y w-full border border-border/60 rounded-md p-3 text-sm focus-visible:ring-0"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">Explanation</Label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              placeholder="Explanation of the optimization..."
              className="h-[80px] w-full border border-border/60 rounded-md p-3 text-sm focus-visible:ring-0"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={handleAccept}
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium text-background bg-primary hover:bg-primary/90"
            >
              Apply
            </Button>
            <Button
              type="button"
              onClick={onReject}
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium hover:bg-background/60"
            >
              Reject
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
