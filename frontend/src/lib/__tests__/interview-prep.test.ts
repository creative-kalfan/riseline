import { describe, it, expect } from "vitest";
import {
  computePrepProgress,
  progressSummary,
  groupQuestionsByCategory,
  filterQuestions,
  groundedEvidence,
  hasEvidenceGap,
  practiceQueue,
  UNSUPPORTED_EVIDENCE_MARKER,
} from "../interview-prep";
import { API_ENDPOINTS } from "../../constants/api";
import { interviewPrepQueryKeys } from "../../hooks/api/useInterviewPrep";
import type { InterviewPrepQuestion, InterviewPrepSession } from "../../types/interview-prep";

function question(overrides: Partial<InterviewPrepQuestion> = {}): InterviewPrepQuestion {
  return {
    id: "q-1",
    session_id: "s-1",
    category: "technical",
    question: "Tell me about a time you optimized PostgreSQL performance.",
    difficulty: "intermediate",
    rationale: "Core JD requirement with direct resume evidence.",
    resume_evidence: ["Optimized PostgreSQL queries, reducing P99 latency by 35%."],
    talking_points: ["query optimization", "35% P99 improvement"],
    answer_framework: {
      type: "Problem-Approach-Validation",
      steps: ["Problem", "Result"],
      guidance: "",
    },
    star_guidance: null,
    expected_signals: ["Explains measurement"],
    related_jd_requirements: ["PostgreSQL performance optimization"],
    gaps: [],
    question_order: 0,
    is_prepared: false,
    is_bookmarked: false,
    ...overrides,
  };
}

function session(overrides: Partial<InterviewPrepSession> = {}): InterviewPrepSession {
  return {
    id: "s-1",
    user_id: "user-A",
    application_id: "app-1",
    interview_id: "int-1",
    job_id: "job-1",
    status: "ready",
    interview_type: "technical",
    interview_name: "Technical Screen",
    source_resume_id: "resume-1",
    source_fingerprint: "abc",
    source_metadata: { job_title: "Backend Engineer", company_name: "Finscale" },
    question_count: 6,
    prepared_count: 2,
    version: 1,
    error: null,
    generated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

describe("interview prep endpoints", () => {
  it("exposes the interview-prep API surface", () => {
    expect(API_ENDPOINTS.INTERVIEW_PREP.GENERATE).toBe("/api/interview-prep/generate");
    expect(API_ENDPOINTS.INTERVIEW_PREP.SESSIONS).toBe("/api/interview-prep/sessions");
    expect(API_ENDPOINTS.INTERVIEW_PREP.SESSION("s-1")).toBe("/api/interview-prep/sessions/s-1");
    expect(API_ENDPOINTS.INTERVIEW_PREP.REGENERATE("s-1")).toBe(
      "/api/interview-prep/sessions/s-1/regenerate",
    );
    expect(API_ENDPOINTS.INTERVIEW_PREP.QUESTION("q-1")).toBe("/api/interview-prep/questions/q-1");
    expect(API_ENDPOINTS.INTERVIEW_PREP.BY_APPLICATION("app-1")).toBe(
      "/api/interview-prep/by-application/app-1",
    );
  });

  it("uses stable query keys for sessions and detail", () => {
    expect(interviewPrepQueryKeys.all).toEqual(["interview-prep"]);
    expect(interviewPrepQueryKeys.list).toEqual(["interview-prep", "list"]);
    expect(interviewPrepQueryKeys.byApplication("app-1")).toEqual([
      "interview-prep",
      "by-application",
      "app-1",
    ]);
    expect(interviewPrepQueryKeys.detail("s-1")).toEqual(["interview-prep", "detail", "s-1"]);
  });
});

describe("computePrepProgress", () => {
  it("derives real counts from server fields", () => {
    const progress = computePrepProgress(session());
    expect(progress).toEqual({ total: 6, prepared: 2, bookmarked: 0, remaining: 4 });
  });

  it("prefers question-level state when questions are loaded", () => {
    const progress = computePrepProgress(
      session({
        questions: [question(), question({ id: "q-2", is_prepared: true, is_bookmarked: true })],
      }),
    );
    expect(progress).toEqual({ total: 2, prepared: 1, bookmarked: 1, remaining: 1 });
  });

  it("never fabricates a readiness score", () => {
    const summary = progressSummary(computePrepProgress(session()));
    expect(summary).toBe("6 questions · 2 prepared · 4 remaining");
    expect(summary).not.toMatch(/readiness|score|%/i);
  });
});

describe("groupQuestionsByCategory", () => {
  it("groups while preserving category order", () => {
    const groups = groupQuestionsByCategory([
      question(),
      question({ id: "q-2", category: "behavioral", question: "Tell me about a conflict." }),
      question({ id: "q-3", category: "technical", question: "How do webhooks retry?" }),
    ]);
    expect(groups.map((g) => g.category)).toEqual(["technical", "behavioral"]);
    expect(groups[0].questions).toHaveLength(2);
    expect(groups[0].label).toBe("Technical");
  });
});

describe("filterQuestions", () => {
  const qs = [question(), question({ id: "q-2", category: "behavioral", is_prepared: true })];

  it("filters by category", () => {
    expect(filterQuestions(qs, { category: "behavioral", prepared: "all" })).toHaveLength(1);
  });

  it("filters remaining vs prepared", () => {
    expect(filterQuestions(qs, { prepared: "remaining" })).toHaveLength(1);
    expect(filterQuestions(qs, { prepared: "prepared" })).toHaveLength(1);
  });
});

describe("evidence helpers", () => {
  it("separates grounded evidence from the gap marker", () => {
    const q = question();
    expect(groundedEvidence(q)).toEqual([
      "Optimized PostgreSQL queries, reducing P99 latency by 35%.",
    ]);
    expect(hasEvidenceGap(q)).toBe(false);
  });

  it("flags questions that openly declare missing support", () => {
    const q = question({
      resume_evidence: [UNSUPPORTED_EVIDENCE_MARKER],
      talking_points: [],
      gaps: ["Kubernetes cluster operations"],
    });
    expect(groundedEvidence(q)).toEqual([]);
    expect(hasEvidenceGap(q)).toBe(true);
  });
});

describe("practiceQueue", () => {
  it("orders remaining questions before prepared ones", () => {
    const qs = [
      question({ id: "q-1", is_prepared: true, question_order: 0 }),
      question({ id: "q-2", is_prepared: false, question_order: 1 }),
      question({ id: "q-3", is_prepared: false, question_order: 0 }),
    ];
    expect(practiceQueue(qs).map((q) => q.id)).toEqual(["q-3", "q-2", "q-1"]);
  });
});

describe("session states", () => {
  it("represents generating, failed, and stale states truthfully", () => {
    expect(session({ status: "generating" }).status).toBe("generating");
    const failed = session({
      status: "failed",
      error: "AI preparation is temporarily unavailable. Please retry.",
    });
    expect(failed.error).toContain("Please retry");
    const stale = session({ is_stale: true, stale_reason: "The job description changed." });
    expect(stale.is_stale).toBe(true);
  });
});
