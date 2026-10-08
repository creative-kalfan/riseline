import { test as setup } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.resolve(__dirname, "../../playwright/.auth/user.json");

setup("authenticate with Supabase", async ({ request }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!email || !password) {
    throw new Error(
      "Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in environment variables.",
    );
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / VITE_SUPABASE_URL or anon key in environment variables.",
    );
  }

  // Get session via Supabase REST — no browser spinner, no UI dependency.
  const res = await request.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
      data: { email, password },
    },
  );

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Supabase sign-in failed (${res.status()}): ${body}`);
  }

  const session = await res.json();
  const { access_token, refresh_token, expires_in, expires_at, user } = session;

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  // Seed the session into localStorage under the key supabase-js uses.
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  const storageValue = JSON.stringify({
    access_token,
    refresh_token,
    expires_in,
    expires_at,
    token_type: "bearer",
    user,
  });

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: "http://localhost:8080",
        localStorage: [{ name: storageKey, value: storageValue }],
      },
    ],
  };

  fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
});
