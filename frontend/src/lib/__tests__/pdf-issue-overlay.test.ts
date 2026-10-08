/**
 * Target 4.3 — Evidence Highlighting Overlay Tests
 *
 * Tests the pure-function logic for status classification,
 * highlight transformation, and coordinate preservation.
 * No browser, no React rendering — just data transformation.
 */
import { describe, it, expect } from "vitest";
import {
  classifyHighlightStatus,
  pdfIssueToPageHighlights,
} from "@/components/resume/pdf-issue-overlay";
import type { EvidenceLocationMap } from "@/lib/evidence-location";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    map.set(e.requirement, {
      requirement: e.requirement,
      evidence: e.evidence,
      location: {
        locations: (e.pageLocations ?? []).map((pl) => ({
          page: pl.page,
          rects: pl.rects,
          confidence: (e.confidence ?? "EXACT") as
            "EXACT" | "NORMALIZED" | "MULTI_ITEM" | "LOW_CONFIDENCE" | "NOT_FOUND",
          matchedText: e.evidence,
        })),
        confidence: (e.confidence ?? "EXACT") as
          "EXACT" | "NORMALIZED" | "MULTI_ITEM" | "LOW_CONFIDENCE" | "NOT_FOUND",
      },
    });
  }
  return map;
}

const coverage = (
  overrides: Array<{
    requirement: string;
    status?: string;
    evidence_level?: string;
  }>,
) => overrides;

