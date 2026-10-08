import { describe, it, expect, vi, beforeEach } from "vitest";
import { tailoringEvidenceApi } from "@/api/optimization";
import * as requestModule from "@/utils/request";

vi.mock("@/utils/request", () => ({
  request: vi.fn(),
  requestBlob: vi.fn(),
}));

const BANNED_PHRASES = [
  "provide evidence",
  "unsupported claim",
  "requirement not satisfied",
  "insufficient evidence",
  "prove your experience",
  "missing qualification",
  "requirement not met",
  "failed to satisfy",
  "unsupported",
];

describe("Tailoring Evidence Frontend Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps batched opportunities from snake_case to camelCase", async () => {
    (requestModule.request as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      heading: "A few things could make your match stronger",
      subheading: "Have you worked with any of these?",
      select_hint: "Select anything you've used.",
      input_label: "Tell us a little about where you used them.",
      input_placeholder: "Where did you use each area?",
      skip_label: "Skip for now",
      submit_label: "Use my experience",
      opportunities: [
        {
          id: "abc123",
          requirement_id: "React",
          display_label: "React",
          friendly_title: "React",
          friendly_prompt: "Have you worked with React?",
          friendly_helper: "Your resume could be stronger here.",
          context_options: ["professional", "project", "academic"],
          confidence: 0.8,
          status: "pending",
        },
      ],
      message: "Found 1 area(s).",
    });

    const result = await tailoringEvidenceApi.opportunities({
      resumeId: "res-123",
      jobDescription: "Frontend role needing React.",
    });

    expect(result.success).toBe(true);
    expect(result.opportunities).toHaveLength(1);
    const card = result.opportunities[0];
    expect(card.id).toBe("abc123");
    expect(card.displayLabel).toBe("React");
    expect(card.friendlyPrompt).toBe("Have you worked with React?");
    expect(card.contextOptions).toContain("academic");
    expect(result.skipLabel).toBe("Skip for now");
  });

  it("maps respond impact with before/after scores and improvements", async () => {
    (requestModule.request as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      facts: [
        {
          id: "f1",
          opportunity_id: "abc123",
          requirement_id: "React",
          display_label: "React",
          candidate_context: "academic",
          candidate_description: "Used React in my college project",
          project_name: "dashboard",
          provenance: "candidate_confirmed",
          confidence: 0.75,
        },
      ],
      declined_ids: [],
      needs_clarification: null,
      success_note: "Nice — that gives us more to work with.",
      tailored_profile: { summary: "Updated summary" },
      plan: [],
      impact: {
        baseline_score: 64,
        tailored_score: 78,
        delta: 14,
        materially_improved: true,
        headline: "Your resume is now a stronger match for this role.",
        improvements: ["React experience from your academic work is now represented."],
        explanation: "Match improved from 64% to 78%.",
      },
      guard_issues: [],
      message: "done",
    });

    const result = await tailoringEvidenceApi.respond({
      resumeId: "res-123",
      jobDescription: "Frontend role needing React.",
      opportunities: [],
      selectedIds: ["abc123"],
      freeText: "Used React in my college project.",
    });

    expect(result.facts).toHaveLength(1);
    expect(result.facts[0].candidateContext).toBe("academic");
    expect(result.facts[0].provenance).toBe("candidate_confirmed");
    expect(result.impact.baselineScore).toBe(64);
    expect(result.impact.tailoredScore).toBe(78);
    expect(result.impact.delta).toBe(14);
    expect(result.impact.materiallyImproved).toBe(true);
    expect(result.impact.improvements).toHaveLength(1);
  });

  it("keeps candidate-facing copy friendly (no auditor language)", async () => {
    (requestModule.request as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      heading: "A few things could make your match stronger",
      subheading: "Have you worked with any of these?",
      select_hint: "",
      input_label: "",
      input_placeholder: "",
      skip_label: "Skip for now",
      submit_label: "Use my experience",
      opportunities: [
        {
          id: "x1",
          requirement_id: "Docker",
          display_label: "Docker",
          friendly_title: "Docker",
          friendly_prompt: "Have you worked with Docker? If so, tell us a little about where you used it.",
          friendly_helper: "Your resume could be stronger here.",
          context_options: [],
          confidence: 0.7,
          status: "pending",
        },
      ],
      message: "",
    });

    const result = await tailoringEvidenceApi.opportunities({
      resumeId: "res-123",
      jobDescription: "DevOps role.",
    });

    const haystack = [
      result.heading,
      result.subheading,
      result.selectHint,
      result.inputLabel,
      ...result.opportunities.flatMap((o) => [
        o.friendlyTitle,
        o.friendlyPrompt,
        o.friendlyHelper,
      ]),
    ]
      .join(" | ")
      .toLowerCase();
    for (const banned of BANNED_PHRASES) {
      expect(haystack).not.toContain(banned);
    }
    // No success guarantee language either.
    expect(haystack).not.toContain("guarantee");
    expect(haystack).not.toContain("shortlist");
  });

  it("supports skipping: empty selection resolves without facts", async () => {
    (requestModule.request as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      facts: [],
      declined_ids: [],
      needs_clarification: null,
      success_note: "",
      tailored_profile: {},
      plan: [],
      impact: {
        baseline_score: 0,
        tailored_score: 0,
        delta: 0,
        materially_improved: false,
        headline: "No changes yet.",
        improvements: [],
        explanation: "Thanks.",
      },
      guard_issues: [],
      message: "No confirmed experience to apply yet.",
    });

    const result = await tailoringEvidenceApi.respond({
      resumeId: "res-123",
      jobDescription: "Some role.",
      opportunities: [],
      selectedIds: [],
      freeText: "",
    });

    expect(result.facts).toHaveLength(0);
    expect(result.needsClarification).toBeNull();
    expect(result.impact.improvements).toHaveLength(0);
  });
});
