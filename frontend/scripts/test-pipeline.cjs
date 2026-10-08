const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://wjayvttrifpqtjloeunc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqYXl2dHRyaWZwcXRqbG9ldW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MDYwMTQsImV4cCI6MjA5OTQ4MjAxNH0.sK3khuaKTwA6WfJMVQfmMJzHYvEqTXxGjCOuEdxRFMk";

(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log("=== STEP 1: Query companies ===");
  const c1 = await supabase.from("companies").select("*").limit(5);
  console.log("ERROR:", c1.error ? JSON.stringify(c1.error) : "null");
  console.log("DATA:", JSON.stringify(c1.data, null, 2));
  console.log("COUNT:", c1.data?.length ?? 0);

  console.log("\n=== STEP 2: Query jobs (raw) ===");
  const j1 = await supabase.from("jobs").select("*").limit(5);
  console.log("ERROR:", j1.error ? JSON.stringify(j1.error) : "null");
  console.log("DATA:", JSON.stringify(j1.data, null, 2));
  console.log("COUNT:", j1.data?.length ?? 0);

  if (j1.data && j1.data.length > 0) {
    console.log("\n=== STEP 3: Check first job fields ===");
    console.log("company_id:", j1.data[0].company_id);
    console.log("title:", j1.data[0].title);
    console.log("Has companyName:", "companyName" in j1.data[0]);
  }

  console.log("\n=== STEP 4: Query with JOIN ===");
  const j2 = await supabase.from("jobs").select("*, companies!left(name)").limit(5);
  console.log("ERROR:", j2.error ? JSON.stringify(j2.error) : "null");
  if (j2.data && j2.data.length > 0) {
    console.log("First joined:", JSON.stringify(j2.data[0], null, 2));
    console.log("Company name:", j2.data[0].companies?.name);
  } else {
    console.log("No joined results");
  }

  console.log("\n=== STEP 5: Check API endpoints ===");
  for (const port of [3000, 3001]) {
    try {
      const r = await fetch(`http://localhost:${port}/api/jobs`);
      const t = await r.text();
      console.log(`Port ${port} status:`, r.status);
      console.log(`Port ${port} body:`, t.substring(0, 500));
    } catch (e) {
      console.log(`Port ${port} error:`, e.message);
    }
  }
})().catch((e) => console.error("FATAL:", e));
