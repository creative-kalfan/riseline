// scripts/check-tokens.mjs — fail on raw color literals outside the token file.
// D1 scope: rebuilt primitives/shell only (ui/**, app/**, lib/theme, root/app
// routes, dev route). Scope expands to all routes/components in D2–D4 once the
// landing/resume screens are rebuilt. Mirrored by src/lib/token-guard.test.ts.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SCOPED_DIRS = ["src/components/ui", "src/components/app"];
export const SCOPED_FILES = [
  "src/lib/theme.tsx",
  "src/routes/__root.tsx",
  "src/routes/_app.tsx",
  "src/routes/dev.ui.tsx",
];
// chart.tsx is shadcn/recharts code owned by the D4 dependency audit.
const EXCLUDE = new Set(["src/components/ui/chart.tsx"]);
const ALLOW_FILES = new Set(["src/lib/contrast.test.ts", "src/lib/token-guard.test.ts"]);

const LITERAL =
  /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|bg-\[#|text-\[#|border-\[#|from-\[|via-\[|to-\[/;

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = resolve(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(e)) out.push(p);
  }
  return out;
}

const files = [
  ...SCOPED_DIRS.flatMap((d) => walk(resolve(root, d))),
  ...SCOPED_FILES.map((f) => resolve(root, f)),
].filter((f) => {
  try { return statSync(f).isFile(); } catch { return false; }
});

let violations = 0;
for (const f of files) {
  const rel = f.slice(root.length + 1).replace(/\\/g, "/");
  if (ALLOW_FILES.has(rel) || EXCLUDE.has(rel)) continue;
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    // theme-color meta requires a literal hex for browser chrome; values mirror --bg.
    if (line.includes("theme-color")) return;
    if (LITERAL.test(line)) {
      console.error(`${rel}:${i + 1}: raw color literal: ${line.trim().slice(0, 100)}`);
      violations++;
    }
  });
}
if (violations > 0) {
  console.error(`\n${violations} raw color literal(s) — use semantic tokens from styles.css.`);
  process.exit(1);
}
console.log("Token gate clean (D1 scope).");
