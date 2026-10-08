import { request } from "../utils/request";
import { LONG_REQUEST_TIMEOUT_MS } from "./config";
import { API_ENDPOINTS } from "../constants/api";
import type {
  GenerateOptimizationResponse,
  SuggestionActionResponse,
  OptimizationSession,
  OptimizationSuggestion,
  OptimizationSuggestionRecord,
  OptimizationHistoryItem,
  ReanalyzeResponse,
  GenerateSkillsOptimizationResponse,
  GenerateSummaryOptimizationResponse,
  GenerateExperienceBulletOptimizationResponse,
  TailorResumeRequest,
  TailorResumeResponse,
} from "../types/optimization";
import type {
  ConfirmedExperienceFact,
  TailoringEvidenceImpact,
  TailoringOpportunitiesResponse,
  TailoringOpportunityCard,
  TailoringRespondResponse,
} from "../types/tailoring-evidence";

// Backend returns snake_case; frontend expects camelCase. Map once here.
function mapSuggestion(raw: Record<string, unknown>): OptimizationSuggestion {
  return {
    id: String(raw.id ?? ""),
    type: String(raw.type ?? "professional_summary") as OptimizationSuggestion["type"],
    priority: String(raw.priority ?? "medium") as OptimizationSuggestion["priority"],
    section: (raw.section as string) ?? null,
    entryId: (raw.entry_id as string) ?? (raw.entryId as string) ?? null,
    childId: (raw.child_id as string) ?? (raw.childId as string) ?? null,
    currentText: (raw.current_text as string) ?? (raw.currentText as string) ?? null,
    suggestedText: (raw.suggested_text as string) ?? (raw.suggestedText as string) ?? null,
    explanation: String(raw.explanation ?? ""),
    evidence: Array.isArray(raw.evidence) ? (raw.evidence as string[]) : [],
    affectedKeywords: Array.isArray(raw.affected_keywords)
      ? (raw.affected_keywords as string[])
      : Array.isArray(raw.affectedKeywords)
        ? (raw.affectedKeywords as string[])
        : [],
    category: (raw.category as OptimizationSuggestion["category"]) ?? null,
    action: (raw.action as OptimizationSuggestion["action"]) ?? null,
    skill: (raw.skill as string) ?? null,
    similarInResume: (raw.similar_in_resume as string) ?? (raw.similarInResume as string) ?? null,
    status: String(raw.status ?? "pending") as OptimizationSuggestion["status"],
    evidenceIssues: Array.isArray(raw.evidence_issues)
      ? (raw.evidence_issues as string[])
      : Array.isArray(raw.evidenceIssues)
        ? (raw.evidenceIssues as string[])
        : [],
    createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
    updatedAt: String(raw.updated_at ?? raw.updatedAt ?? ""),
  };
}

function mapSuggestionRecord(raw: Record<string, unknown>): OptimizationSuggestionRecord {
  return {
    id: String(raw.id ?? ""),
    sessionId: String(raw.session_id ?? raw.sessionId ?? ""),
    suggestion: mapSuggestion((raw.suggestion as Record<string, unknown>) ?? {}),
    resumeSnapshot:
      (raw.resume_snapshot as Record<string, unknown>) ??
      (raw.resumeSnapshot as Record<string, unknown>) ??
      null,
    applied: Boolean(raw.applied),
    appliedAt: (raw.applied_at as string) ?? (raw.appliedAt as string) ?? null,
    createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
    updatedAt: String(raw.updated_at ?? raw.updatedAt ?? ""),
  };
}

