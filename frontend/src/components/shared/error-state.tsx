import type { ComponentType, ReactNode } from "react";
import { AlertCircle, RefreshCw, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  icon?: ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  error?: unknown;
  errorCode?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

/**
 * Standardized error state container for clean, unified error handling across CareerOS.
 */
export function ErrorState({
  icon: Icon = AlertCircle,
  title = "Telemetry Error Encountered",
  description,
  error,
  errorCode,
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  const errorMessage =
    description ??
    (error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected telemetry or network error occurred. Please retry.");

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-danger/30 bg-danger-subtle p-8 sm:p-10 text-center",
        className,
      )}
      role="alert"
    >
      <div className="grid h-11 w-11 place-items-center rounded-md border border-danger/30 bg-surface text-danger">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 max-w-md space-y-1">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        {errorMessage && (
          <p className="text-xs text-muted-foreground leading-relaxed">{errorMessage}</p>
        )}
      </div>

      {errorCode && (
        <div className="tnum inline-flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground">
          <Terminal className="h-3 w-3 text-danger" />
          <span>Code: {errorCode}</span>
        </div>
      )}

      {(onRetry || action) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8 gap-1.5 rounded-lg text-xs border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
