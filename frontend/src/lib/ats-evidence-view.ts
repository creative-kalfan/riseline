/**
 * Target 4.4 — Interactive ATS Evidence Intelligence (presentation model)
 *
 * Transforms `AtsAnalysisResult.requirement_coverage` into a UI-ready
 * presentation model for the interactive ATS evidence panel.
 *
 * This module is intentionally PURE:
 * - No React, no rendering, no network requests.
 * - No LLM calls — semantic reasoning remains a backend responsibility (Target 3).
 * - No coordinate math — location confidence comes ONLY from the existing
 *   EvidenceLocationMap produced by Target 4.2.
 * - No evidence invention — every displayed evidence string is copied verbatim
 *   from backend `resume_evidence` / `semantic_evidence` fields.
 */

import type { AtsAnalysisResult, AtsRequirementCoverage } from "@/api/ats";
import type {
  EvidenceLocationMap,
  EvidenceMatchConfidence,
  PdfTextRect,
} from "@/lib/evidence-location";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Presentation status. Backed entirely by the existing contract:
 * - matched / partial / missing come from `RequirementCoverage.status`
 * - weak preserves the frontend's existing distinction (Target 4.3 uses the
 *   same rule in `classifyHighlightStatus`): status=matched but
 *   evidence_level=weak
 * - unknown covers tolerating older persisted reports with no status fields
 */
export type AtsViewStatus = "matched" | "partial" | "weak" | "missing" | "unknown";

/** UI-facing recommendation tied back to an existing backend recommendation. */
export type AtsViewRecommendation = {
  /** Verbatim text from an existing ATS recommendation list. Never generated. */
  text: string;
  priority: "high" | "medium" | "low";
};

/** One interactive requirement card in the ATS intelligence panel. */
export type AtsRequirementView = {
  /** Requirement string — identical to EvidenceLocationMap keys and overlay requirementIds. */
  id: string;
  requirement: string;
  status: AtsViewStatus;
  /** Backend importance (critical/high/medium/low) where provided. */
  importance?: string;
  /** Job-side description from the JD parser (`job_evidence`). */
  jdRequirement?: string;
  /**
   * Verified resume evidence strings, verbatim from the reconciled architecture
   * (deterministic `resume_evidence` preferred, `semantic_evidence` fallback —
   * the same priority the Target 4.2 locator uses).
   */
  evidenceItems: string[];
  /** Resume section provenance (Target 4.1, e.g. `skills`, `experience[0]`). */
  evidenceSourceSection?: string;
  /** User-safe explanation (Target 4.1 reconciled explanation, semantic reasoning fallback). */
  explanation?: string;
  /**
   * Existing backend recommendation whose text mentions this requirement, when
   * one exists. Verbatim display only — never generated or paraphrased.
   */
  recommendation?: AtsViewRecommendation;
  semanticConfidence?: number;
  reasoningSource?: string;
};

// ---------------------------------------------------------------------------
// Status derivation
// ---------------------------------------------------------------------------

/**
 * Derive the presentation status from backend coverage fields using the SAME
 * precedence rules as the Target 4.3 highlight classifier, extended with a
 * presentation-only UNKNOWN state.
 */
export function deriveAtsViewStatus(
  cov: Pick<AtsRequirementCoverage, "status" | "evidence_level">,
): AtsViewStatus {
  const status = cov.status?.toLowerCase();
  const level = cov.evidence_level?.toLowerCase();

  if (status === "missing") return "missing";
  if (status === "partial") return "partial";
  if (status === "matched") {
    return level === "weak" ? "weak" : "matched";
  }

  // Status unavailable (older persisted report): fall back to evidence level.
  if (level === "weak") return "weak";
  if (level === "none") return "missing";
  if (level === "strong" || level === "moderate") return "matched";
  return "unknown";
}

// ---------------------------------------------------------------------------
// View building
// ---------------------------------------------------------------------------

function resolveEvidenceItems(cov: AtsRequirementCoverage): string[] {
  // Mirror of mapEvidenceToLocations' priority: deterministic evidence first,
  // semantic evidence fallback. Nothing else is ever invented here.
  if (cov.resume_evidence?.length) {
    return cov.resume_evidence.filter((e) => typeof e === "string" && e.trim().length > 0);
  }
  if (typeof cov.semantic_evidence === "string" && cov.semantic_evidence.trim()) {
    return [cov.semantic_evidence];
  }
  return [];
}

