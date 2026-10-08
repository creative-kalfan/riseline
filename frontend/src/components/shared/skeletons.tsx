import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/** Reusable skeleton primitives for consistent loading states across CareerOS. */

export function SkeletonCard({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div
      className={cn("glass rounded-xl border border-border/80 p-5 shadow-xs", className)}
      aria-hidden
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3 rounded" />
          <Skeleton className="h-2.5 w-2/3 rounded" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-2.5 rounded" style={{ width: `${90 - i * 12}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <ul className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: items }).map((_, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-xl border border-border/80 bg-surface/40 p-3 shadow-xs"
        >
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-2.5 w-2/3 rounded" />
            <Skeleton className="h-2 w-1/2 rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-xl", className)} aria-hidden />;
}

export function SkeletonTelemetryRibbon({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)} aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="workstation-panel rounded-xl border border-border/70 p-3.5 flex items-center justify-between"
        >
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-2 w-16 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonKanban({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full", className)} aria-hidden>
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="workstation-instrument rounded-xl border border-border/70 p-3.5 space-y-3 flex flex-col min-h-[400px]"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <Skeleton className="h-3.5 w-20 rounded" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
          <div className="space-y-2.5 flex-1">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="workstation-panel rounded-lg border border-border/60 p-3 space-y-2 bg-surface/70"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-3 w-10 rounded" />
                </div>
                <Skeleton className="h-2.5 w-3/4 rounded" />
                <div className="flex items-center gap-1.5 pt-1">
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "workstation-panel rounded-xl border border-border/80 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      <div className="border-b border-border/80 bg-surface-elevated/50 p-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1 rounded" />
        ))}
      </div>
      <div className="divide-y divide-border/40">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-3.5 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton
                key={j}
                className="h-2.5 flex-1 rounded"
                style={{ width: `${80 - (j % 3) * 15}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
