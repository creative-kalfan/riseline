import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Evidence-backed text: a highlight wash under the lower ~40% of the glyphs.
 * Ink color never changes, so contrast is preserved in both themes.
 */
export function Evidence({ children, className }: { children: ReactNode; className?: string }) {
  return <mark className={cn("evidence-mark", className)}>{children}</mark>;
}
