"use client";

import { useState } from "react";
import {
  Sparkles,
  Briefcase,
  FolderKanban,
  BadgeCheck,
  Target,
  Layout,
  Check,
  X,
  Pencil,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-tooltip";
import { OptimizationDiffView } from "./optimization-diff-view";
import type { OptimizationSuggestion, SuggestionPriority } from "@/types/optimization";

const TYPE_META: Record<
  OptimizationSuggestion["type"],
  { label: string; icon: React.ElementType; color: string }
> = {
  professional_summary: { label: "Professional Summary", icon: Sparkles, color: "text-sky-500" },
  experience_bullet: { label: "Experience Bullet", icon: Briefcase, color: "text-indigo-500" },
  project_bullet: { label: "Project Bullet", icon: FolderKanban, color: "text-violet-500" },
  skills_alignment: { label: "Skills Alignment", icon: BadgeCheck, color: "text-emerald-500" },
  keyword_placement: { label: "Keyword Placement", icon: Target, color: "text-amber-500" },
  section_prioritization: { label: "Section Priority", icon: Layout, color: "text-fuchsia-500" },
};

const PRIORITY_STYLES: Record<SuggestionPriority, string> = {
  high: "bg-rose-500/15 text-rose-500 border-rose-500/20",
  medium: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  low: "bg-sky-500/15 text-sky-500 border-sky-500/20",
};

function SkillsAlignmentBody({ suggestion }: { suggestion: OptimizationSuggestion }) {
  const actionLabel: Record<string, string> = {
    keep: "Keep as-is",
    do_not_add: "Do not add (no evidence)",
    verify: "Verify before adding",
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{suggestion.skill}</span>
        {suggestion.category && (
          <Badge variant="outline" className="text-[10px] capitalize">
            {suggestion.category.replace(/_/g, " ")}
          </Badge>
        )}
      </div>
      {suggestion.action && (
        <Badge variant="secondary" className="text-[10px]">
          {actionLabel[suggestion.action] ?? suggestion.action}
        </Badge>
      )}
      {suggestion.explanation && (
        <p className="text-sm text-muted-foreground">{suggestion.explanation}</p>
      )}
      {suggestion.similarInResume && (
        <p className="text-xs text-muted-foreground">
          Similar in resume: <span className="font-medium">{suggestion.similarInResume}</span>
        </p>
      )}
    </div>
  );
}

function SectionPriorityBody({ suggestion }: { suggestion: OptimizationSuggestion }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">
        Prioritize: <span className="capitalize">{suggestion.section}</span>
      </p>
      {suggestion.explanation && (
        <p className="text-sm text-muted-foreground">{suggestion.explanation}</p>
      )}
    </div>
  );
}

export function OptimizationSuggestionCard({
  suggestion,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
  disabled,
}: {
  suggestion: OptimizationSuggestion;
  onAccept: (editedText?: string) => void;
  onReject: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
  disabled?: boolean;
}) {
  const meta = TYPE_META[suggestion.type] ?? TYPE_META.professional_summary;
  const Icon = meta.icon;
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(suggestion.suggestedText ?? suggestion.currentText ?? "");

  const isSkills = suggestion.type === "skills_alignment";
  const isSection = suggestion.type === "section_prioritization";
  const isTextSuggestion = !isSkills && !isSection;

  const handleAccept = () => {
    if (editing) {
      if (!draft.trim()) {
        toast.error("Cannot accept empty text");
        return;
      }
      onAccept(draft.trim());
      setEditing(false);
    } else {
      onAccept();
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 ${meta.color}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{meta.label}</p>
            {suggestion.section && (
              <p className="text-[11px] text-muted-foreground capitalize">{suggestion.section}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className={`text-[10px] capitalize ${PRIORITY_STYLES[suggestion.priority]}`}
          >
            {suggestion.priority}
          </Badge>
          {suggestion.status === "accepted" && (
            <Badge className="bg-emerald-500/15 text-emerald-500 text-[10px]">
              <Check className="h-3 w-3 mr-1" /> Accepted
            </Badge>
          )}
          {suggestion.status === "edited" && (
            <Badge className="bg-emerald-500/15 text-emerald-500 text-[10px]">
              <Pencil className="h-3 w-3 mr-1" /> Edited
            </Badge>
          )}
          {suggestion.status === "rejected" && (
            <Badge className="bg-muted text-muted-foreground text-[10px]">
              <X className="h-3 w-3 mr-1" /> Rejected
            </Badge>
          )}
        </div>
      </div>

      {isSkills ? (
        <SkillsAlignmentBody suggestion={suggestion} />
      ) : isSection ? (
        <SectionPriorityBody suggestion={suggestion} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{suggestion.explanation}</p>
          {editing ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="text-sm resize-y"
            />
          ) : (
            <OptimizationDiffView
              currentText={suggestion.currentText}
              suggestedText={suggestion.suggestedText}
            />
          )}
        </>
      )}

      {suggestion.evidence.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestion.evidence.map((e) => (
            <Badge key={e} variant="secondary" className="text-[10px]">
              {e}
            </Badge>
          ))}
        </div>
      )}

      {suggestion.affectedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestion.affectedKeywords.map((k) => (
            <Badge key={k} variant="outline" className="text-[10px] border-primary/30 text-primary">
              {k}
            </Badge>
          ))}
        </div>
      )}

      {suggestion.evidenceIssues.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
          {suggestion.evidenceIssues.map((issue) => (
            <p key={issue} className="text-xs text-amber-600">
              ⚠ {issue}
            </p>
          ))}
        </div>
      )}

      {suggestion.status === "pending" && !disabled && (
        <div className="flex items-center gap-2 pt-1">
          {editing ? (
            <>
              <Button size="sm" onClick={handleAccept} disabled={isAccepting} className="flex-1">
                <Check className="h-3.5 w-3.5 mr-1" /> Save & Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(suggestion.suggestedText ?? suggestion.currentText ?? "");
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
                disabled={!isTextSuggestion || isAccepting || isRejecting}
                title={isTextSuggestion ? "Edit suggestion" : "Not editable"}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={isAccepting || isRejecting}
                className="flex-1"
              >
                <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onReject}
                disabled={isAccepting || isRejecting}
              >
                <ThumbsDown className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
