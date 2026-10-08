import { useMemo } from "react";
import type { EvidenceLocationMap } from "@/lib/evidence-location";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Visual status classification for evidence highlighting. */
export type HighlightStatus = "partial" | "weak" | "matched";

/** A single evidence highlight rectangle for rendering on a PDF page. */
export type EvidenceHighlight = {
  requirementId: string;
  status: HighlightStatus;
  locations: {
    page: number;
    rects: { x: number; y: number; width: number; height: number }[];
  }[];
  evidence: string;
};

// ---------------------------------------------------------------------------
// Status classification
// ---------------------------------------------------------------------------

/**
 * Derive the visual highlight status from ATS requirement coverage fields.
 *
 * Priority:
 * 1. `status` field (matched|partial|missing) — authoritative backend signal
 * 2. `evidence_level` (strong|moderate|weak|none) — fallback
 * 3. Default: "matched" (visible evidence exists, treat as normal match)
 *
 * "missing" returns null — nothing to highlight on the PDF.
 */
export function classifyHighlightStatus(
  status?: string,
  evidenceLevel?: string,
): HighlightStatus | null {
  if (status === "missing") return null;
  if (status === "partial") return "partial";

  if (evidenceLevel === "weak") return "weak";
  if (evidenceLevel === "none") return null;

  return "matched";
}

// ---------------------------------------------------------------------------
// Per-page highlight transformation
// ---------------------------------------------------------------------------

/**
 * Transform an EvidenceLocationMap (keyed by requirement string) into
 * flat per-page highlight arrays ready for overlay rendering.
 *
 * Filters out entries with no locations, NOT_FOUND confidence, or
 * LOW_CONFIDENCE. No coordinates are fabricated.
 */
export function pdfIssueToPageHighlights(
  evidenceMap: EvidenceLocationMap,
  requirementCoverage?: Array<{
    requirement?: string;
    status?: string;
    evidence_level?: string;
  }>,
): EvidenceHighlight[] {
  if (!evidenceMap.size) return [];

  const coverageMap = new Map<string, { status?: string; evidence_level?: string }>();
  if (requirementCoverage) {
    for (const rc of requirementCoverage) {
      if (rc.requirement) {
        coverageMap.set(rc.requirement, {
          status: rc.status,
          evidence_level: rc.evidence_level,
        });
      }
    }
  }

  const highlights: EvidenceHighlight[] = [];

  for (const [key, entry] of evidenceMap) {
    const loc = entry.location;
    if (!loc || loc.confidence === "NOT_FOUND" || loc.confidence === "LOW_CONFIDENCE") continue;
    if (!loc.locations.length) continue;

    const cov = coverageMap.get(key);
    const status = classifyHighlightStatus(cov?.status, cov?.evidence_level);
    if (status === null) continue;

    const filteredLocations = loc.locations
      .filter((pl) => pl.rects.length > 0)
      .map((pl) => ({
        page: pl.page,
        rects: pl.rects.map((r) => ({
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
        })),
      }));

    if (filteredLocations.length === 0) continue;

    highlights.push({
      requirementId: key,
      status,
      locations: filteredLocations,
      evidence: entry.evidence,
    });
  }

  return highlights;
}

// ---------------------------------------------------------------------------
// Styling helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Styling helpers
// ---------------------------------------------------------------------------

/**
 * Visual state precedence:
 * - Selected: stronger border, subtle glow, slightly stronger background.
 * - Another requirement selected: same highlight stays visible but subdued so
 *   the PDF never disappears behind overlays.
 * - No selection: normal status-aware visibility.
 */
