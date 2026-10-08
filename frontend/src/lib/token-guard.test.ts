// Token gate — Vitest mirror of scripts/check-tokens.mjs (D1 scope).
// Rebuilt primitives/shell must be token-exclusive. Scope expands in D2–D4.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const DIRS = ["src/components/ui", "src/components/app"];
const FILES = [
  "src/lib/theme.tsx",
  "src/routes/__root.tsx",
  "src/routes/_app.tsx",
  "src/routes/dev.ui.tsx",
];
// chart.tsx is shadcn/recharts code owned by the D4 dependency audit.
const EXCLUDE = new Set(["src/components/ui/chart.tsx"]);
const ALLOW = new Set(["src/lib/contrast.test.ts", "src/lib/token-guard.test.ts"]);

const LITERAL =
  /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|bg-\[#|text-\[#|border-\[#|from-\[|via-\[|to-\[/;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = resolve(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(e)) out.push(p);
  }
  return out;
}

describe("token exclusivity (D1 scope)", () => {
  it("has no raw color literals in rebuilt primitives/shell", () => {
    const files = [
      ...DIRS.flatMap((d) => walk(resolve(root, d))),
      ...FILES.map((f) => resolve(root, f)),
    ].filter((f) => {
      try {
        return statSync(f).isFile();
      } catch {
        return false;
      }
    });
    const hits: string[] = [];
    for (const f of files) {
      const rel = f.slice(root.length + 1).replace(/\\/g, "/");
      if (ALLOW.has(rel) || EXCLUDE.has(rel)) continue;
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((line, i) => {
          // theme-color meta requires a literal hex for browser chrome; values mirror --bg.
          if (line.includes("theme-color")) return;
          if (LITERAL.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 80)}`);
        });
    }
    expect(hits, hits.join("\n")).toEqual([]);
  });
});
