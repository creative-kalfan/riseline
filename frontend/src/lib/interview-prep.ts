// Pure helpers for the Interview Preparation domain.
// Kept free of network/query imports so they are cheap to unit test.

import type {
  InterviewPrepCategory,
  InterviewPrepQuestion,
  InterviewPrepSession,
} from "../types/interview-prep";
import { categoryLabel } from "../types/interview-prep";

export const UNSUPPORTED_EVIDENCE_MARKER = "Not supported by current resume evidence.";

export interface PrepProgress {
  total: number;
  prepared: number;
  bookmarked: number;
  remaining: number;
}

/** Transparent progress counts — never a fabricated readiness percentage. */
export function computePrepProgress(
  session: Pick<InterviewPrepSession, "remaining" | "question_count"> & {
    prepared_count?: number;
    prepared_total?: number;
    bookmarked_total?: number;
    questions?: Pick<InterviewPrepQuestion, "is_prepared" | "is_bookmarked">[];
  },
): PrepProgress {
  if (session.questions) {
    const prepared = session.questions.filter((q) => q.is_prepared).length;
    const bookmarked = session.questions.filter((q) => q.is_bookmarked).length;
    return {
      total: session.questions.length,
      prepared,
      bookmarked,
      remaining: session.questions.length - prepared,
    };
  }
  const total = session.question_count ?? 0;
  const prepared = session.prepared_total ?? session.prepared_count ?? 0;
  return {
    total,
    prepared,
    bookmarked: session.bookmarked_total ?? 0,
    remaining: session.remaining ?? Math.max(0, total - prepared),
  };
}

export function progressSummary(progress: PrepProgress): string {
  const parts = [`${progress.total} questions`, `${progress.prepared} prepared`];
  if (progress.bookmarked > 0) parts.push(`${progress.bookmarked} bookmarked`);
  parts.push(`${progress.remaining} remaining`);
  return parts.join(" · ");
}

/** Group questions by category, preserving first-seen category order. */
export function groupQuestionsByCategory(
  questions: InterviewPrepQuestion[],
): { category: InterviewPrepCategory; label: string; questions: InterviewPrepQuestion[] }[] {
  const groups = new Map<InterviewPrepCategory, InterviewPrepQuestion[]>();
  for (const q of questions) {
    const list = groups.get(q.category) ?? [];
    list.push(q);
    groups.set(q.category, list);
  }
  return [...groups.entries()].map(([category, qs]) => ({
    category,
    label: categoryLabel(category),
    questions: qs,
  }));
}

/** Filter questions by category and/or prepared state. */
export function filterQuestions(
  questions: InterviewPrepQuestion[],
  opts: { category?: InterviewPrepCategory | "all"; prepared?: "all" | "prepared" | "remaining" },
): InterviewPrepQuestion[] {
  return questions.filter((q) => {
    if (opts.category && opts.category !== "all" && q.category !== opts.category) return false;
    if (opts.prepared === "prepared" && !q.is_prepared) return false;
    if (opts.prepared === "remaining" && q.is_prepared) return false;
    return true;
  });
}

/** Evidence strings that carry real resume grounding (not the gap marker). */
export function groundedEvidence(question: InterviewPrepQuestion): string[] {
  return (question.resume_evidence ?? []).filter((e) => e !== UNSUPPORTED_EVIDENCE_MARKER);
}

/** True when the question openly declares missing resume support. */
export function hasEvidenceGap(question: InterviewPrepQuestion): boolean {
  return (
    (question.resume_evidence ?? []).includes(UNSUPPORTED_EVIDENCE_MARKER) ||
    (question.gaps ?? []).length > 0
  );
}

/** Ordered practice queue: remaining questions first, then prepared ones. */
export function practiceQueue(questions: InterviewPrepQuestion[]): InterviewPrepQuestion[] {
  return [...questions].sort((a, b) => {
    if (a.is_prepared !== b.is_prepared) return a.is_prepared ? 1 : -1;
    return (a.question_order ?? 0) - (b.question_order ?? 0);
  });
}
