import { apiConfig } from "./config";
import type { ApiResponse } from "../types/api/ApiResponse.ts";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export type AuthApi = {
  login: (data: LoginRequest) => Promise<ApiResponse<LoginResponse>>;
  logout: () => Promise<ApiResponse<void>>;
  refreshToken: (refreshToken: string) => Promise<ApiResponse<{ accessToken: string }>>;
  getCurrentUser: () => Promise<ApiResponse<LoginResponse["user"]>>;
};

export const authApi: AuthApi = {
  login: async (data: LoginRequest) => {
    // TODO: Implement API call
    throw new Error("Not implemented");
  },

  logout: async () => {
    // TODO: Implement API call
    throw new Error("Not implemented");
  },

  refreshToken: async (refreshToken: string) => {
    // TODO: Implement API call
    throw new Error("Not implemented");
  },

  getCurrentUser: async () => {
    // TODO: Implement API call
    throw new Error("Not implemented");
  },
};