export function evidenceHighlightClassName(
  status: HighlightStatus,
  isSelected: boolean,
  hasSelection: boolean,
): string {
  if (isSelected) {
    switch (status) {
      case "partial":
        return "border border-amber-500/70 bg-amber-400/20 shadow-[0_0_0_2px_rgba(245,158,11,0.35)]";
      case "weak":
        return "border border-yellow-500/65 bg-yellow-400/[0.18] shadow-[0_0_0_2px_rgba(234,179,8,0.3)]";
      case "matched":
        return "border border-emerald-500/55 bg-emerald-400/15 shadow-[0_0_0_2px_rgba(16,185,129,0.28)]";
    }
  }

  if (hasSelection) {
    switch (status) {
      case "partial":
        return "border border-amber-400/15 bg-amber-400/[0.04]";
      case "weak":
        return "border border-yellow-400/15 bg-yellow-400/[0.03]";
      case "matched":
        return "border border-emerald-400/10 bg-emerald-400/[0.02]";
    }
  }

  switch (status) {
    case "partial":
      return "border border-amber-400/35 bg-amber-400/8 hover:bg-amber-400/14 hover:border-amber-400/50";
    case "weak":
      return "border border-yellow-400/30 bg-yellow-400/7 hover:bg-yellow-400/12 hover:border-yellow-400/45";
    case "matched":
      return "border border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10 hover:border-emerald-400/35";
  }
}

function highlightTransition(status: HighlightStatus, isSelected: boolean): string {
  if (isSelected) return "";
  if (status === "matched") return "transition-all duration-150";
  return "transition-all duration-100";
}

function highlightTooltip(hl: EvidenceHighlight): string {
  const label =
    hl.status === "partial"
      ? "Partial evidence"
      : hl.status === "weak"
        ? "Weak evidence"
        : "Matched evidence";
  const evidence = hl.evidence ? ` — "${hl.evidence}"` : "";
  return `${label}${evidence}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders translucent highlight rectangles over the real PDF canvas.
 *
 * Each highlight is positioned in intrinsic (scale-1) PDF page coordinates
 * and multiplied by `zoom` to stay aligned through zoom and scroll.
 * The original PDF is never touched.
 *
 * Highlighting is driven by EvidenceLocationMap data from Target 4.2.
 * No string matching is performed — coordinates come directly from
 * the evidence→PDF location mapping pipeline.
 */
export function PdfIssueOverlay({
  highlights,
  zoom,
  selectedRequirementId,
  onSelectHighlight,
}: {
  highlights: EvidenceHighlight[];
  zoom: number;
  selectedRequirementId?: string | null;
  onSelectHighlight?: (requirementId: string) => void;
}) {
  const pageMap = useMemo(() => {
    const map = new Map<number, EvidenceHighlight[]>();
    for (const hl of highlights) {
      for (const loc of hl.locations) {
        const existing = map.get(loc.page);
        if (existing) {
          existing.push(hl);
        } else {
          map.set(loc.page, [hl]);
        }
      }
    }
    return map;
  }, [highlights]);

  // Single authoritative selection drives the three visual states:
  // selected-prominent, others-subdued, or normal when nothing is selected.
  const hasSelection = Boolean(selectedRequirementId);

  if (!highlights.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {Array.from(pageMap.entries()).map(([page, pageHighlights]) => (
        <div key={page} className="absolute inset-0">
          {pageHighlights.map((hl) => {
            const isSelected = hl.requirementId === selectedRequirementId;
            return hl.locations
              .filter((loc) => loc.page === page)
              .flatMap((loc) =>
                loc.rects.map((rect, idx) => (
                  <button
                    key={`${hl.requirementId}-p${page}-r${idx}`}
                    type="button"
                    role="button"
                    aria-label={`${hl.status === "partial" ? "Partial" : hl.status === "weak" ? "Weak" : "Matched"} evidence for ${hl.requirementId}${hl.evidence ? `: ${hl.evidence}` : ""}`}
                    title={highlightTooltip(hl)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectHighlight?.(hl.requirementId);
                    }}
                    className={`pointer-events-auto absolute cursor-pointer rounded-[2px] ${evidenceHighlightClassName(hl.status, isSelected, hasSelection)} ${highlightTransition(hl.status, isSelected)} ${isSelected ? "z-30" : ""}`}
                    style={{
                      left: rect.x * zoom,
                      top: rect.y * zoom,
                      width: rect.width * zoom,
                      height: rect.height * zoom,
                    }}
                  />
                )),
              );
          })}
        </div>
      ))}
    </div>
  );
}
