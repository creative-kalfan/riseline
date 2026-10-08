import type { ApiError } from "../types/api/ApiError.ts";

export class ApiClientError extends Error {
  public readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = "ApiClientError";
    this.apiError = apiError;
  }

  get statusCode(): number {
    return this.apiError.statusCode;
  }

  get code(): string | undefined {
    return this.apiError.code;
  }

  get details(): unknown {
    return this.apiError.details;
  }
}

export const isApiError = (error: unknown): error is ApiClientError => {
  return error instanceof ApiClientError;
};

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};
