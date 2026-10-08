/**
 * Target 4.2 — ATS Evidence → Exact PDF Location Mapping
 *
 * Maps verified ATS evidence strings to exact text items and bounding
 * rectangles in the original uploaded PDF. Operates purely against
 * PDF.js text layer data; no LLM calls, no coordinate guessing.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single bounding rectangle in intrinsic (scale-1) PDF page coordinates. */
export type PdfTextRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Confidence classification for an evidence→PDF location match. */
export type EvidenceMatchConfidence =
  "EXACT" | "NORMALIZED" | "MULTI_ITEM" | "LOW_CONFIDENCE" | "NOT_FOUND";

/** Location of a single evidence string on a single PDF page. */
export type EvidencePageLocation = {
  page: number;
  rects: PdfTextRect[];
  confidence: EvidenceMatchConfidence;
  matchedText: string;
};

/** Full location result for an evidence string across all pages. */
export type EvidenceLocation = {
  locations: EvidencePageLocation[];
  confidence: EvidenceMatchConfidence;
  reason?: string;
};

/**
 * Per-requirement location result. Maps a single ATS requirement's
 * verified evidence to PDF page locations.
 */
export type RequirementEvidenceLocation = {
  requirement: string;
  evidence: string;
  location: EvidenceLocation;
};

/**
 * Complete mapping from all ATS requirements to their PDF locations.
 * Key = requirement string, Value = location result.
 */
export type EvidenceLocationMap = Map<string, RequirementEvidenceLocation>;

