import { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
// Vite resolves this to a hashed asset URL for the worker bundle.
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Loader2 } from "lucide-react";
import { PdfScanOverlay } from "@/components/resume/pdf-scan-overlay";
import {
  PdfIssueOverlay,
  pdfIssueToPageHighlights,
  type EvidenceHighlight,
} from "@/components/resume/pdf-issue-overlay";
import { PdfGeometryOverlay } from "@/components/resume/pdf-geometry-overlay";
import type { DocumentGeometryMap, GeometryBlock } from "@/types/geometry";
import type { AtsRequirementCoverage } from "@/api/ats";
import {
  mapEvidenceToLocations,
  type EvidenceLocationMap,
  type PdfTextItemRaw,
} from "@/lib/evidence-location";
import { resolveEvidenceNavigationTarget } from "@/lib/ats-evidence-view";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

type PageSize = { w: number; h: number };

export type PdfTextItem = {
  original: string;
  norm: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Renders the ORIGINAL uploaded PDF bytes with PDF.js.
 *
 * This is purely a client-side visual renderer: the signed-URL document is
 * rasterized as-is, preserving original typography, colors, spacing and page
 * breaks. No parsed ResumeData is involved, and the underlying file is never
 * modified. `zoom` is a pure display multiplier (1 = 100%).
 */
export function PdfCanvasPreview({
  url,
  zoom,
  onError,
  isScanning = false,
  highlightStrings = [],
  onSelectIssue,
  requirementCoverage,
  evidenceLocations: externalEvidenceLocations,
  onEvidenceLocationsChange,
  selectedRequirementId,
  geometryMap,
  selectedTargetId,
  onSelectElement,
  onMutateBlock,
}: {
  url: string;
  zoom: number;
  onError?: () => void;
  isScanning?: boolean;
  highlightStrings?: string[];
  onSelectIssue?: (issue: string) => void;
  requirementCoverage?: AtsRequirementCoverage[];
  evidenceLocations?: EvidenceLocationMap | null;
  onEvidenceLocationsChange?: (locations: EvidenceLocationMap | null) => void;
  selectedRequirementId?: string | null;
  geometryMap?: DocumentGeometryMap | null;
  selectedTargetId?: string | null;
  onSelectElement?: (id: string, section?: string) => void;
  onMutateBlock?: (pageIndex: number, block: GeometryBlock, text: string) => Promise<void>;
}) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const docRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageSizes, setPageSizes] = useState<PageSize[]>([]);
  const [pageTextItems, setPageTextItems] = useState<PdfTextItem[][]>([]);
  const [loading, setLoading] = useState(true);
  const [computedEvidenceLocations, setComputedEvidenceLocations] =
    useState<EvidenceLocationMap | null>(null);

  // ---------------------------------------------------------------------------
  // Target 4.5 — automatic evidence navigation
  //
  // Purely local DOM interaction: when the selected requirement changes and its
  // existing EvidenceLocationMap entry (Target 4.2) has a valid location
  // (EXACT | NORMALIZED | MULTI_ITEM), an invisible anchor is rendered inside
  // the target page at the evidence's intrinsic Y × zoom, then scrolled into
  // view through whatever scroll container owns the PDF.
  //
  // This intentionally lives OUTSIDE the document-loading effect below so it
  // can never trigger a pdf.js getDocument() reload, and never touches
  // coordinates, matching or zoom logic.
  // ---------------------------------------------------------------------------

  /** Zero-height scroll anchor inside the focus page: intrinsic y + dedupe key. */
  const [focusAnchor, setFocusAnchor] = useState<{
    key: string;
    page: number;
    y: number;
  } | null>(null);
  const lastNavigationRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedRequirementId) {
      // Selection cleared (also happens when re-analysis starts): drop focus.
      lastNavigationRef.current = null;
      setFocusAnchor(null);
      return;
    }
    const target = resolveEvidenceNavigationTarget(
      computedEvidenceLocations,
      selectedRequirementId,
    );
    if (!target || pageSizes.length === 0) {
      // MISSING / NOT_FOUND / LOW_CONFIDENCE / pages not ready:
      // no navigation, no fabricated focus — the panel still shows details.
      setFocusAnchor(null);
      return;
    }
    const key = `${selectedRequirementId}@${target.page}@${target.rect.y}`;
    if (lastNavigationRef.current === key) return; // already focused
    lastNavigationRef.current = key;
    setFocusAnchor({ key, page: target.page, y: target.rect.y });
  }, [selectedRequirementId, computedEvidenceLocations, pageSizes.length]);

  useEffect(() => {
    if (!focusAnchor) return;
    // Run after commit so the anchor exists at its final zoom-scaled position.
    // The browser only scrolls this component's own scroll ancestors — the
    // PreviewPane's ScrollArea — never the whole window, if one exists.
    const raf = requestAnimationFrame(() => {
      document.getElementById("evidence-focus-anchor")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [focusAnchor]);

  // Load the document once per URL. Also extract normalized text items per
  // page (intrinsic scale-1 coordinates) for downstream issue highlighting.
  // Text extraction is part of the same load lifecycle, so it still runs only
  // when `url` changes — it never triggers an extra getDocument() call.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPageSizes([]);
    setPageTextItems([]);

    (async () => {
      try {
        const task = pdfjsLib.getDocument({ url });
        const pdf = await task.promise;
        docRef.current = pdf;
        if (cancelled) return;

        const sizes: PageSize[] = [];
        const textItems: PdfTextItem[][] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 1 });
          sizes.push({ w: vp.width, h: vp.height });
          if (cancelled) return;

          const tc = await page.getTextContent();
          const items: PdfTextItem[] = [];
          for (const it of tc.items) {
            if (!("str" in it)) continue;
            const str = it.str;
            if (!str.trim()) continue;
            const x = it.transform[4];
            const yTop = vp.height - it.transform[5] - (it.height || 0);
            items.push({
              original: str,
              norm: str
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, " ")
                .trim(),
              x,
              y: yTop,
              w: it.width || 0,
              h: it.height || 0,
            });
          }
          textItems.push(items);
          if (cancelled) return;
        }
        setPageTextItems(textItems);
        setPageSizes(sizes);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setLoading(false);
          onError?.();
        }
      }
    })();

    return () => {
      cancelled = true;
      docRef.current?.destroy?.();
      docRef.current = null;
    };
  }, [url, onError]);

  // Compute evidence→PDF location mapping when requirement coverage or
  // extracted text items change. Uses the same PDF.js text layer that
  // powers the canvas rendering — no separate extraction pass.
  useEffect(() => {
    if (
      !requirementCoverage?.length ||
      !pageTextItems.length ||
      externalEvidenceLocations !== undefined
    ) {
      // Use externally provided locations if available, or clear if no coverage
      if (externalEvidenceLocations !== undefined) {
        setComputedEvidenceLocations(externalEvidenceLocations);
        onEvidenceLocationsChange?.(externalEvidenceLocations);
      } else if (!requirementCoverage?.length) {
        setComputedEvidenceLocations(null);
        onEvidenceLocationsChange?.(null);
      }
      return;
    }

    const rawItems: PdfTextItemRaw[][] = pageTextItems.map((page) =>
      page.map((item) => ({
        original: item.original,
        norm: item.norm,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      })),
    );

    const locations = mapEvidenceToLocations(
      requirementCoverage.map((rc) => ({
        requirement: rc.requirement ?? "",
        resume_evidence: rc.resume_evidence,
        semantic_evidence: rc.semantic_evidence,
        evidence_level: rc.evidence_level,
      })),
      rawItems,
    );

    setComputedEvidenceLocations(locations);
    onEvidenceLocationsChange?.(locations);
  }, [requirementCoverage, pageTextItems, externalEvidenceLocations, onEvidenceLocationsChange]);

  // Transform EvidenceLocationMap into per-page highlights for the overlay.
  // Memoized on the resolved evidence locations and requirement coverage so
  // zoom/selection changes do not recompute.
  const highlights: EvidenceHighlight[] = useMemo(
    () => pdfIssueToPageHighlights(computedEvidenceLocations ?? new Map(), requirementCoverage),
    [computedEvidenceLocations, requirementCoverage],
  );

  // Rasterize pages at the requested zoom (device-pixel aware).
  useEffect(() => {
    if (!docRef.current || pageSizes.length === 0) return;
    let cancelled = false;

    (async () => {
      const pdf = docRef.current;
      if (!pdf) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (let i = 0; i < pageSizes.length; i++) {
        const canvas = canvasRefs.current[i];
        if (!canvas || cancelled) return;
        try {
          const page = await pdf.getPage(i + 1);
          if (cancelled) return;
          const vp = page.getViewport({ scale: zoom * dpr });
          canvas.width = Math.floor(vp.width);
          canvas.height = Math.floor(vp.height);
          canvas.style.width = `${Math.round(pageSizes[i].w * zoom)}px`;
          canvas.style.height = `${Math.round(pageSizes[i].h * zoom)}px`;
          const ctx = canvas.getContext("2d");
          if (!ctx || cancelled) return;
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
        } catch {
          if (!cancelled) return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pageSizes, zoom]);

  if (loading && pageSizes.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span className="text-sm">Loading original resume…</span>
      </div>
    );
  }

  const showHighlights = !isScanning && highlights.length > 0 && pageTextItems.length > 0;

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative flex flex-col items-center gap-8">
        {pageSizes.map((size, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            {pageSizes.length > 1 && (
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 select-none">
                Page {i + 1} of {pageSizes.length}
              </div>
            )}
            <div
              className="relative bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.65),0_2px_8px_rgba(0,0,0,0.2)] ring-1 ring-black/15"
              style={{ width: Math.round(size.w * zoom), height: Math.round(size.h * zoom) }}
            >
              <canvas ref={(el) => void (canvasRefs.current[i] = el)} />
              {focusAnchor?.page === i + 1 && (
                // Target 4.5 navigation anchor: invisible zero-height line at the
                // primary evidence rect's intrinsic Y × zoom, so it stays aligned
                // through any zoom change. Non-interactive and unfocusable.
                <div
                  id="evidence-focus-anchor"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 w-full h-px"
                  style={{ top: Math.round(focusAnchor.y * zoom) }}
                />
              )}
              {showHighlights && (
                <PdfIssueOverlay
                  highlights={highlights}
                  zoom={zoom}
                  selectedRequirementId={selectedRequirementId}
                  onSelectHighlight={onSelectIssue}
                />
              )}
              {geometryMap?.pages?.[i]?.blocks && (
                <PdfGeometryOverlay
                  pageIndex={i}
                  blocks={geometryMap.pages[i].blocks}
                  zoom={zoom}
                  selectedTargetId={selectedTargetId}
                  onSelectElement={onSelectElement}
                  onMutateBlock={onMutateBlock}
                />
              )}
            </div>
          </div>
        ))}
        <PdfScanOverlay active={isScanning && pageSizes.length > 0} pageCount={pageSizes.length} />
      </div>
    </div>
  );
}
