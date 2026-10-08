// scripts/check-bundle-budget.mjs — CI gate against first-paint JS/CSS regressions.
//
// Reads the production client assets (Vercel output preferred) and asserts
// per-chunk raw+gzip caps. The raw caps on the dashboard/resume route chunks
// are the actual enforcement for the lazy splits: if three.js were
// statically imported into the dashboard route again, or pdfjs-dist into the
// resume route, those chunks would blow past their raw caps immediately.
// Run after `npm run build`: `node scripts/check-bundle-budget.mjs`.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidates = [
  ".vercel/output/static/assets", // Nitro vercel preset (authoritative prod)
  "dist/assets", // plain Vite SPA output
  ".output/public/assets", // legacy Nitro output (pre-vercel-preset builds)
];
const assetsDir = candidates.map((c) => resolve(root, c)).find((d) => existsSync(d));
if (!assetsDir) {
  console.error(
    `FAIL: no build output found (tried ${candidates.join(", ")}). Run \`npm run build\` first.`,
  );
  process.exit(1);
}

const files = readdirSync(assetsDir).filter((f) => /\.(js|css)$/.test(f));
const assets = files.map((f) => {
  const bytes = readFileSync(join(assetsDir, f));
  return { file: f, rawKb: bytes.length / 1024, gzipKb: gzipSync(bytes).length / 1024 };
});
const byPrefix = (prefix, ext = ".js") =>
  assets.filter((a) => a.file.startsWith(prefix) && a.file.endsWith(ext));

// [label, assets, metric, maxKb] — ~30% headroom over 2026-10-06 measured
// values so the gate fails on real regressions (re-added static heavies),
// not on hashing noise. Tighten, never loosen, without a perf note.
const find = (prefix, ext) => {
  const hits = byPrefix(prefix, ext);
  if (hits.length === 0) throw new Error(`budget gate: no asset found for prefix "${prefix}"`);
  // Multiple code-split pieces can share a route prefix (e.g. a shared
  // chunk); the route chunk is the largest. Budget the largest piece.
  hits.sort((a, b) => b.rawKb - a.rawKb);
  if (hits.length > 1) {
    console.log(
      `info prefix "${prefix}" matched ${hits.length} pieces; budgeting largest ${hits[0].file}`,
    );
  }
  return hits[0];
};

const css = assets.filter((a) => a.file.endsWith(".css"));
const cssTotal = css.reduce((s, a) => s + a.gzipKb, 0);
const largest = assets.reduce((m, a) => (a.gzipKb > m.gzipKb ? a : m), assets[0]);

const dashboard = find("_app.dashboard");
const resume = find("_app.resumes._id");
const landing = find("index");
const shell = find("_app-", ".js");
const topology = find("career-3d-topology");
const pdfPreview = find("pdf-canvas-preview");

const checks = [
  ["dashboard route raw (no static three.js)", dashboard.rawKb, 60],
  ["dashboard route gzip", dashboard.gzipKb, 20],
  ["resume route raw (no static pdfjs)", resume.rawKb, 250],
  ["resume route gzip", resume.gzipKb, 60],
  ["landing chunk gzip", landing.gzipKb, 150],
  ["app shell chunk gzip", shell.gzipKb, 40],
  ["3D topology on-demand chunk gzip", topology.gzipKb, 170],
  ["PDF preview on-demand chunk gzip", pdfPreview.gzipKb, 130],
  ["total CSS gzip", cssTotal, 40],
  ["largest single asset gzip", largest.gzipKb, 180],
];

let failed = 0;
for (const [label, value, max] of checks) {
  const ok = value <= max;
  if (!ok) failed++;
  console.log(`${ok ? "ok" : "FAIL"} ${label}: ${value.toFixed(1)}kb (max ${max}kb)`);
}
console.log(`info largest asset: ${largest.file}`);
if (failed > 0) {
  console.error(
    `\n${failed} budget(s) exceeded — split the heavy import, never raise the cap without a perf note.`,
  );
  process.exit(1);
}
console.log("\nAll bundle budgets pass.");
