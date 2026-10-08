import { request } from "../utils/request";
import { LONG_REQUEST_TIMEOUT_MS } from "./config";
import { API_ENDPOINTS } from "../constants/api";

// ─── Live chat (POST /api/copilot/chat) ───────────────────────────────
// Matches the backend SuccessResponse envelope
// ({ success: true, data: {...} }) from app/models/copilot.py.
// The backend returns suggested_actions as plain label strings; chips
// populate the input when clicked.

export type CopilotChatRole = "user" | "assistant" | "system";

export type CopilotChatMessage = {
  role: CopilotChatRole;
  content: string;
};

export type CopilotChatContext = {
  current_page?: string;
  resume_id?: string;
  job_title?: string;
  company?: string;
  selected_text?: string;
  job_description?: string;
};

export type CopilotChatRequest = {
  messages: CopilotChatMessage[];
  context?: CopilotChatContext;
};

export type CopilotChatUsage = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
};

export type CopilotChatResponse = {
  message: string;
  suggested_actions: string[];
  provider?: string | null;
  model?: string | null;
  usage?: CopilotChatUsage | null;
};

export type CopilotChatEnvelope = {
  success: boolean;
  data: CopilotChatResponse;
};

export type CopilotApi = {
  sendChat: (req: CopilotChatRequest) => Promise<CopilotChatEnvelope>;
};

export const copilotApi: CopilotApi = {
  // Chat turns can invoke the LLM gateway (30s server budget), so opt into
  // the long-request timeout instead of the shared 30s default.
  sendChat: async (req: CopilotChatRequest) => {
    return request<CopilotChatEnvelope>({
      method: "POST",
      path: API_ENDPOINTS.COPILOT.CHAT,
      body: req,
      timeoutMs: LONG_REQUEST_TIMEOUT_MS,
    });
  },
};
