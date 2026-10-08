/**
 * Target 4.4 — Interactive ATS Evidence Intelligence Tests
 *
 * Follows the repo's established vitest convention: pure-function,
 * data-transformation tests (no browser, no React rendering). Covers status
 * derivation, verified-evidence propagation, selection toggling, location
 * confidence gating, and the three-state highlight styling classifier.
 */
import { describe, it, expect } from "vitest";
import type { AtsAnalysisResult, AtsRequirementCoverage } from "@/api/ats";
import {
  buildAtsRequirementViews,
  classifyEvidenceKind,
  confidenceCanHighlight,
  deriveAtsViewStatus,
  groupAtsIssuesByPriority,
  interpretAtsScore,
  orderAtsRequirementViews,
  orderedNonEmptyIssueTiers,
  partitionRecommendations,
  pickStrengths,
  resolveAtsPanelState,
  resolveEvidenceLocationSummary,
  resolveEvidenceNavigationTarget,
  shouldExpandByDefault,
  splitAtsRequirementViews,
  summarizeRequirementCoverage,
  toggleRequirementSelection,
  atsRequirementDomId,
} from "@/lib/ats-evidence-view";
import {
  pdfIssueToPageHighlights,
  evidenceHighlightClassName,
} from "@/components/resume/pdf-issue-overlay";
import type { EvidenceLocationMap } from "@/lib/evidence-location";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const cov = (overrides: AtsRequirementCoverage): AtsRequirementCoverage => overrides;

function analysisWith(coverage: AtsRequirementCoverage[]): AtsAnalysisResult {
  return {
    overall_score: 70,
    keyword_match_score: 70,
    skills_match_score: 70,
    experience_relevance_score: 70,
    qualification_match_score: 70,
    structure_format_score: 70,
    recommendations: [],
    requirement_coverage: coverage,
  };
}

function makeLocationMap(
  entries: Array<{
    requirement: string;
    evidence: string;
    confidence?: string;
    pageLocations?: Array<{
      page: number;
      rects: Array<{ x: number; y: number; width: number; height: number }>;
    }>;
  }>,
): EvidenceLocationMap {
  const map = new Map();
  for (const e of entries) {
    const confidence = (e.confidence ?? "EXACT") as
      "EXACT" | "NORMALIZED" | "MULTI_ITEM" | "LOW_CONFIDENCE" | "NOT_FOUND";
    map.set(e.requirement, {
      requirement: e.requirement,
      evidence: e.evidence,
      location: {
        locations: (e.pageLocations ?? []).map((pl) => ({
          page: pl.page,
          rects: pl.rects,
          confidence,
          matchedText: e.evidence,
        })),
        confidence,
      },
    });
  }
  return map;
}

// ---------------------------------------------------------------------------
// Status derivation
// ---------------------------------------------------------------------------
describe("deriveAtsViewStatus", () => {
  it("renders matched state (scenario 1)", () => {
    expect(deriveAtsViewStatus({ status: "matched", evidence_level: "strong" })).toBe("matched");
    expect(deriveAtsViewStatus({ status: "matched" })).toBe("matched");
  });

  it("preserves the existing weak-evidence distinction", () => {
    expect(deriveAtsViewStatus({ status: "matched", evidence_level: "weak" })).toBe("weak");
    expect(deriveAtsViewStatus({ evidence_level: "weak" })).toBe("weak");
  });

  it("renders partial and missing from backend contract", () => {
    expect(deriveAtsViewStatus({ status: "partial" })).toBe("partial");
    expect(deriveAtsViewStatus({ status: "missing" })).toBe("missing");
  });

  it("falls back to unknown when no backend signals exist", () => {
    expect(deriveAtsViewStatus({})).toBe("unknown");
  });
});