function mapSession(raw: Record<string, unknown>): OptimizationSession {
  return {
    id: String(raw.id ?? ""),
    resumeId: String(raw.resume_id ?? raw.resumeId ?? ""),
    atsReportId: (raw.ats_report_id as string) ?? (raw.atsReportId as string) ?? null,
    jobTitle: (raw.job_title as string) ?? (raw.jobTitle as string) ?? null,
    company: (raw.company as string) ?? null,
    jobDescription: String(raw.job_description ?? raw.jobDescription ?? ""),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
    updatedAt: String(raw.updated_at ?? raw.updatedAt ?? ""),
    status: String(raw.status ?? "active") as OptimizationSession["status"],
    suggestionsGenerated: Number(raw.suggestions_generated ?? raw.suggestionsGenerated ?? 0),
    suggestions: ((raw.suggestions as unknown[]) ?? []).map((r) =>
      mapSuggestionRecord(r as Record<string, unknown>),
    ),
    suggestionsAccepted: Number(raw.suggestions_accepted ?? raw.suggestionsAccepted ?? 0),
    suggestionsRejected: Number(raw.suggestions_rejected ?? raw.suggestionsRejected ?? 0),
    currentAtsScore: (raw.current_ats_score as number) ?? (raw.currentAtsScore as number) ?? null,
    baselineAtsScore:
      (raw.baseline_ats_score as number) ?? (raw.baselineAtsScore as number) ?? null,
    targetJobTitle: (raw.target_job_title as string) ?? (raw.targetJobTitle as string) ?? null,
    targetCompany: (raw.target_company as string) ?? (raw.targetCompany as string) ?? null,
  };
}

function mapHistoryItem(raw: Record<string, unknown>): OptimizationHistoryItem {
  return {
    sessionId: String(raw.session_id ?? raw.sessionId ?? ""),
    jobTitle: (raw.job_title as string) ?? (raw.jobTitle as string) ?? null,
    company: (raw.company as string) ?? null,
    baselineScore: (raw.baseline_score as number) ?? (raw.baselineScore as number) ?? null,
    finalScore: (raw.final_score as number) ?? (raw.finalScore as number) ?? null,
    suggestionsCount: Number(raw.suggestions_count ?? raw.suggestionsCount ?? 0),
    acceptedCount: Number(raw.accepted_count ?? raw.acceptedCount ?? 0),
    rejectedCount: Number(raw.rejected_count ?? raw.rejectedCount ?? 0),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
    status: String(raw.status ?? ""),
  };
}

function mapGenerateResponse(raw: Record<string, unknown>): {
  sessionId: string;
  suggestions: OptimizationSuggestion[];
  message: string;
  evidenceIssues: string[];
} {
  return {
    sessionId: String(raw.session_id ?? ""),
    suggestions: ((raw.suggestions as unknown[]) ?? []).map((s) =>
      mapSuggestion(s as Record<string, unknown>),
    ),
    message: String(raw.message ?? ""),
    evidenceIssues: Array.isArray(raw.evidence_issues) ? (raw.evidence_issues as string[]) : [],
  };
}

function mapTailorResponse(raw: Record<string, unknown>): TailorResumeResponse {
  const rawPlan = Array.isArray(raw.plan) ? raw.plan : [];
  const rawScore = (raw.score_comparison || raw.scoreComparison || {}) as Record<string, unknown>;
  return {
    success: Boolean(raw.success),
    plan: rawPlan.map((p: any) => ({
      section: String(p.section ?? ""),
      action: String(p.action ?? "ALIGN"),
      targetId: p.target_id ?? p.targetId ?? null,
      currentText: p.current_text ?? p.currentText ?? null,
      suggestedText: p.suggested_text ?? p.suggestedText ?? null,
      reasoning: String(p.reasoning ?? ""),
      keywordsAddressed: Array.isArray(p.keywords_addressed)
        ? p.keywords_addressed
        : Array.isArray(p.keywordsAddressed)
          ? p.keywordsAddressed
          : [],
    })),
    tailoredProfile: (raw.tailored_profile ?? raw.tailoredProfile ?? {}) as Record<string, unknown>,
    scoreComparison: {
      baselineScore: Number(rawScore.baseline_score ?? rawScore.baselineScore ?? 0),
      tailoredScore: Number(rawScore.tailored_score ?? rawScore.tailoredScore ?? 0),
      delta: Number(rawScore.delta ?? 0),
      matchedKeywordsCount: Number(
        rawScore.matched_keywords_count ?? rawScore.matchedKeywordsCount ?? 0,
      ),
      missingKeywordsCount: Number(
        rawScore.missing_keywords_count ?? rawScore.missingKeywordsCount ?? 0,
      ),
    },
    message: String(raw.message ?? ""),
    limitedAlignment: Boolean(raw.limited_alignment ?? raw.limitedAlignment ?? false),
    alignmentMessage: (raw.alignment_message ?? raw.alignmentMessage ?? null) as string | null,
  };
}

