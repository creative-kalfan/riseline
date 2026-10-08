export type TailoringOpportunityCard = {
  id: string;
  requirementId: string;
  displayLabel: string;
  friendlyTitle: string;
  friendlyPrompt: string;
  friendlyHelper: string;
  contextOptions: string[];
  confidence: number;
  status: string;
};

export type TailoringOpportunitiesResponse = {
  success: boolean;
  heading: string;
  subheading: string;
  selectHint: string;
  inputLabel: string;
  inputPlaceholder: string;
  skipLabel: string;
  submitLabel: string;
  opportunities: TailoringOpportunityCard[];
  message: string;
};

export type ConfirmedExperienceFact = {
  id: string;
  opportunityId: string;
  requirementId: string;
  displayLabel: string;
  candidateContext: string;
  candidateDescription: string;
  projectName: string | null;
  provenance: string;
  confidence: number;
};

export type TailoringEvidenceImpact = {
  baselineScore: number;
  tailoredScore: number;
  delta: number;
  materiallyImproved: boolean;
  headline: string;
  improvements: string[];
  explanation: string;
};

export type TailoringRespondResponse = {
  success: boolean;
  facts: ConfirmedExperienceFact[];
  declinedIds: string[];
  needsClarification: string | null;
  successNote: string;
  tailoredProfile: Record<string, unknown>;
  plan: import("./optimization").TailoringPlanItem[];
  impact: TailoringEvidenceImpact;
  guardIssues: string[];
  message: string;
};