const IMPORTANCE_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_RANK: Record<AtsViewStatus, number> = {
  partial: 0,
  weak: 1,
  missing: 2,
  unknown: 3,
  matched: 4,
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find an existing analysis-level recommendation whose text mentions this
 * requirement (case-insensitive, word-boundary aware). Only displays backend
 * output verbatim — never generates wording.
 */
export function findRelatedRecommendation(
  analysis: AtsAnalysisResult,
  requirement: string,
): AtsViewRecommendation | undefined {
  const trimmed = requirement.trim();
  if (trimmed.length < 2) return undefined;

  const pattern = new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, "i");

  const groups: Array<[string[] | undefined, AtsViewRecommendation["priority"]]> = [
    [analysis.high_priority_recommendations, "high"],
    [analysis.medium_priority_recommendations, "medium"],
    [analysis.low_priority_recommendations, "low"],
  ];

  for (const [items, priority] of groups) {
    for (const item of items ?? []) {
      if (typeof item === "string" && pattern.test(item)) {
        return { text: item, priority };
      }
    }
  }
  return undefined;
}

/**
 * Build ordered requirement card models from an ATS analysis result.
 * Returns [] for null/absent analyses or empty coverage — never throws.
 */
export function buildAtsRequirementViews(
  analysis: AtsAnalysisResult | null | undefined,
): AtsRequirementView[] {
  const coverage = analysis?.requirement_coverage;
  if (!coverage?.length) return [];

  const views: AtsRequirementView[] = [];
  // Requirement text is the natural identity for an ATS coverage entry, but
  // the coverage list can contain repeated requirement strings (e.g. the JD
  // parser emitting the same canonical concept twice). De-duplicate by
  // requirement text so React keys derived from `id: requirement` stay unique.
  const seenRequirements = new Set<string>();
  for (const cov of coverage) {
    const requirement = cov.requirement?.trim();
    if (!requirement) continue;
    if (seenRequirements.has(requirement)) continue;
    seenRequirements.add(requirement);

    views.push({
      id: requirement,
      requirement,
      status: deriveAtsViewStatus(cov),
      importance: cov.importance || undefined,
      jdRequirement: cov.job_evidence || undefined,
      evidenceItems: resolveEvidenceItems(cov),
      evidenceSourceSection: cov.evidence_source_section || undefined,
      explanation: cov.evidence_explanation || cov.semantic_reasoning || undefined,
      recommendation: analysis ? findRelatedRecommendation(analysis, requirement) : undefined,
      semanticConfidence:
        typeof cov.semantic_confidence === "number" ? cov.semantic_confidence : undefined,
      reasoningSource: cov.reasoning_source || undefined,
    });
  }

  return orderAtsRequirementViews(views);
}

/**
 * Sort issues (non-matched) by importance first (critical → low), then status
 * severity; matched requirements keep their position last, alphabetically.
 */
export function orderAtsRequirementViews(views: AtsRequirementView[]): AtsRequirementView[] {
  return [...views].sort((a, b) => {
    const ia = IMPORTANCE_RANK[(a.importance ?? "").toLowerCase()] ?? 99;
    const ib = IMPORTANCE_RANK[(b.importance ?? "").toLowerCase()] ?? 99;
    if (ia !== ib) return ia - ib;
    const sa = STATUS_RANK[a.status];
    const sb = STATUS_RANK[b.status];
    if (sa !== sb) return sa - sb;
    return a.requirement.localeCompare(b.requirement);
  });
}

/** Split views into actionable issues and cleanly-matched requirements. */
export function splitAtsRequirementViews(views: AtsRequirementView[]): {
  issues: AtsRequirementView[];
  matched: AtsRequirementView[];
} {
  return {
    issues: views.filter((v) => v.status !== "matched"),
    matched: views.filter((v) => v.status === "matched"),
  };
}

/**
 * High-priority issues expand by default: importance critical/high. Matched
 * requirements never auto-expand.
 */