// ---------------------------------------------------------------------------
// View building
// ---------------------------------------------------------------------------
describe("buildAtsRequirementViews", () => {
  it("partial requirement exposes verified evidence (scenario 2)", () => {
    const views = buildAtsRequirementViews(
      analysisWith([
        cov({
          requirement: "Remote User Support",
          status: "partial",
          importance: "high",
          job_evidence: "Experience supporting remote users",
          resume_evidence: ["Provided remote user support to distributed teams"],
          evidence_source_section: "experience[0]",
          evidence_explanation: "Resume demonstrates remote support without tools.",
        }),
      ]),
    );
    expect(views).toHaveLength(1);
    const v = views[0];
    expect(v.status).toBe("partial");
    expect(v.evidenceItems).toEqual(["Provided remote user support to distributed teams"]);
    expect(v.jdRequirement).toBe("Experience supporting remote users");
    expect(v.importance).toBe("high");
  });

  it("prefers deterministic resume_evidence over semantic_evidence", () => {
    const [v] = buildAtsRequirementViews(
      analysisWith([
        cov({
          requirement: "ServiceNow",
          resume_evidence: ["Managed ServiceNow tickets"],
          semantic_evidence: "used ServiceNow",
        }),
      ]),
    );
    expect(v.evidenceItems).toEqual(["Managed ServiceNow tickets"]);
  });

  it("weak requirement keeps its verified evidence visible (scenario 3)", () => {
    const views = buildAtsRequirementViews(
      analysisWith([
        cov({
          requirement: "SQL",
          status: "matched",
          evidence_level: "weak",
          resume_evidence: ["wrote basic SQL queries"],
        }),
      ]),
    );
    expect(views[0].status).toBe("weak");
    expect(views[0].evidenceItems).toEqual(["wrote basic SQL queries"]);
  });

  it("missing requirement renders no evidence — never fabricated (scenarios 4, 16)", () => {
    const views = buildAtsRequirementViews(
      analysisWith([
        cov({
          requirement: "Kubernetes Administration",
          status: "missing",
          semantic_reasoning: "No Kubernetes experience found in the resume.",
        }),
      ]),
    );
    expect(views[0].status).toBe("missing");
    expect(views[0].evidenceItems).toEqual([]);
    // Explanations are allowed; evidence never is.
    expect(views[0].explanation).toContain("No Kubernetes experience");
  });

  it("renders explanation, source section, and reasoning provenance (scenarios 13, 14)", () => {
    const views = buildAtsRequirementViews(
      analysisWith([
        cov({
          requirement: "Service Desk Management",
          status: "partial",
          evidence_source_section: "experience[0]",
          evidence_explanation:
            "Resume demonstrates technical support but does not explicitly establish Service Desk Management.",
          semantic_confidence: 0.8,
          reasoning_source: "LLM",
        }),
      ]),
    );
    expect(views[0].evidenceSourceSection).toBe("experience[0]");
    expect(views[0].explanation).toContain("Service Desk Management");
    expect(views[0].reasoningSource).toBe("LLM");
    expect(views[0].semanticConfidence).toBe(0.8);
  });

  it("attaches existing recommendations only — never generates wording (scenario 15)", () => {
    const analysis: AtsAnalysisResult = {
      ...analysisWith([cov({ requirement: "Service Desk Management", status: "partial" })]),
      high_priority_recommendations: [
        "Consider clarifying the Service Desk Management responsibilities you performed.",
      ],
    };
    const [v] = buildAtsRequirementViews(analysis);
    expect(v.recommendation).toEqual({
      text: "Consider clarifying the Service Desk Management responsibilities you performed.",
      priority: "high",
    });
  });

  it("does not attach recommendations when none mention the requirement", () => {
    const analysis: AtsAnalysisResult = {
      ...analysisWith([cov({ requirement: "Ruby on Rails", status: "missing" })]),
      medium_priority_recommendations: ["Add measurable outcomes to your experience bullets."],
    };
    const [v] = buildAtsRequirementViews(analysis);
    expect(v.recommendation).toBeUndefined();
  });

  it("orders issues by importance then severity, matched last", () => {
    const views = buildAtsRequirementViews(
      analysisWith([
        cov({ requirement: "Low importance partial", status: "partial", importance: "low" }),
        cov({ requirement: "High missing", status: "missing", importance: "high" }),
        cov({ requirement: "High partial", status: "partial", importance: "high" }),
        cov({ requirement: "Fine Matched", status: "matched" }),
      ]),
    );
    expect(orderAtsRequirementViews(views).map((v) => v.requirement)).toEqual([
      "High partial",
      "High missing",
      "Low importance partial",
      "Fine Matched",
    ]);
  });

  it("groups into issues and matched", () => {
    const { issues, matched } = splitAtsRequirementViews(
      buildAtsRequirementViews(
        analysisWith([
          cov({ requirement: "A", status: "partial" }),
          cov({ requirement: "B", status: "matched" }),
        ]),
      ),
    );
    expect(issues.map((v) => v.id)).toEqual(["A"]);
    expect(matched.map((v) => v.id)).toEqual(["B"]);
  });

  it("default-expands only high-priority issues; matched stays collapsed", () => {
    const [high, low, ok] = buildAtsRequirementViews(
      analysisWith([
        cov({ requirement: "Critical Gap", status: "missing", importance: "critical" }),
        cov({ requirement: "Minor Gap", status: "missing", importance: "low" }),
        cov({ requirement: "Solid Skill", status: "matched" }),
      ]),
    );
    expect(shouldExpandByDefault(high)).toBe(true);
    expect(shouldExpandByDefault(low)).toBe(false);
    expect(shouldExpandByDefault(ok)).toBe(false);
  });

  it("empty coverage renders safely (scenario 17)", () => {
    expect(buildAtsRequirementViews(analysisWith([]))).toEqual([]);
    const emptyCoverage = analysisWith([]);
    delete emptyCoverage.requirement_coverage;
    expect(buildAtsRequirementViews(emptyCoverage)).toEqual([]);
  });

  it("absent ATS results render safely (scenario 18)", () => {
    expect(buildAtsRequirementViews(null)).toEqual([]);
    expect(buildAtsRequirementViews(undefined)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Selection state
// ---------------------------------------------------------------------------
describe("toggleRequirementSelection", () => {
  it("selects a new requirement (scenario 6)", () => {
    expect(toggleRequirementSelection(null, "Python")).toBe("Python");
    expect(toggleRequirementSelection("Java", "Python")).toBe("Python");
  });

  it("deselects when the selected requirement is clicked again", () => {
    expect(toggleRequirementSelection("Python", "Python")).toBeNull();
  });
});

describe("atsRequirementDomId", () => {
  it("produces stable, DOM-safe ids for PDF → panel focus", () => {
    expect(atsRequirementDomId("Verbal & Written Communication")).toBe(
      "ats-req-verbal-written-communication",
    );
    expect(atsRequirementDomId("Service Desk Management")).toBe(
      atsRequirementDomId("Service Desk Management"),
    );
  });
});

// ---------------------------------------------------------------------------
// Location confidence gating (Target 4.2 reuse)
// ---------------------------------------------------------------------------
describe("resolveEvidenceLocationSummary", () => {
  const map = makeLocationMap([
    {
      requirement: "ServiceNow",
      evidence: "Managed ServiceNow tickets",
      confidence: "EXACT",
      pageLocations: [
        { page: 1, rects: [{ x: 10, y: 20, width: 50, height: 12 }] },
        { page: 2, rects: [{ x: 15, y: 30, width: 40, height: 12 }] },
      ],
    },
    { requirement: "Rust", evidence: "", confidence: "NOT_FOUND" },
    {
      requirement: "Go",
      evidence: "built services with Go",
      confidence: "LOW_CONFIDENCE",
      pageLocations: [{ page: 3, rects: [{ x: 5, y: 5, width: 10, height: 10 }] }],
    },
  ]);

  it("multiple evidence locations surface all pages (scenario 10)", () => {
    const s = resolveEvidenceLocationSummary(map, "ServiceNow");
    expect(s.canHighlight).toBe(true);
    expect(s.pages).toEqual([1, 2]);
    expect(s.confidence).toBe("EXACT");
  });

  it("NOT_FOUND evidence never highlights (scenarios 11, 5)", () => {
    const s = resolveEvidenceLocationSummary(map, "Rust");
    expect(s.canHighlight).toBe(false);
    expect(s.pages).toEqual([]);
  });

  it("LOW_CONFIDENCE evidence never highlights (scenario 12)", () => {
    const s = resolveEvidenceLocationSummary(map, "Go");
    expect(s.canHighlight).toBe(false);
    expect(s.pages).toEqual([]);
    // The panel can still display the evidence text itself.
    expect(s.confidence).toBe("LOW_CONFIDENCE");
  });

  it("unknown requirement and null maps are safe (scenarios 17, 18)", () => {
    expect(resolveEvidenceLocationSummary(map, "Missing Key").canHighlight).toBe(false);
    expect(resolveEvidenceLocationSummary(null, "Anything")).toEqual({
      confidence: null,
      canHighlight: false,
      pages: [],
    });
  });

  it("confidenceCanHighlight matches the Target 4.2 contract", () => {
    expect(confidenceCanHighlight("EXACT")).toBe(true);
    expect(confidenceCanHighlight("NORMALIZED")).toBe(true);
    expect(confidenceCanHighlight("MULTI_ITEM")).toBe(true);
    expect(confidenceCanHighlight("LOW_CONFIDENCE")).toBe(false);
    expect(confidenceCanHighlight("NOT_FOUND")).toBe(false);
    expect(confidenceCanHighlight(null)).toBe(false);
  });

  it("selected requirement maps to the correct PDF evidence (scenario 7)", () => {
    const covList = [
      cov({ requirement: "ServiceNow", status: "partial" }),
      cov({ requirement: "Java", status: "matched" }),
    ];
    const map = makeLocationMap([
      {
        requirement: "ServiceNow",
        evidence: "ServiceNow ticketing system",
        pageLocations: [{ page: 1, rects: [{ x: 100, y: 200, width: 80, height: 12 }] }],
      },
      {
        requirement: "Java",
        evidence: "Java development",
        pageLocations: [{ page: 2, rects: [{ x: 20, y: 60, width: 40, height: 12 }] }],
      },
    ]);
    const summary = resolveEvidenceLocationSummary(map, "ServiceNow");
    expect(summary.canHighlight).toBe(true);
    expect(summary.pages).toEqual([1]);
    const highlights = pdfIssueToPageHighlights(map, covList);
    const serviceNow = highlights.find((h) => h.requirementId === "ServiceNow");
    expect(serviceNow?.evidence).toBe("ServiceNow ticketing system");
    expect(serviceNow?.locations[0].page).toBe(1);
  });

  it("missing requirements produce no PDF highlight through the overlay pipeline (scenario 5)", () => {
    const map = makeLocationMap([
      { requirement: "Kubernetes", evidence: "", confidence: "NOT_FOUND" },
    ]);
    const coverage = [cov({ requirement: "Kubernetes", status: "missing" })];
    expect(pdfIssueToPageHighlights(map, coverage)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Highlight visual states
// ---------------------------------------------------------------------------
describe("evidenceHighlightClassName", () => {
  const status = "partial" as const;

  it("selected highlight is prominent: stronger border + subtle glow (scenario 9)", () => {
    const selected = evidenceHighlightClassName(status, true, true);
    const baseline = evidenceHighlightClassName(status, false, false);
    expect(selected).not.toBe(baseline);
    // 2px ring marks the glow; base styles are elevated.
    expect(selected).toContain("shadow-[0_0_0_2px");
  });

  it("non-selected highlights become subdued while a selection exists (scenario 8)", () => {
    const baseline = evidenceHighlightClassName(status, false, false);
    const dimmed = evidenceHighlightClassName(status, false, true);
    expect(dimmed).not.toBe(baseline);
    // Dimmed highlights stay visible (border preserved) but restrained:
    // no hover affordance while another issue owns attention.
    expect(dimmed).not.toContain("hover:");
    expect(baseline).toContain("hover:");
  });

  it("every status has distinct selected / dimmed / baseline treatments", () => {
    for (const s of ["matched", "partial", "weak"] as const) {
      const base = evidenceHighlightClassName(s, false, false);
      const dim = evidenceHighlightClassName(s, false, true);
      const sel = evidenceHighlightClassName(s, true, true);
      expect(base).toBeTruthy();
      expect(dim).toBeTruthy();
      expect(sel).toBeTruthy();
      expect(new Set([base, dim, sel]).size).toBe(3);
    }
  });
});

// ---------------------------------------------------------------------------
// Fresher safety / evidence integrity
// ---------------------------------------------------------------------------
describe("evidence integrity", () => {
  it("blank evidence strings are dropped instead of displayed as fake evidence", () => {
    const views = buildAtsRequirementViews(
      analysisWith([
        cov({ requirement: "Docker", status: "partial", resume_evidence: ["", "   "] }),
      ]),
    );
    expect(views[0].evidenceItems).toEqual([]);
  });

  it("view ids match EvidenceLocationMap keys so selection links panel ↔ PDF", () => {
    const requirement = "Remote User Support";
    const [v] = buildAtsRequirementViews(analysisWith([cov({ requirement, status: "partial" })]));
    expect(v.id).toBe(requirement);
    const map = makeLocationMap([
      {
        requirement,
        evidence: "supporting remote users",
        pageLocations: [{ page: 1, rects: [{ x: 1, y: 2, width: 3, height: 4 }] }],
      },
    ]);
    expect(map.has(v.id)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Target 4.5 — evidence navigation targets
// ---------------------------------------------------------------------------
describe("resolveEvidenceNavigationTarget", () => {
  it("EXACT location navigates to the correct page and rect (scenario 1)", () => {
    const map = makeLocationMap([
      {
        requirement: "Python",
        evidence: "Python development",
        confidence: "EXACT",
        pageLocations: [{ page: 2, rects: [{ x: 72, y: 140, width: 96, height: 11 }] }],
      },
    ]);
    expect(resolveEvidenceNavigationTarget(map, "Python")).toEqual({
      page: 2,
      rect: { x: 72, y: 140, width: 96, height: 11 },
    });
  });

  it("NORMALIZED location navigates correctly (scenario 2)", () => {
    const map = makeLocationMap([
      {
        requirement: "Service Now",
        evidence: "ServiceNow ticketing",
        confidence: "NORMALIZED",
        pageLocations: [{ page: 1, rects: [{ x: 10, y: 220, width: 80, height: 12 }] }],
      },
    ]);
    const t = resolveEvidenceNavigationTarget(map, "Service Now");
    expect(t?.page).toBe(1);
    expect(t?.rect.y).toBe(220);
  });

  it("MULTI_ITEM location navigates correctly (scenario 3)", () => {
    const map = makeLocationMap([
      {
        requirement: "SQL",
        evidence: "SQL queries across reports",
        confidence: "MULTI_ITEM",
        pageLocations: [
          {
            page: 1,
            rects: [
              { x: 20, y: 300, width: 40, height: 12 },
              { x: 60, y: 300, width: 35, height: 12 },
            ],
          },
        ],
      },
    ]);
    // MULTI_ITEM is valid for navigation; overlay rectangles remain untouched.
    const t = resolveEvidenceNavigationTarget(map, "SQL");
    expect(t?.page).toBe(1);
    expect(t?.rect).toEqual({ x: 20, y: 300, width: 40, height: 12 });
  });

  it("MISSING requirement does not navigate (scenario 4)", () => {
    const map = makeLocationMap([
      { requirement: "Kubernetes Administration", evidence: "", confidence: "NOT_FOUND" },
    ]);
    expect(resolveEvidenceNavigationTarget(map, "Kubernetes Administration")).toBeNull();
  });

  it("NOT_FOUND does not navigate (scenario 5)", () => {
    const map = makeLocationMap([{ requirement: "Rust", evidence: "", confidence: "NOT_FOUND" }]);
    expect(resolveEvidenceNavigationTarget(map, "Rust")).toBeNull();
  });

  it("LOW_CONFIDENCE does not navigate even when raw rects exist (scenario 6)", () => {
    const map = makeLocationMap([
      {
        requirement: "Go",
        evidence: "built services with Go",
        confidence: "LOW_CONFIDENCE",
        pageLocations: [{ page: 1, rects: [{ x: 5, y: 5, width: 10, height: 10 }] }],
      },
    ]);
    expect(resolveEvidenceNavigationTarget(map, "Go")).toBeNull();
  });

  it("null / missing locations do not navigate (scenario 7)", () => {
    expect(resolveEvidenceNavigationTarget(null, "Anything")).toBeNull();
    expect(resolveEvidenceNavigationTarget(undefined, "Anything")).toBeNull();
    const map = makeLocationMap([{ requirement: "Known", evidence: "x" }]);
    expect(resolveEvidenceNavigationTarget(map, "Unknown Key")).toBeNull();
  });

  it("multiple pages select the first valid page — no repeated jumping (scenario 8)", () => {
    const map = makeLocationMap([
      {
        requirement: "Leadership",
        evidence: "led the team",
        confidence: "NORMALIZED",
        pageLocations: [
          { page: 3, rects: [{ x: 30, y: 500, width: 70, height: 12 }] },
          { page: 5, rects: [{ x: 31, y: 610, width: 70, height: 12 }] },
        ],
      },
    ]);
    expect(resolveEvidenceNavigationTarget(map, "Leadership")?.page).toBe(3);
  });

  it("multiple rects focus the primary rect's page region (scenario 9)", () => {
    const map = makeLocationMap([
      {
        requirement: "Incident Management",
        evidence: "resolved incidents",
        confidence: "EXACT",
        pageLocations: [
          {
            page: 2,
            rects: [
              { x: 72, y: 420, width: 110, height: 12 },
              { x: 200, y: 420, width: 90, height: 12 },
              { x: 300, y: 436, width: 60, height: 12 },
            ],
          },
        ],
      },
    ]);
    const t = resolveEvidenceNavigationTarget(map, "Incident Management");
    expect(t?.rect).toEqual({ x: 72, y: 420, width: 110, height: 12 });
  });

  it("changing selection changes the navigation target — no stale navigation (scenarios 10, 16)", () => {
    const map = makeLocationMap([
      {
        requirement: "Python",
        evidence: "Python dev",
        pageLocations: [{ page: 1, rects: [{ x: 0, y: 100, width: 40, height: 10 }] }],
      },
      {
        requirement: "Java",
        evidence: "Java dev",
        pageLocations: [{ page: 2, rects: [{ x: 0, y: 400, width: 40, height: 10 }] }],
      },
    ]);
    const first = resolveEvidenceNavigationTarget(map, "Python");
    const second = resolveEvidenceNavigationTarget(map, "Java");
    expect(first?.page).toBe(1);
    expect(second?.page).toBe(2);
    expect(second).not.toEqual(first);
  });

  it("re-analysis (cleared map) produces no navigation from stale state (scenario 11)", () => {
    // After re-analysis starts, the route clears the EvidenceLocationMap;
    // resolving against the cleared map must yield null, never stale pages.
    const cleared: EvidenceLocationMap | null = null;
    expect(resolveEvidenceNavigationTarget(cleared, "Remote User Support")).toBeNull();
  });

  it("navigation resolution is pure — no network/LLM side surface (scenario 12)", () => {
    const map = makeLocationMap([
      {
        requirement: "Excel",
        evidence: "Excel reporting",
        pageLocations: [{ page: 1, rects: [{ x: 5, y: 90, width: 44, height: 10 }] }],
      },
    ]);
    // Only map lookups occur; repeated invocation returns identical results,
    // so selection/navigation can never trigger a request.
    expect(resolveEvidenceNavigationTarget(map, "Excel")).toStrictEqual(
      resolveEvidenceNavigationTarget(map, "Excel"),
    );
  });

  it("zoom does not invalidate the location mapping (scenario 13)", () => {
    const map = makeLocationMap([
      {
        requirement: "SQL",
        evidence: "SQL",
        pageLocations: [{ page: 1, rects: [{ x: 12, y: 340, width: 50, height: 11 }] }],
      },
    ]);
    // The resolver takes no zoom input by design: coordinates are intrinsic
    // and the renderer's existing display transformation handles zoom.
    const t = resolveEvidenceNavigationTarget(map, "SQL");
    expect(t?.rect).toEqual({ x: 12, y: 340, width: 50, height: 11 });
    expect("zoom" in (t as object)).toBe(false);
  });

  it("empty EvidenceLocationMap is safe (scenario 14)", () => {
    expect(resolveEvidenceNavigationTarget(new Map(), "Anything")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Target 4.6 — score interpretation
// ---------------------------------------------------------------------------
describe("interpretAtsScore", () => {
  it("maps each band to the correct interpretation (scenario 1)", () => {
    expect(interpretAtsScore(90)).toEqual({ label: "Strong alignment", tone: "positive" });
    expect(interpretAtsScore(74)).toEqual({
      label: "Good alignment with a few gaps",
      tone: "good",
    });
    expect(interpretAtsScore(55)).toEqual({
      label: "Moderate alignment — several requirements need attention",
      tone: "moderate",
    });
    expect(interpretAtsScore(40)).toEqual({
      label: "Weak alignment — important requirements are missing",
      tone: "weak",
    });
    expect(interpretAtsScore(15)).toEqual({
      label: "Low alignment — major gaps detected",
      tone: "low",
    });
  });

  it("handles missing score safely (no false precision)", () => {
    expect(interpretAtsScore(undefined).tone).toBe("low");
    expect(interpretAtsScore(Number.NaN).tone).toBe("low");
  });

  it("never claims hiring probability", () => {
    for (const score of [0, 30, 50, 70, 85, 100]) {
      const label = interpretAtsScore(score).label.toLowerCase();
      expect(label).not.toContain("chance");
      expect(label).not.toContain("interview");
      expect(label).not.toContain("reject");
      expect(label).not.toContain("rejection");
    }
  });
});

// ---------------------------------------------------------------------------
// Target 4.6 — actionable issue hierarchy & strengths
// ---------------------------------------------------------------------------
describe("issue hierarchy", () => {
  it("critical requirements appear before medium ones (scenario 2)", () => {
    const views = buildAtsRequirementViews(
      analysisWith([
        cov({ requirement: "Medium issue", status: "missing", importance: "medium" }),
        cov({ requirement: "Critical miss", status: "missing", importance: "critical" }),
        cov({ requirement: "Critical partial", status: "partial", importance: "critical" }),
      ]),
    );
    const tiers = orderedNonEmptyIssueTiers(groupAtsIssuesByPriority(views));
    // Critical issues surface before any other tier (medium-missing promotes to high).
    expect(tiers.map((t) => t.tier)).toEqual(["critical", "high"]);
    expect(tiers[0].views.map((v) => v.requirement).sort()).toEqual([
      "Critical miss",
      "Critical partial",
    ]);
  });

  it("missing requirements surface before matched ones (scenario 3)", () => {
    const views = buildAtsRequirementViews(
      analysisWith([
        cov({ requirement: "Matched skill", status: "matched", importance: "high" }),
        cov({ requirement: "Missing skill", status: "missing", importance: "high" }),
      ]),
    );
    const groups = groupAtsIssuesByPriority(views);
    // Missing requirement lands in an issue tier; matched never does.
    expect(groups.critical.map((v) => v.requirement)).toEqual(["Missing skill"]);
    expect(
      Object.values(groups)
        .flat()
        .map((v) => v.requirement),
    ).not.toContain("Matched skill");
    // Matched appears only in strengths.
    expect(pickStrengths(views).map((v) => v.requirement)).toEqual(["Matched skill"]);
  });

  it("matched strengths are separated from missing issues (scenario 4)", () => {
    const views = buildAtsRequirementViews(
      analysisWith([
        cov({ requirement: "Service Desk Management", status: "matched", importance: "high" }),
        cov({ requirement: "Active Directory", status: "missing", importance: "critical" }),
      ]),
    );
    const groups = groupAtsIssuesByPriority(views);
    expect(groups.critical.map((v) => v.requirement)).toEqual(["Active Directory"]);
    expect(pickStrengths(views).map((v) => v.requirement)).toEqual(["Service Desk Management"]);
  });

  it("strengths cap avoids flooding and excludes low-importance noise", () => {
    const views = buildAtsRequirementViews(
      analysisWith([
        cov({ requirement: "Low noise", status: "matched", importance: "low" }),
        ...Array.from({ length: 10 }, (_, i) =>
          cov({ requirement: `Strength ${i}`, status: "matched", importance: "high" }),
        ),
      ]),
    );
    const strengths = pickStrengths(views, 6);
    expect(strengths.length).toBe(6);
    expect(strengths.map((v) => v.requirement)).not.toContain("Low noise");
  });
});

// ---------------------------------------------------------------------------
// Target 4.6 — real-data counts & classification
// ---------------------------------------------------------------------------
describe("summarizeRequirementCoverage", () => {
  it("reports only real backend counts (scenarios 5, 6)", () => {
    const views = buildAtsRequirementViews(
      analysisWith([
        cov({ requirement: "A", status: "matched", importance: "high" }),
        cov({ requirement: "B", status: "partial", importance: "medium" }),
        cov({ requirement: "C", status: "missing", importance: "high" }),
        cov({ requirement: "D", status: "matched", importance: "low" }),
      ]),
    );
    const summary = summarizeRequirementCoverage(views);
    expect(summary.total).toBe(4);
    expect(summary.importantTotal).toBe(3); // low excluded
    expect(summary.importantAddressed).toBe(2); // matched + partial
  });

  it("counts derive from data only — different JDs give different numbers", () => {
    const one = summarizeRequirementCoverage(
      buildAtsRequirementViews(analysisWith([cov({ requirement: "A", status: "matched" })])),
    );
    const three = summarizeRequirementCoverage(
      buildAtsRequirementViews(
        analysisWith([
          cov({ requirement: "A", status: "matched" }),
          cov({ requirement: "B", status: "partial" }),
          cov({ requirement: "C", status: "missing" }),
        ]),
      ),
    );
    expect(one.total).toBe(1);
    expect(three.total).toBe(3);
    expect(one.total).not.toBe(three.total);
  });
});

describe("classifyEvidenceKind", () => {
  it("distinguishes project/academic/certification from professional (scenarios 7, 8)", () => {
    expect(classifyEvidenceKind("experience[0]")).toBe("Professional experience");
    expect(classifyEvidenceKind("projects[1].technologies")).toBe("Project evidence");
    expect(classifyEvidenceKind("education[0]")).toBe("Academic evidence");
    expect(classifyEvidenceKind("certifications[0]")).toBe("Certification evidence");
    expect(classifyEvidenceKind("internships[0]")).toBe("Internship evidence");
  });

  it("never labels project evidence as professional employment", () => {
    expect(classifyEvidenceKind("projects[2].description")).toBe("Project evidence");
  });

  it("is safe with missing sections", () => {
    expect(classifyEvidenceKind(undefined)).toBeUndefined();
    expect(classifyEvidenceKind(null)).toBeUndefined();
    expect(classifyEvidenceKind("")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Target 4.6 — recommendation mapping integrity
// ---------------------------------------------------------------------------
describe("partitionRecommendations", () => {
  const analysis: AtsAnalysisResult = {
    ...analysisWith([cov({ requirement: "Service Desk Management", status: "partial" })]),
    high_priority_recommendations: [
      "Consider clarifying the Service Desk Management responsibilities you performed.",
      "Add measurable outcomes to your experience bullets.",
    ],
    medium_priority_recommendations: ["Quantify the impact of your contributions."],
    recommendations: ["Include a professional summary."],
  };

  it("keeps reliably-mapped recommendations attached to their requirement (scenario 9)", () => {
    const sd = buildAtsRequirementViews(analysis)[0];
    expect(sd.recommendation?.text).toContain("Service Desk Management");
    // The mapped text is consumed by the card, so it must NOT re-appear generically.
    const { general } = partitionRecommendations(analysis, [sd]);
    expect(general.map((r) => r.text)).not.toContain(
      "Consider clarifying the Service Desk Management responsibilities you performed.",
    );
  });

  it("keeps unmapped recommendations general (scenario 10)", () => {
    const sd = buildAtsRequirementViews(analysis)[0];
    const { general } = partitionRecommendations(analysis, [sd]);
    expect(general).toEqual([
      { text: "Add measurable outcomes to your experience bullets.", priority: "high" },
      { text: "Quantify the impact of your contributions.", priority: "medium" },
      { text: "Include a professional summary.", priority: "general" },
    ]);
  });

  it("is safe with null analysis", () => {
    expect(partitionRecommendations(null, []).general).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Target 4.6 — analysis lifecycle states
// ---------------------------------------------------------------------------
describe("resolveAtsPanelState", () => {
  it("no-job-description state (scenario 11)", () => {
    expect(resolveAtsPanelState({ hasJobContext: false })).toEqual({
      kind: "no-job-context",
    });
  });

  it("empty-requirements state is a complete-but-empty analysis (scenario 12)", () => {
    expect(
      resolveAtsPanelState({ hasJobContext: true, hasAnalysis: true, hasRequirements: false }),
    ).toEqual({ kind: "complete", hasRequirements: false });
  });

  it("failed-analysis state (scenario 13)", () => {
    expect(resolveAtsPanelState({ hasJobContext: true, error: "boom" })).toEqual({
      kind: "failed",
      message: "boom",
    });
  });

  it("analysis-in-progress state (scenario 14)", () => {
    expect(resolveAtsPanelState({ hasJobContext: true, isAnalyzing: true })).toEqual({
      kind: "analyzing",
    });
  });

  it("re-analysis state — analyzing wins over stale complete data (scenario 15)", () => {
    expect(
      resolveAtsPanelState({ hasJobContext: true, isAnalyzing: true, hasAnalysis: true }),
    ).toEqual({ kind: "analyzing" });
  });
});
