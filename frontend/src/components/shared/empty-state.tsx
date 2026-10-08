import type { ComponentType, ReactNode } from "react";
import { Inbox, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  guidance,
  action,
  secondaryAction,
  className,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  guidance?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface p-8 sm:p-10 text-center",
        className,
      )}
      role="status"
    >
      <div className="grid h-11 w-11 place-items-center rounded-md border border-border bg-surface-muted text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 max-w-md space-y-1">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      {guidance && (
        <div className="inline-flex items-center gap-1.5 rounded border border-brand/30 bg-brand-subtle px-2.5 py-1 text-[11px] text-brand">
          <Compass className="h-3 w-3 shrink-0" />
          <span>{guidance}</span>
        </div>
      )}

      {(action || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