export function shouldExpandByDefault(view: AtsRequirementView): boolean {
  if (view.status === "matched") return false;
  const imp = (view.importance ?? "").toLowerCase();
  return imp === "critical" || imp === "high";
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/**
 * Single authoritative selection toggle. Clicking the selected requirement
 * clears the selection; clicking any other selects it.
 */
export function toggleRequirementSelection(
  selectedId: string | null | undefined,
  clickedId: string,
): string | null {
  return selectedId === clickedId ? null : clickedId;
}

/** Stable DOM id for a requirement card (used for PDF → panel focus). */
export function atsRequirementDomId(requirement: string): string {
  return `ats-req-${requirement
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

// ---------------------------------------------------------------------------
// Location confidence (Target 4.2 reuse — no recalculation)
// ---------------------------------------------------------------------------

/** Whether an EvidenceMatchConfidence can safely activate a PDF highlight. */
export function confidenceCanHighlight(
  confidence: EvidenceMatchConfidence | null | undefined,
): boolean {
  return confidence === "EXACT" || confidence === "NORMALIZED" || confidence === "MULTI_ITEM";
}

export type EvidenceLocationSummary = {
  confidence: EvidenceMatchConfidence | null;
  canHighlight: boolean;
  pages: number[];
};

/**
 * Summarize an EvidenceLocationMap entry for panel display. Read-only reuse of
 * the Target 4.2 map — page numbers are surfaced, never recomputed, and a
 * LOW_CONFIDENCE / NOT_FOUND / missing entry never reports a highlightable
 * location.
 */
export function resolveEvidenceLocationSummary(
  locations: EvidenceLocationMap | null | undefined,
  requirementId: string,
): EvidenceLocationSummary {
  const entry = locations?.get(requirementId);
  if (!entry?.location) {
    return { confidence: null, canHighlight: false, pages: [] };
  }

  const confidence = entry.location.confidence ?? null;
  if (!confidenceCanHighlight(confidence)) {
    return { confidence, canHighlight: false, pages: [] };
  }

  const pages = [
    ...new Set(entry.location.locations.filter((pl) => pl.rects.length > 0).map((pl) => pl.page)),
  ].sort((a, b) => a - b);

  if (pages.length === 0) {
    return { confidence, canHighlight: false, pages: [] };
  }

  return { confidence, canHighlight: true, pages };
}

// ---------------------------------------------------------------------------
// Navigation (Target 4.5)
// ---------------------------------------------------------------------------

/** Where the PDF should focus when a requirement is selected. */
export type EvidenceNavigationTarget = {
  /** 1-based PDF page number from the existing EvidenceLocationMap. */
  page: number;
  /**
   * Primary evidence rectangle in INTRINSIC (scale-1) coordinates, verbatim
   * from Target 4.2. The caller applies the existing zoom transformation.
   */
  rect: PdfTextRect;
};

/**
 * Resolve the automatic PDF navigation target for a selected requirement
 * using ONLY the existing EvidenceLocationMap (Target 4.2).
 *
 * Rules:
 * - First valid location wins as the primary focus (no repeated page jumping).
 * - Valid confidence: EXACT | NORMALIZED | MULTI_ITEM. LOW_CONFIDENCE,
 *   NOT_FOUND and absent locations never navigate — there is nothing to
 *   fabricate a focus for.
 * - With multiple rectangles, the first rectangle of the primary location is
 *   used; the overlay's individual rectangles remain untouched.
 * - Coordinates are returned unmodified (intrinsic). Zoom handling belongs to
 *   the renderer's existing display transformation, never here.
 */
export function resolveEvidenceNavigationTarget(
  locations: EvidenceLocationMap | null | undefined,
  requirementId: string | null | undefined,
): EvidenceNavigationTarget | null {
  if (!requirementId) return null;

  const loc = locations?.get(requirementId)?.location;
  if (!loc) return null;
  if (!confidenceCanHighlight(loc.confidence)) return null;

  for (const pl of loc.locations) {
    // A location entry without confident rects cannot justify navigation.
    if (!confidenceCanHighlight(pl.confidence)) continue;
    if (!pl.rects.length) continue;
    const rect = pl.rects[0];
    if (
      !rect ||
      typeof rect.x !== "number" ||
      typeof rect.y !== "number" ||
      typeof rect.width !== "number" ||
      typeof rect.height !== "number"
    ) {
      continue;
    }
    return { page: pl.page, rect };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Target 4.6 — score interpretation
// ---------------------------------------------------------------------------

export type AtsScoreTone = "positive" | "good" | "moderate" | "weak" | "low";

export type AtsScoreInterpretation = {
  /** Human-readable alignment band. Never implies hiring probability. */
  label: string;
  tone: AtsScoreTone;
};

/**
 * Interpret an ATS overall score as alignment with the SUPPLIED JOB
 * DESCRIPTION. These labels deliberately avoid claims about hiring
 * probability or automatic rejection — the score measures alignment only.
 */
export function interpretAtsScore(score: number | null | undefined): AtsScoreInterpretation {
  const s = typeof score === "number" && Number.isFinite(score) ? score : 0;
  if (s >= 85) return { label: "Strong alignment", tone: "positive" };
  if (s >= 70) return { label: "Good alignment with a few gaps", tone: "good" };
  if (s >= 50) {
    return { label: "Moderate alignment — several requirements need attention", tone: "moderate" };
  }
  if (s >= 30) {
    return { label: "Weak alignment — important requirements are missing", tone: "weak" };
  }
  return { label: "Low alignment — major gaps detected", tone: "low" };
}

// ---------------------------------------------------------------------------
// Target 4.6 — fresher-safe evidence terminology
// ---------------------------------------------------------------------------

/**
 * Accurate evidence-kind wording derived ONLY from the backend's existing
 * `evidence_source_section` provenance path. Project, academic,
 * certification, internship and achievement evidence keeps its own truthful
 * label — it is never mislabeled as professional employment, and valid
 * project evidence is never downgraded for being non-employment.
 */
export function classifyEvidenceKind(section: string | null | undefined): string | undefined {
  if (!section) return undefined;
  const base = (section.split("[")[0] ?? "").trim().toLowerCase();
  switch (base) {
    case "experience":
      return "Professional experience";
    case "internships":
      return "Internship evidence";
    case "projects":
      return "Project evidence";
    case "education":
      return "Academic evidence";
    case "certifications":
      return "Certification evidence";
    case "achievements":
      return "Achievement evidence";
    default:
      return "Resume evidence";
  }
}

// ---------------------------------------------------------------------------
// Target 4.6 — actionable issue hierarchy
// ---------------------------------------------------------------------------

export type AtsIssueTier = "critical" | "high" | "medium" | "low";

/**
 * Tier an actionable (non-matched) requirement using ONLY backend importance
 * and status. Missing high-importance requirements are treated as critical;
 * missing medium-importance requirements stay high so they surface early.
 * Nothing is invented: unknown importance degrades gracefully to medium.
 */
export function issueTier(view: AtsRequirementView): AtsIssueTier {
  const imp = (view.importance ?? "").toLowerCase();
  if (imp === "critical") return "critical";
  if (imp === "high") return view.status === "missing" ? "critical" : "high";
  if (imp === "low") return "low";
  if (view.status === "missing" && imp === "medium") return "high";
  return "medium";
}

const TIER_RANK: Record<AtsIssueTier, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/** Issues grouped into the prioritized display tiers, each tier pre-sorted. */
export function groupAtsIssuesByPriority(
  views: AtsRequirementView[],
): Record<AtsIssueTier, AtsRequirementView[]> {
  const groups: Record<AtsIssueTier, AtsRequirementView[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };
  for (const view of views) {
    if (view.status === "matched") continue; // strengths handled separately
    groups[issueTier(view)].push(view);
  }
  return groups;
}

const MAX_STRENGTHS = 6;

/**
 * Meaningful matched requirements for the Strengths section: low-importance
 * keyword noise is deprioritized, and the list is capped so the UI is not
 * flooded with every matched item.
 */
export function pickStrengths(
  views: AtsRequirementView[],
  max: number = MAX_STRENGTHS,
): AtsRequirementView[] {
  return views
    .filter((v) => v.status === "matched")
    .filter((v) => (v.importance ?? "").toLowerCase() !== "low")
    .slice(0, max);
}

/** Non-empty issue tiers in display order (critical → low). */
export function orderedNonEmptyIssueTiers(
  groups: Record<AtsIssueTier, AtsRequirementView[]>,
): Array<{ tier: AtsIssueTier; views: AtsRequirementView[] }> {
  return (Object.keys(TIER_RANK) as AtsIssueTier[])
    .map((tier) => ({ tier, views: groups[tier] }))
    .filter((g) => g.views.length > 0);
}

// ---------------------------------------------------------------------------
// Target 4.6 — real-data summaries (nothing hardcoded)
// ---------------------------------------------------------------------------

const IMPORTANT_IMPORTANCES = new Set(["critical", "high", "medium"]);

export type AtsCoverageSummary = {
  /** Total structured requirements detected by the backend. */
  total: number;
  /** Requirements whose backend importance is critical/high/medium. */
  importantTotal: number;
  /** Important requirements with matched or partial evidence. */
  importantAddressed: number;
};

/**
 * Coverage counts computed ONLY from requirement_coverage-derived views.
 * Every number shown in the panel originates here from real backend data —
 * no static count strings exist anywhere in the UI.
 */
export function summarizeRequirementCoverage(views: AtsRequirementView[]): AtsCoverageSummary {
  const important = views.filter((v) =>
    IMPORTANT_IMPORTANCES.has((v.importance ?? "").toLowerCase()),
  );
  const importantTotal = important.length;
  const importantAddressed = important.filter(
    (v) => v.status === "matched" || v.status === "partial",
  ).length;
  return { total: views.length, importantTotal, importantAddressed };
}

// ---------------------------------------------------------------------------
// Target 4.6 — recommendation mapping integrity
// ---------------------------------------------------------------------------

export type GeneralRecommendation = {
  text: string;
  priority: "high" | "medium" | "low" | "general";
};

/**
 * Recommendations NOT confidently attachable to any single requirement.
 * Attached recommendations are consumed by their issue cards; everything else
 * stays in the general list rather than being falsely tied to a requirement.
 * Input ordering/priority comes verbatim from the existing backend lists.
 */
export function partitionRecommendations(
  analysis: AtsAnalysisResult | null | undefined,
  views: AtsRequirementView[],
): { general: GeneralRecommendation[] } {
  if (!analysis) return { general: [] };

  const attached = new Set<string>();
  for (const v of views) {
    if (v.recommendation?.text) attached.add(v.recommendation.text);
  }

  const general: GeneralRecommendation[] = [];
  const seen = new Set<string>();
  const push = (text: string, priority: GeneralRecommendation["priority"]) => {
    if (!text || attached.has(text) || seen.has(text)) return;
    seen.add(text);
    general.push({ text, priority });
  };

  for (const r of analysis.high_priority_recommendations ?? []) push(r, "high");
  for (const r of analysis.medium_priority_recommendations ?? []) push(r, "medium");
  for (const r of analysis.low_priority_recommendations ?? []) push(r, "low");
  // Legacy unprioritized list: kept as "general", never assigned a false priority.
  for (const r of analysis.recommendations ?? []) push(r, "general");

  return { general };
}

// ---------------------------------------------------------------------------
// Target 4.6 — analysis lifecycle state
// ---------------------------------------------------------------------------

export type AtsPanelState =
  | { kind: "no-job-context" }
  | { kind: "analyzing"; target?: string }
  | { kind: "failed"; message: string }
  | { kind: "complete"; hasRequirements: boolean };

/**
 * Single authoritative lifecycle state for the ATS Intelligence section,
 * derived from existing route state only. No new flags, no duplication.
 */
export function resolveAtsPanelState(input: {
  hasJobContext: boolean;
  isAnalyzing?: boolean;
  error?: string | null;
  hasAnalysis?: boolean;
  hasRequirements?: boolean;
}): AtsPanelState {
  if (input.isAnalyzing) {
    return { kind: "analyzing" }; // target label supplied separately by caller props
  }
  if (input.error) {
    return { kind: "failed", message: input.error };
  }
  if (input.hasJobContext && input.hasAnalysis) {
    return { kind: "complete", hasRequirements: Boolean(input.hasRequirements) };
  }
  if (input.hasAnalysis) {
    // Persisted analysis exists but no current job context is set.
    return { kind: "no-job-context" };
  }
  return { kind: "no-job-context" };
}
