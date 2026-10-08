"use client";

import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CompletenessResponseData } from "@/types/resume";

interface CompletenessIndicatorProps {
  score: number;
  sections: Record<string, { complete: boolean; count?: number; missing?: string | null }>;
  recommendations: string[];
}

export function CompletenessIndicator({
  score,
  sections,
  recommendations,
}: CompletenessIndicatorProps) {
  const incomplete = Object.entries(sections).filter(([, s]) => !s.complete);

  return (
    <Card className="glass rounded-2xl border-border/60 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Profile Completeness
          </div>
          <div className="mt-1 text-2xl font-semibold">{score}%</div>
        </div>
        <div className="relative h-16 w-16">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className={
                score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive"
              }
              strokeDasharray={`${score * 1.76} 176`}
            />
          </svg>
        </div>
      </div>

      <Progress value={score} className="mt-4" />

      {incomplete.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Missing Sections
          </div>
          {incomplete.map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
              {val.missing && <span className="text-muted-foreground/70">— {val.missing}</span>}
            </div>
          ))}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Recommendations
          </div>
          <ul className="space-y-1">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
