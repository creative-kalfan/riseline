import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SCAN_FADE_OUT_MS = 320;

/**
 * Visual scanning beam rendered above the actual PDF.js page canvases while
 * an ATS analysis is running. Purely presentational: transform/opacity CSS
 * animation only, pointer-events disabled, PDF lifecycle untouched. Designed
 * so a future issue-overlay can be added as a sibling layer.
 */
export function PdfScanOverlay({ active, pageCount }: { active: boolean; pageCount: number }) {
  const [mounted, setMounted] = useState(active);

  useEffect(() => {
    if (active) {
      setMounted(true);
      return;
    }
    const timer = setTimeout(() => setMounted(false), SCAN_FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [active]);

  if (!mounted || pageCount === 0) return null;

  const durationSec = Math.min(12, Math.max(2.6, pageCount * 2.2));

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-sm",
        "transition-opacity duration-300",
        active ? "opacity-100" : "opacity-0",
      )}
      style={{ "--ats-scan-duration": `${durationSec}s` } as React.CSSProperties}
    >
      <div className="ats-scan-runner">
        <div className="ats-scan-trail" />
        <div className="ats-scan-line" />
      </div>
      <div className="ats-scan-static-indicator" />
    </div>
  );
}
