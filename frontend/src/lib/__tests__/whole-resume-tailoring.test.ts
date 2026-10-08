import { describe, it, expect, vi, beforeEach } from "vitest";
import { optimizationApi } from "@/api/optimization";
import { versionsApi } from "@/api/versions";
import * as requestModule from "@/utils/request";

vi.mock("@/utils/request", () => ({
  request: vi.fn(),
  requestBlob: vi.fn(),
}));

describe("Whole Resume Tailoring Frontend Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call optimizationApi.tailor and correctly map camelCase properties", async () => {
    const mockApiResponse = {
      success: true,
      plan: [
        {
          section: "summary",
          action: "REWRITE",
          reasoning: "Targeted to Lead Python Developer.",
          keywords_addressed: ["Python", "FastAPI"],
          current_text: "Original summary",
          suggested_text: "Tailored summary",
        },
      ],
      tailored_profile: {
        summary: "Tailored summary",
      },
      score_comparison: {
        baseline_score: 65,
        tailored_score: 88,
        delta: 23,
        matched_keywords_count: 12,
        missing_keywords_count: 2,
      },
      message: "Resume successfully tailored.",
    };

    (requestModule.request as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockApiResponse,
    );

    const result = await optimizationApi.tailor({
      resumeId: "res-123",
      jobDescription: "Lead Python Developer with FastAPI expertise.",
      jobTitle: "Lead Python Developer",
    });

    expect(result.success).toBe(true);
    expect(result.plan).toHaveLength(1);
    expect(result.plan[0].section).toBe("summary");
    expect(result.plan[0].action).toBe("REWRITE");
    expect(result.plan[0].keywordsAddressed).toEqual(["Python", "FastAPI"]);
    expect(result.scoreComparison.baselineScore).toBe(65);
    expect(result.scoreComparison.tailoredScore).toBe(88);
    expect(result.scoreComparison.delta).toBe(23);
    expect(result.scoreComparison.matchedKeywordsCount).toBe(12);
  });

  it("should call versionsApi.applyTailoring and return new version", async () => {
    const mockVersion = {
      id: "ver-tailored-1",
      resume_id: "res-123",
      version_name: "Lead Python Developer Version (Sep 05)",
      source: "tailoring",
      content: { profile: { summary: "Tailored summary" } },
      last_ats_score: 88,
    };

    (requestModule.request as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockVersion,
    });

    const result = await versionsApi.applyTailoring("res-123", {
      tailored_profile: { summary: "Tailored summary" },
      job_title: "Lead Python Developer",
      job_description: "FastAPI skills",
    });

    expect(result.version.id).toBe("ver-tailored-1");
    expect(result.version.version_name).toBe("Lead Python Developer Version (Sep 05)");
  });
});