// ---------------------------------------------------------------------------
// classifyHighlightStatus
// ---------------------------------------------------------------------------
describe("classifyHighlightStatus", () => {
  it("returns null for missing status", () => {
    expect(classifyHighlightStatus("missing")).toBeNull();
  });

  it("returns null for none evidence_level", () => {
    expect(classifyHighlightStatus(undefined, "none")).toBeNull();
  });

  it("returns partial for partial status", () => {
    expect(classifyHighlightStatus("partial")).toBe("partial");
  });

  it("returns weak for weak evidence_level", () => {
    expect(classifyHighlightStatus(undefined, "weak")).toBe("weak");
  });

  it("returns weak when status is matched but evidence_level is weak", () => {
    expect(classifyHighlightStatus("matched", "weak")).toBe("weak");
  });

  it("returns matched for matched status with no evidence_level", () => {
    expect(classifyHighlightStatus("matched")).toBe("matched");
  });

  it("returns matched for matched status with strong evidence_level", () => {
    expect(classifyHighlightStatus("matched", "strong")).toBe("matched");
  });

  it("returns matched for matched status with moderate evidence_level", () => {
    expect(classifyHighlightStatus("matched", "moderate")).toBe("matched");
  });

  it("returns matched when no status or evidence_level provided", () => {
    expect(classifyHighlightStatus()).toBe("matched");
  });

  it("returns partial for partial status even with strong evidence_level", () => {
    expect(classifyHighlightStatus("partial", "strong")).toBe("partial");
  });

  it("returns weak for weak evidence_level even with matched status", () => {
    expect(classifyHighlightStatus("matched", "weak")).toBe("weak");
  });

  it("returns null for missing status even with moderate evidence_level", () => {
    expect(classifyHighlightStatus("missing", "moderate")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// pdfIssueToPageHighlights — basic rendering
// ---------------------------------------------------------------------------
describe("pdfIssueToPageHighlights - basic rendering", () => {
  it("returns highlights for partial evidence", () => {
    const map = makeLocationMap([
      {
        requirement: "ServiceNow",
        evidence: "ServiceNow ticketing system",
        pageLocations: [{ page: 1, rects: [{ x: 100, y: 200, width: 80, height: 12 }] }],
      },
    ]);
    const cov = coverage([{ requirement: "ServiceNow", status: "partial" }]);
    const highlights = pdfIssueToPageHighlights(map, cov);
    expect(highlights).toHaveLength(1);
    expect(highlights[0].status).toBe("partial");
    expect(highlights[0].requirementId).toBe("ServiceNow");
  });

  it("returns highlights for weak evidence", () => {
    const map = makeLocationMap([
      {
        requirement: "ServiceNow",
        evidence: "ServiceNow",
        pageLocations: [{ page: 1, rects: [{ x: 50, y: 100, width: 60, height: 12 }] }],
      },
    ]);
    const cov = coverage([
      { requirement: "ServiceNow", status: "matched", evidence_level: "weak" },
    ]);
    const highlights = pdfIssueToPageHighlights(map, cov);
    expect(highlights).toHaveLength(1);
    expect(highlights[0].status).toBe("weak");
  });

  it("returns subtle highlights for matched evidence", () => {
    const map = makeLocationMap([
      {
        requirement: "Python",
        evidence: "Python development experience",
        pageLocations: [{ page: 1, rects: [{ x: 10, y: 20, width: 50, height: 12 }] }],
      },
    ]);
    const cov = coverage([{ requirement: "Python", status: "matched", evidence_level: "strong" }]);
    const highlights = pdfIssueToPageHighlights(map, cov);
    expect(highlights).toHaveLength(1);
    expect(highlights[0].status).toBe("matched");
  });
});

// ---------------------------------------------------------------------------
// pdfIssueToPageHighlights — missing / NOT_FOUND / LOW_CONFIDENCE
// ---------------------------------------------------------------------------
describe("pdfIssueToPageHighlights - missing / NOT_FOUND / LOW_CONFIDENCE", () => {
  it("does NOT render missing evidence", () => {
    const map = makeLocationMap([
      {
        requirement: "Kubernetes",
        evidence: "",
        confidence: "NOT_FOUND",
        pageLocations: [],
      },
    ]);
    const cov = coverage([{ requirement: "Kubernetes", status: "missing" }]);
    const highlights = pdfIssueToPageHighlights(map, cov);
    expect(highlights).toHaveLength(0);
  });

  it("does NOT render NOT_FOUND confidence", () => {
    const map = makeLocationMap([
      {
        requirement: "Docker",
        evidence: "containerization",
        confidence: "NOT_FOUND",
        pageLocations: [],
      },
    ]);
    const cov = coverage([{ requirement: "Docker", status: "matched" }]);
    const highlights = pdfIssueToPageHighlights(map, cov);
    expect(highlights).toHaveLength(0);
  });

  it("does NOT render LOW_CONFIDENCE evidence", () => {
    const map = makeLocationMap([
      {
        requirement: "AWS",
        evidence: "cloud",
        confidence: "LOW_CONFIDENCE",
        pageLocations: [{ page: 1, rects: [{ x: 10, y: 20, width: 30, height: 12 }] }],
      },
    ]);
    const cov = coverage([{ requirement: "AWS", status: "matched" }]);
    const highlights = pdfIssueToPageHighlights(map, cov);
    expect(highlights).toHaveLength(0);
  });

  it("renders when no coverage entry exists (defaults to matched)", () => {
    const map = makeLocationMap([
      {
        requirement: "Unknown",
        evidence: "something",
        pageLocations: [{ page: 1, rects: [{ x: 10, y: 20, width: 50, height: 12 }] }],
      },
    ]);
    const highlights = pdfIssueToPageHighlights(map);
    expect(highlights).toHaveLength(1);
    expect(highlights[0].status).toBe("matched");
  });
});

// ---------------------------------------------------------------------------
// pdfIssueToPageHighlights — coordinate preservation
// ---------------------------------------------------------------------------
describe("pdfIssueToPageHighlights - coordinate preservation", () => {
  it("preserves exact coordinates", () => {
    const map = makeLocationMap([
      {
        requirement: "Java",
        evidence: "Java",
        pageLocations: [{ page: 1, rects: [{ x: 123.45, y: 678.9, width: 56.7, height: 12.3 }] }],
      },
    ]);
    const highlights = pdfIssueToPageHighlights(map);
    const rect = highlights[0].locations[0].rects[0];
    expect(rect.x).toBe(123.45);
    expect(rect.y).toBe(678.9);
    expect(rect.width).toBe(56.7);
    expect(rect.height).toBe(12.3);
  });

  it("preserves multiple rects per page", () => {
    const map = makeLocationMap([
      {
        requirement: "Python",
        evidence: "Python",
        pageLocations: [
          {
            page: 1,
            rects: [
              { x: 10, y: 20, width: 50, height: 12 },
              { x: 10, y: 50, width: 50, height: 12 },
            ],
          },
        ],
      },
    ]);
    const highlights = pdfIssueToPageHighlights(map);
    expect(highlights[0].locations[0].rects).toHaveLength(2);
  });

  it("preserves multiple pages", () => {
    const map = makeLocationMap([
      {
        requirement: "Python",
        evidence: "Python",
        pageLocations: [
          { page: 1, rects: [{ x: 10, y: 20, width: 50, height: 12 }] },
          { page: 2, rects: [{ x: 30, y: 40, width: 50, height: 12 }] },
        ],
      },
    ]);
    const highlights = pdfIssueToPageHighlights(map);
    expect(highlights[0].locations).toHaveLength(2);
    expect(highlights[0].locations[0].page).toBe(1);
    expect(highlights[0].locations[1].page).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// pdfIssueToPageHighlights — multi-item evidence
// ---------------------------------------------------------------------------
describe("pdfIssueToPageHighlights - multi-item evidence", () => {
  it("renders multiple rects for multi-item evidence on same page", () => {
    const map = makeLocationMap([
      {
        requirement: "ServiceNow",
        evidence: "ServiceNow",
        pageLocations: [
          {
            page: 1,
            rects: [
              { x: 100, y: 200, width: 40, height: 12 },
              { x: 145, y: 200, width: 30, height: 12 },
            ],
          },
        ],
      },
    ]);
    const cov = coverage([{ requirement: "ServiceNow", status: "partial" }]);
    const highlights = pdfIssueToPageHighlights(map, cov);
    expect(highlights).toHaveLength(1);
    expect(highlights[0].locations[0].rects).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// pdfIssueToPageHighlights — empty / edge cases
// ---------------------------------------------------------------------------
describe("pdfIssueToPageHighlights - empty / edge cases", () => {
  it("returns empty for empty map", () => {
    expect(pdfIssueToPageHighlights(new Map())).toEqual([]);
  });

  it("returns empty when all entries are NOT_FOUND", () => {
    const map = makeLocationMap([
      {
        requirement: "Missing",
        evidence: "",
        confidence: "NOT_FOUND",
        pageLocations: [],
      },
    ]);
    expect(pdfIssueToPageHighlights(map)).toEqual([]);
  });

  it("returns empty when all entries have empty rects", () => {
    const map = makeLocationMap([
      {
        requirement: "Empty",
        evidence: "something",
        pageLocations: [{ page: 1, rects: [] }],
      },
    ]);
    expect(pdfIssueToPageHighlights(map)).toEqual([]);
  });

  it("filters out entries with empty page locations array", () => {
    const map = makeLocationMap([
      {
        requirement: "NoLocs",
        evidence: "something",
        pageLocations: [],
      },
    ]);
    expect(pdfIssueToPageHighlights(map)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// pdfIssueToPageHighlights — status-based visual treatment
// ---------------------------------------------------------------------------
describe("pdfIssueToPageHighlights - status-based visual treatment", () => {
  it("partial status is preserved through transformation", () => {
    const map = makeLocationMap([
      {
        requirement: "ITSM",
        evidence: "ITSM platform",
        pageLocations: [{ page: 1, rects: [{ x: 10, y: 20, width: 60, height: 12 }] }],
      },
    ]);
    const cov = coverage([{ requirement: "ITSM", status: "partial" }]);
    const highlights = pdfIssueToPageHighlights(map, cov);
    expect(highlights[0].status).toBe("partial");
  });

  it("weak status is preserved through transformation", () => {
    const map = makeLocationMap([
      {
        requirement: "Azure",
        evidence: "Azure",
        pageLocations: [{ page: 1, rects: [{ x: 10, y: 20, width: 40, height: 12 }] }],
      },
    ]);
    const cov = coverage([{ requirement: "Azure", status: "matched", evidence_level: "weak" }]);
    const highlights = pdfIssueToPageHighlights(map, cov);
    expect(highlights[0].status).toBe("weak");
  });

  it("matched status is preserved through transformation", () => {
    const map = makeLocationMap([
      {
        requirement: "React",
        evidence: "React development",
        pageLocations: [{ page: 1, rects: [{ x: 10, y: 20, width: 50, height: 12 }] }],
      },
    ]);
    const cov = coverage([{ requirement: "React", status: "matched", evidence_level: "strong" }]);
    const highlights = pdfIssueToPageHighlights(map, cov);
    expect(highlights[0].status).toBe("matched");
  });
});

// ---------------------------------------------------------------------------
// pdfIssueToPageHighlights — zoom alignment (coordinates are zoom-independent)
// ---------------------------------------------------------------------------
describe("pdfIssueToPageHighlights - zoom alignment", () => {
  it("coordinates are in intrinsic scale (zoom-independent)", () => {
    const map = makeLocationMap([
      {
        requirement: "Python",
        evidence: "Python",
        pageLocations: [{ page: 1, rects: [{ x: 72, y: 700, width: 50, height: 12 }] }],
      },
    ]);
    const highlights = pdfIssueToPageHighlights(map);
    const rect = highlights[0].locations[0].rects[0];
    // Coordinates are raw intrinsic values — zoom is applied at render time
    expect(rect.x).toBe(72);
    expect(rect.y).toBe(700);
  });
});

// ---------------------------------------------------------------------------
// pdfIssueToPageHighlights — no fabricated coordinates
// ---------------------------------------------------------------------------
describe("pdfIssueToPageHighlights - no fabricated coordinates", () => {
  it("never returns locations when map is empty", () => {
    expect(pdfIssueToPageHighlights(new Map())).toEqual([]);
  });

  it("never returns locations for NOT_FOUND entries", () => {
    const map = makeLocationMap([
      {
        requirement: "Rust",
        evidence: "",
        confidence: "NOT_FOUND",
        pageLocations: [],
      },
    ]);
    expect(pdfIssueToPageHighlights(map)).toEqual([]);
  });

  it("never returns locations for missing status with no evidence", () => {
    const map = makeLocationMap([
      {
        requirement: "Go",
        evidence: "",
        confidence: "NOT_FOUND",
        pageLocations: [],
      },
    ]);
    const cov = coverage([{ requirement: "Go", status: "missing" }]);
    expect(pdfIssueToPageHighlights(map, cov)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// pdfIssueToPageHighlights — ATS analysis absent
// ---------------------------------------------------------------------------
describe("pdfIssueToPageHighlights - ATS analysis absent", () => {
  it("renders cleanly with empty map and no coverage", () => {
    expect(pdfIssueToPageHighlights(new Map(), undefined)).toEqual([]);
  });

  it("renders cleanly with empty map and empty coverage", () => {
    expect(pdfIssueToPageHighlights(new Map(), [])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// pdfIssueToPageHighlights — selected evidence styling
// ---------------------------------------------------------------------------
describe("pdfIssueToPageHighlights - selected evidence", () => {
  it("selected requirement is identifiable by requirementId", () => {
    const map = makeLocationMap([
      {
        requirement: "Python",
        evidence: "Python",
        pageLocations: [{ page: 1, rects: [{ x: 10, y: 20, width: 50, height: 12 }] }],
      },
      {
        requirement: "Java",
        evidence: "Java",
        pageLocations: [{ page: 1, rects: [{ x: 10, y: 50, width: 40, height: 12 }] }],
      },
    ]);
    const cov = coverage([
      { requirement: "Python", status: "matched", evidence_level: "strong" },
      { requirement: "Java", status: "partial" },
    ]);
    const highlights = pdfIssueToPageHighlights(map, cov);
    expect(highlights).toHaveLength(2);

    const pythonHl = highlights.find((h) => h.requirementId === "Python");
    const javaHl = highlights.find((h) => h.requirementId === "Java");
    expect(pythonHl).toBeDefined();
    expect(javaHl).toBeDefined();
    expect(pythonHl!.status).toBe("matched");
    expect(javaHl!.status).toBe("partial");
  });
});

// ---------------------------------------------------------------------------
// pdfIssueToPageHighlights — evidence text preserved
// ---------------------------------------------------------------------------
describe("pdfIssueToPageHighlights - evidence text preserved", () => {
  it("preserves evidence text in highlight", () => {
    const map = makeLocationMap([
      {
        requirement: "ServiceNow",
        evidence: "ServiceNow ticketing system",
        pageLocations: [{ page: 1, rects: [{ x: 100, y: 200, width: 80, height: 12 }] }],
      },
    ]);
    const highlights = pdfIssueToPageHighlights(map);
    expect(highlights[0].evidence).toBe("ServiceNow ticketing system");
  });
});