export const optimizationApi = {
  generate: async (data: {
    resumeId: string;
    versionId?: string;
    jobDescription: string;
    jobTitle?: string;
    company?: string;
    atsReportId?: string;
  }): Promise<GenerateOptimizationResponse> => {
    const raw = await request<Record<string, unknown>>({
      method: "POST",
      path: API_ENDPOINTS.OPTIMIZATION.GENERATE,
      body: data,
    });
    return mapGenerateResponse(raw) as GenerateOptimizationResponse;
  },

  generateSkills: async (data: {
    resumeId: string;
    versionId?: string;
    jobDescription: string;
    jobTitle?: string;
    company?: string;
  }): Promise<GenerateSkillsOptimizationResponse> => {
    const raw = await request<Record<string, unknown>>({
      method: "POST",
      path: "/api/optimization/skills/generate",
      body: data,
      // Single LLM call with a 25s server-side budget plus session
      // persistence — can exceed the 30s default under load.
      timeoutMs: LONG_REQUEST_TIMEOUT_MS,
    });
    return mapGenerateResponse(raw) as GenerateSkillsOptimizationResponse;
  },

  generateSummary: async (data: {
    resumeId: string;
    versionId?: string;
    jobDescription: string;
    jobTitle?: string;
    company?: string;
  }): Promise<GenerateSummaryOptimizationResponse> => {
    const raw = await request<Record<string, unknown>>({
      method: "POST",
      path: "/api/optimization/summary/generate",
      body: data,
      timeoutMs: LONG_REQUEST_TIMEOUT_MS,
    });
    return mapGenerateResponse(raw) as GenerateSummaryOptimizationResponse;
  },

  generateExperienceBullet: async (data: {
    resumeId: string;
    versionId?: string;
    jobDescription: string;
    jobTitle?: string;
    company?: string;
    entryId: string;
    bulletId: string;
    bulletText: string;
  }): Promise<GenerateExperienceBulletOptimizationResponse> => {
    const raw = await request<Record<string, unknown>>({
      method: "POST",
      path: "/api/optimization/experience/bullet/generate",
      body: data,
      timeoutMs: LONG_REQUEST_TIMEOUT_MS,
    });
    return mapGenerateResponse(raw) as GenerateExperienceBulletOptimizationResponse;
  },

  accept: async (data: {
    sessionId: string;
    suggestionId: string;
    editedText?: string;
  }): Promise<SuggestionActionResponse> => {
    const raw = await request<Record<string, unknown>>({
      method: "POST",
      path: API_ENDPOINTS.OPTIMIZATION.ACCEPT,
      body: data,
    });
    return {
      success: Boolean(raw.success),
      suggestionId: String(raw.suggestion_id ?? raw.suggestionId ?? data.suggestionId),
      status: String(raw.status ?? "accepted") as SuggestionActionResponse["status"],
      updatedResume:
        (raw.updated_resume as Record<string, unknown>) ??
        (raw.updatedResume as Record<string, unknown>) ??
        null,
      message: String(raw.message ?? ""),
    } as SuggestionActionResponse;
  },

  reject: async (data: {
    sessionId: string;
    suggestionId: string;
    reason?: string;
  }): Promise<SuggestionActionResponse> => {
    const raw = await request<Record<string, unknown>>({
      method: "POST",
      path: API_ENDPOINTS.OPTIMIZATION.REJECT,
      body: data,
    });
    return {
      success: Boolean(raw.success),
      suggestionId: String(raw.suggestion_id ?? raw.suggestionId ?? data.suggestionId),
      status: "rejected" as SuggestionActionResponse["status"],
      updatedResume: null,
      message: String(raw.message ?? ""),
    } as SuggestionActionResponse;
  },

  getSession: async (
    sessionId: string,
  ): Promise<{ session: OptimizationSession; suggestions: OptimizationSession["suggestions"] }> => {
    const raw = await request<Record<string, unknown>>({
      method: "GET",
      path: API_ENDPOINTS.OPTIMIZATION.SESSION(sessionId),
    });
    const session = mapSession((raw.session as Record<string, unknown>) ?? {});
    const suggestions = ((raw.suggestions as unknown[]) ?? []).map((r) =>
      mapSuggestionRecord(r as Record<string, unknown>),
    );
    return { session, suggestions };
  },

  getSessions: async (resumeId: string): Promise<{ sessions: OptimizationSession[] }> => {
    const raw = await request<Record<string, unknown>>({
      method: "GET",
      path: API_ENDPOINTS.OPTIMIZATION.SESSIONS(resumeId),
    });
    const sessions = ((raw.sessions as unknown[]) ?? []).map((s) =>
      mapSession(s as Record<string, unknown>),
    );
    return { sessions };
  },

  getHistory: async (resumeId: string): Promise<{ history: OptimizationHistoryItem[] }> => {
    const raw = await request<Record<string, unknown>>({
      method: "GET",
      path: API_ENDPOINTS.OPTIMIZATION.HISTORY(resumeId),
    });
    const history = ((raw.history as unknown[]) ?? []).map((h) =>
      mapHistoryItem(h as Record<string, unknown>),
    );
    return { history };
  },

  reanalyze: async (data: {
    resumeId: string;
    sessionId: string;
    jobDescription: string;
    jobTitle?: string;
    company?: string;
  }): Promise<ReanalyzeResponse> => {
    const raw = await request<Record<string, unknown>>({
      method: "POST",
      path: API_ENDPOINTS.OPTIMIZATION.REANALYZE,
      body: data,
    });
    return {
      previousScore: Number(raw.previous_score ?? raw.previousScore ?? 0),
      currentScore: Number(raw.current_score ?? raw.currentScore ?? 0),
      delta: Number(raw.delta ?? 0),
      reportId: String(raw.report_id ?? raw.reportId ?? ""),
      message: String(raw.message ?? ""),
    } as ReanalyzeResponse;
  },

  tailor: async (data: TailorResumeRequest): Promise<TailorResumeResponse> => {
    const raw = await request<Record<string, unknown>>({
      method: "POST",
      path: "/api/optimization/tailor",
      body: data,
      // Tailoring invokes the LLM gateway (up to ~25s per call, several calls
      // per pass) plus two ATS analyses — well beyond the 30s default.
      timeoutMs: LONG_REQUEST_TIMEOUT_MS,
    });
    return mapTailorResponse(raw);
  },

  tailorWholeResume: async (data: TailorResumeRequest): Promise<TailorResumeResponse> => {
    const raw = await request<Record<string, unknown>>({
      method: "POST",
      path: "/api/optimization/tailor",
      body: data,
      timeoutMs: LONG_REQUEST_TIMEOUT_MS,
    });
    return mapTailorResponse(raw);
  },
};