/** Raw PDF text item with both original and normalized text. */
export type PdfTextItemRaw = {
  original: string;
  norm: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Page dimensions in intrinsic (scale-1) coordinates. */
export type PageSize = { w: number; h: number };

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize text for matching: lowercase, collapse whitespace, trim.
 * Preserves word boundaries (unlike the more aggressive stripNonAlpha).
 */
export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Aggressively normalize: lowercase, strip all non-alphanumeric, no spaces.
 * Used for matching across PDF spacing inconsistencies.
 */
export function stripNonAlpha(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ---------------------------------------------------------------------------
// Position mapping
// ---------------------------------------------------------------------------

type TokenPosition = {
  start: number;
  end: number;
  index: number;
};

/**
 * Build a mapping from character positions in a space-joined normalized text
 * to the original token indices. Each token's range in the joined text is
 * [start, end) where start accounts for preceding tokens + spaces.
 */
export function buildTokenPositions(normTokens: string[]): TokenPosition[] {
  const positions: TokenPosition[] = [];
  let offset = 0;
  for (let i = 0; i < normTokens.length; i++) {
    const len = normTokens[i].length;
    positions.push({ start: offset, end: offset + len, index: i });
    offset += len + 1; // +1 for the space separator
  }
  return positions;
}

/**
 * Map a character range [start, end) in the joined normalized text back to
 * the overlapping PDF text item indices.
 */
export function mapCharRangeToTokenIndices(
  positions: TokenPosition[],
  start: number,
  end: number,
): number[] {
  const indices: number[] = [];
  for (const pos of positions) {
    if (pos.end > start && pos.start < end) {
      indices.push(pos.index);
    }
  }
  return indices;
}

// ---------------------------------------------------------------------------
// Bounding rectangle computation
// ---------------------------------------------------------------------------

/** Minimum dimension constraints for highlight rectangles (intrinsic px). */
const MIN_HEIGHT = 8;
const PAD_LEFT = 1;
const PAD_TOP = 2;
const PAD_RIGHT = 2;
const PAD_BOTTOM = 4;

/**
 * Compute the union bounding rectangle of a set of PDF text items.
 * Applies slight padding for visual legibility.
 * Returns null if no valid items (w > 0, h > 0) are provided.
 */
export function computeUnionRect(items: PdfTextItemRaw[]): PdfTextRect | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;

  for (const it of items) {
    if (it.w <= 0 || it.h <= 0) continue;
    any = true;
    minX = Math.min(minX, it.x);
    minY = Math.min(minY, it.y);
    maxX = Math.max(maxX, it.x + it.w);
    maxY = Math.max(maxY, it.y + it.h);
  }

  if (!any) return null;

  return {
    x: minX - PAD_LEFT,
    y: minY - PAD_TOP,
    width: maxX - minX + PAD_LEFT + PAD_RIGHT,
    height: Math.max(maxY - minY, MIN_HEIGHT) + PAD_BOTTOM,
  };
}

// ---------------------------------------------------------------------------
// Core matching algorithm
// ---------------------------------------------------------------------------

/**
 * Find the location of an evidence string within a single page's PDF text items.
 *
 * Matching strategy (in order):
 * 1. Exact: case-insensitive substring match in space-joined normalized text.
 * 2. Normalized: aggressive strip-non-alphanumeric match for PDF spacing issues.
 *
 * Returns null with a reason if the evidence cannot be confidently located.
 * Never fabricates coordinates.
 */
export function findEvidenceLocationOnPage(
  evidence: string,
  pageItems: PdfTextItemRaw[],
  pageNumber: number,
): EvidencePageLocation | null {
  if (!evidence || !pageItems.length) return null;

  const normEvidence = normalizeText(evidence);
  if (!normEvidence) return null;

  // Build normalized tokens and position mapping
  const normTokens = pageItems.map((p) => p.norm);
  const joined = normTokens.join(" ");
  const positions = buildTokenPositions(normTokens);

  // --- Pass 1: Exact match (case-insensitive, whitespace-normalized) ---
  const exactStart = joined.indexOf(normEvidence);
  if (exactStart !== -1) {
    const exactEnd = exactStart + normEvidence.length;
    const tokenIndices = mapCharRangeToTokenIndices(positions, exactStart, exactEnd);

    if (tokenIndices.length > 0) {
      const matchedItems = tokenIndices.map((i) => pageItems[i]);
      const rect = computeUnionRect(matchedItems);
      if (rect) {
        return {
          page: pageNumber,
          rects: [rect],
          confidence: tokenIndices.length === 1 ? "EXACT" : "MULTI_ITEM",
          matchedText: matchedItems.map((i) => i.original).join(" "),
        };
      }
    }
  }

  // --- Pass 2: Normalized match (aggressive, handles PDF spacing issues) ---
  const strippedEvidence = stripNonAlpha(evidence);
  if (!strippedEvidence) return null;

  const strippedJoined = stripNonAlpha(joined);
  const strippedStart = strippedJoined.indexOf(strippedEvidence);
  if (strippedStart === -1) return null;

  const strippedEnd = strippedStart + strippedEvidence.length;

  // Map stripped positions back to token indices by scanning through
  // the original norm tokens and tracking stripped character offsets.
  const tokenIndices: number[] = [];
  let strippedOffset = 0;
  for (let i = 0; i < normTokens.length; i++) {
    const tokenStrippedLen = stripNonAlpha(normTokens[i]).length;
    const tokenStrippedStart = strippedOffset;
    const tokenStrippedEnd = strippedOffset + tokenStrippedLen;

    if (tokenStrippedEnd > strippedStart && tokenStrippedStart < strippedEnd) {
      tokenIndices.push(i);
    }
    strippedOffset = tokenStrippedEnd;
  }

  if (tokenIndices.length === 0) return null;

  const matchedItems = tokenIndices.map((i) => pageItems[i]);
  const rect = computeUnionRect(matchedItems);
  if (!rect) return null;

  // Reject LOW_CONFIDENCE: if the normalized match covers very few characters
  // relative to the evidence, it's likely a false positive.
  const matchLength = strippedEnd - strippedStart;
  if (matchLength < strippedEvidence.length * 0.5) {
    return null;
  }

  return {
    page: pageNumber,
    rects: [rect],
    confidence: tokenIndices.length === 1 ? "NORMALIZED" : "MULTI_ITEM",
    matchedText: matchedItems.map((i) => i.original).join(" "),
  };
}

/**
 * Find the location of an evidence string across all pages of a PDF.
 *
 * Searches each page independently. Returns all pages where the evidence
 * is found. If evidence spans multiple pages, each page gets its own entry.
 *
 * Returns a location with confidence NOT_FOUND if the evidence cannot be
 * located on any page.
 */
export function findEvidenceLocation(
  evidence: string,
  allPageItems: PdfTextItemRaw[][],
): EvidenceLocation {
  if (!evidence || !allPageItems.length) {
    return {
      locations: [],
      confidence: "NOT_FOUND",
      reason: "No evidence text or no PDF pages available.",
    };
  }

  const locations: EvidencePageLocation[] = [];
  let highestConfidence: EvidenceMatchConfidence = "NOT_FOUND";

  const confidenceRank: Record<EvidenceMatchConfidence, number> = {
    EXACT: 4,
    NORMALIZED: 3,
    MULTI_ITEM: 2,
    LOW_CONFIDENCE: 1,
    NOT_FOUND: 0,
  };

  for (let pageIdx = 0; pageIdx < allPageItems.length; pageIdx++) {
    const pageItems = allPageItems[pageIdx];
    if (!pageItems.length) continue;

    const result = findEvidenceLocationOnPage(evidence, pageItems, pageIdx + 1);
    if (result) {
      locations.push(result);
      if (confidenceRank[result.confidence] > confidenceRank[highestConfidence]) {
        highestConfidence = result.confidence;
      }
    }
  }

  if (locations.length === 0) {
    return {
      locations: [],
      confidence: "NOT_FOUND",
      reason: "Evidence text could not be confidently located in PDF text layer.",
    };
  }

  return {
    locations,
    confidence: highestConfidence,
  };
}

// ---------------------------------------------------------------------------
// Batch mapping
// ---------------------------------------------------------------------------

/**
 * Map all ATS requirement coverage entries to PDF page locations.
 *
 * For each requirement with verified evidence, attempts to locate the
 * evidence text in the PDF.js text layer. Requirements with no evidence
 * or unlocatable evidence receive NOT_FOUND with no coordinates.
 *
 * @param requirements - ATS requirement coverage entries
 * @param allPageItems - PDF text items per page (from PDF.js getTextContent)
 * @returns Map from requirement string to its location result
 */
export function mapEvidenceToLocations(
  requirements: Array<{
    requirement: string;
    resume_evidence?: string[];
    semantic_evidence?: string;
    evidence_level?: string;
  }>,
  allPageItems: PdfTextItemRaw[][],
): EvidenceLocationMap {
  const result: EvidenceLocationMap = new Map();

  for (const req of requirements) {
    if (!req.requirement) continue;

    // Prefer deterministic resume_evidence; fall back to semantic_evidence
    const evidenceStrings = req.resume_evidence?.length
      ? req.resume_evidence
      : req.semantic_evidence
        ? [req.semantic_evidence]
        : [];

    // Skip requirements with no evidence to locate
    if (evidenceStrings.length === 0) {
      result.set(req.requirement, {
        requirement: req.requirement,
        evidence: "",
        location: {
          locations: [],
          confidence: "NOT_FOUND",
          reason: "No resume evidence available for this requirement.",
        },
      });
      continue;
    }

    // Locate each evidence string; use the best match
    let bestLocation: EvidenceLocation | null = null;
    let bestEvidence = "";

    const confidenceRank: Record<EvidenceMatchConfidence, number> = {
      EXACT: 4,
      NORMALIZED: 3,
      MULTI_ITEM: 2,
      LOW_CONFIDENCE: 1,
      NOT_FOUND: 0,
    };

    for (const evidence of evidenceStrings) {
      const loc = findEvidenceLocation(evidence, allPageItems);

      if (
        !bestLocation ||
        confidenceRank[loc.confidence] > confidenceRank[bestLocation.confidence]
      ) {
        bestLocation = loc;
        bestEvidence = evidence;
      }

      // Early exit on perfect match
      if (loc.confidence === "EXACT") break;
    }

    result.set(req.requirement, {
      requirement: req.requirement,
      evidence: bestEvidence,
      location: bestLocation!,
    });
  }

  return result;
}
