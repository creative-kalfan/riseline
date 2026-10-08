import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

// Both values are guaranteed non-empty by env.ts which throws at import time
// if they are missing
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