function mapOpportunityCard(raw: Record<string, unknown>): TailoringOpportunityCard {
  return {
    id: String(raw.id ?? ""),
    requirementId: String(raw.requirement_id ?? raw.requirementId ?? ""),
    displayLabel: String(raw.display_label ?? raw.displayLabel ?? ""),
    friendlyTitle: String(
      raw.friendly_title ?? raw.friendlyTitle ?? raw.display_label ?? raw.displayLabel ?? "",
    ),
    friendlyPrompt: String(raw.friendly_prompt ?? raw.friendlyPrompt ?? ""),
    friendlyHelper: String(raw.friendly_helper ?? raw.friendlyHelper ?? ""),
    contextOptions: Array.isArray(raw.context_options)
      ? (raw.context_options as string[])
      : Array.isArray(raw.contextOptions)
        ? (raw.contextOptions as string[])
        : [],
    confidence: Number(raw.confidence ?? 0),
    status: String(raw.status ?? "pending"),
  };
}

function mapEvidenceImpact(raw: Record<string, unknown>): TailoringEvidenceImpact {
  return {
    baselineScore: Number(raw.baseline_score ?? raw.baselineScore ?? 0),
    tailoredScore: Number(raw.tailored_score ?? raw.tailoredScore ?? 0),
    delta: Number(raw.delta ?? 0),
    materiallyImproved: Boolean(raw.materially_improved ?? raw.materiallyImproved ?? false),
    headline: String(raw.headline ?? ""),
    improvements: Array.isArray(raw.improvements) ? (raw.improvements as string[]) : [],
    explanation: String(raw.explanation ?? ""),
  };
}

