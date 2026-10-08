const isProduction =
  (typeof import.meta !== "undefined" && Boolean(import.meta.env?.PROD)) ||
  (typeof process !== "undefined" && process.env?.NODE_ENV === "production") ||
  (typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1");

const CANONICAL_PROD_API_URL = "https://career-os-kr9m.onrender.com";

const getEnv = (key: string, defaultValue?: string): string => {
  const processValue = typeof process !== "undefined" && process.env ? process.env[key] : undefined;
  if (processValue !== undefined && processValue !== "") {
    if (key === "VITE_API_BASE_URL" && isProduction && (processValue.includes("localhost") || processValue.includes("127.0.0.1"))) {
      return CANONICAL_PROD_API_URL;
    }
    return processValue;
  }

  const metaValue =
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env[key] : undefined;
  if (metaValue !== undefined && metaValue !== "") {
    if (key === "VITE_API_BASE_URL" && isProduction && (metaValue.includes("localhost") || metaValue.includes("127.0.0.1"))) {
      return CANONICAL_PROD_API_URL;
    }
    return metaValue;
  }
  if (defaultValue !== undefined) {
    if (key === "VITE_API_BASE_URL" && isProduction && (defaultValue.includes("localhost") || defaultValue.includes("127.0.0.1"))) {
      return CANONICAL_PROD_API_URL;
    }
    return defaultValue;
  }
  throw new Error(
    `Missing required environment variable: ${key}\n` +
      `Create a .env file in the project root with:\n` +
      `${key}=your_value`,
  );
};

export const env = {
  VITE_API_BASE_URL: getEnv("VITE_API_BASE_URL", "http://localhost:8000"),
  VITE_SUPABASE_URL: getEnv("VITE_SUPABASE_URL"),
  VITE_SUPABASE_ANON_KEY: getEnv("VITE_SUPABASE_ANON_KEY"),
} as const;

export type Env = typeof env;
