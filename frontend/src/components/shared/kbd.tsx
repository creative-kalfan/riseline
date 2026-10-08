import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Consistent keyboard-hint chip. Use for shortcut affordances. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "tnum inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-surface-muted px-1.5 text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
