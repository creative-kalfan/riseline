export type ApiError = {
  message: string;
  code?: string;
  statusCode: number;
  // Structured backend payload (e.g. a string[] of guard issues). Widened
  // from Record<string, unknown> so array details are representable.
  details?: unknown;
};