function mapRespondResponse(raw: Record<string, unknown>): TailoringRespondResponse {
  const rawFacts = Array.isArray(raw.facts) ? raw.facts : [];
  const rawPlan = Array.isArray(raw.plan) ? raw.plan : [];
  return {
    success: Boolean(raw.success),
    facts: (rawFacts as Record<string, unknown>[]).map(
      (f): ConfirmedExperienceFact => ({
        id: String(f.id ?? ""),
        opportunityId: String(f.opportunity_id ?? f.opportunityId ?? ""),
        requirementId: String(f.requirement_id ?? f.requirementId ?? ""),
        displayLabel: String(f.display_label ?? f.displayLabel ?? ""),
        candidateContext: String(f.candidate_context ?? f.candidateContext ?? "other"),
        candidateDescription: String(
          f.candidate_description ?? f.candidateDescription ?? "",
        ),
        projectName:
          (f.project_name as string) ?? (f.projectName as string) ?? null,
        provenance: String(f.provenance ?? "candidate_confirmed"),
        confidence: Number(f.confidence ?? 0),
      }),
    ),
    declinedIds: Array.isArray(raw.declined_ids)
      ? (raw.declined_ids as string[])
      : Array.isArray(raw.declinedIds)
        ? (raw.declinedIds as string[])
        : [],
    needsClarification:
      (raw.needs_clarification as string) ?? (raw.needsClarification as string) ?? null,
    successNote: String(raw.success_note ?? raw.successNote ?? ""),
    tailoredProfile: (raw.tailored_profile ?? raw.tailoredProfile ?? {}) as Record<
      string,
      unknown
    >,
    plan: (rawPlan as any[]).map((p) => ({
      section: String(p.section ?? ""),
      action: String(p.action ?? "ALIGN"),
      targetId: p.target_id ?? p.targetId ?? null,
      currentText: p.current_text ?? p.currentText ?? null,
      suggestedText: p.suggested_text ?? p.suggestedText ?? null,
      reasoning: String(p.reasoning ?? ""),
      keywordsAddressed: Array.isArray(p.keywords_addressed)
        ? p.keywords_addressed
        : Array.isArray(p.keywordsAddressed)
          ? p.keywordsAddressed
          : [],
    })),
    impact: mapEvidenceImpact(
      (raw.impact ?? {}) as Record<string, unknown>,
    ),
    guardIssues: Array.isArray(raw.guard_issues)
      ? (raw.guard_issues as string[])
      : Array.isArray(raw.guardIssues)
        ? (raw.guardIssues as string[])
        : [],
    message: String(raw.message ?? ""),
  };
}

export const tailoringEvidenceApi = {
  opportunities: async (data: {
    resumeId?: string;
    versionId?: string;
    jobDescription: string;
    jobTitle?: string;
    company?: string;
    content?: Record<string, unknown>;
    maxOpportunities?: number;
    knownFactKeys?: string[];
    declinedRequirementIds?: string[];
  }): Promise<TailoringOpportunitiesResponse> => {
    const raw = await request<Record<string, unknown>>({
      method: "POST",
      path: "/api/optimization/tailoring-evidence/opportunities",
      body: data,
    });
    return {
      success: Boolean(raw.success),
      heading: String(raw.heading ?? ""),
      subheading: String(raw.subheading ?? ""),
      selectHint: String(raw.select_hint ?? raw.selectHint ?? ""),
      inputLabel: String(raw.input_label ?? raw.inputLabel ?? ""),
      inputPlaceholder: String(
        raw.input_placeholder ?? raw.inputPlaceholder ?? "",
      ),
      skipLabel: String(raw.skip_label ?? raw.skipLabel ?? ""),
      submitLabel: String(raw.submit_label ?? raw.submitLabel ?? ""),
      opportunities: ((raw.opportunities as unknown[]) ?? []).map((o) =>
        mapOpportunityCard(o as Record<string, unknown>),
      ),
      message: String(raw.message ?? ""),
    };
  },

  respond: async (data: {
    resumeId?: string;
    versionId?: string;
    jobDescription: string;
    jobTitle?: string;
    company?: string;
    content?: Record<string, unknown>;
    opportunities: TailoringOpportunityCard[];
    selectedIds: string[];
    freeText: string;
    contextHints?: Record<string, string>;
  }): Promise<TailoringRespondResponse> => {
    const raw = await request<Record<string, unknown>>({
      method: "POST",
      path: "/api/optimization/tailoring-evidence/respond",
      body: data,
      // Respond re-runs universal tailoring plus two ATS analyses —
      // well beyond the 30s default.
      timeoutMs: LONG_REQUEST_TIMEOUT_MS,
    });
    return mapRespondResponse(raw);
  },
};

