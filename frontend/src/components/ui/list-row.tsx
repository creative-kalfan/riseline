import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ListRow: the shared dense-row primitive for Jobs / Recommendations /
 * Applications lists. Table-like rows stay square (radius 0); cards use the
 * panel radius. Keyboard selection state is exposed via aria-selected.
 */
export function ListRow({
  children,
  selected,
  onSelect,
  href,
  className,
}: {
  children: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  href?: string;
  className?: string;
}) {
  return (
    <div
      role="row"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "tnum flex w-full items-center gap-3 rounded-none border-b border-border px-3 py-2.5 text-left text-sm text-foreground transition-colors",
        onSelect || href ? "cursor-pointer hover:bg-surface-muted/60" : "",
        selected
          ? "border-l-2 border-l-brand bg-brand-subtle/40"
          : "border-l-2 border-l-transparent",
        className,
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {(onSelect || href) && (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  );
}
