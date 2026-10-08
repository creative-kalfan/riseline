// scripts/check-contrast.mjs — WCAG AA gate for the semantic tokens in src/styles.css.
// Parses the [data-theme] blocks (single source of truth) and asserts
// text pairs >= 4.5:1 and UI/non-text pairs >= 3:1. Fails the build below AA.
// Mirrored by src/lib/contrast.test.ts so `npm run test` enforces the same gate.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(resolve(root, "src/styles.css"), "utf8");

function blockVars(cssText, selector) {
  // Collect every rule block whose selector list contains `selector`
  // (handles combined selectors like `:root,\n[data-theme="light"]`).
  const vars = {};
  let found = false;
  for (const m of cssText.matchAll(/([^{}]+){([^}]*)}/g)) {
    if (!m[1].includes(selector)) continue;
    found = true;
    for (const [, name, hex] of m[2].matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g)) {
      vars[name] = hex;
    }
  }
  if (!found) throw new Error(`missing ${selector} block in styles.css`);
  return vars;
}

// :root carries the light defaults (combined `:root, [data-theme="light"]` rule).
const light = blockVars(css, ":root");
const dark = blockVars(css, '[data-theme="dark"]');

function luminance(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [foreground, background, minimum]
const TEXT = 4.5;
const UI = 3;
const pairs = [
  ["text", "bg", TEXT], ["text", "surface", TEXT], ["text", "surface-muted", TEXT],
  ["text-muted", "bg", TEXT], ["text-muted", "surface", TEXT], ["text-muted", "surface-muted", TEXT],
  ["on-brand", "brand", TEXT], ["on-brand", "brand-hover", TEXT],
  ["on-brand", "success", TEXT], ["on-brand", "warning", TEXT], ["on-brand", "danger", TEXT],
  ["brand", "bg", TEXT], ["brand", "surface", TEXT],
  ["success", "bg", TEXT], ["success", "surface", TEXT],
  ["warning", "bg", TEXT], ["warning", "surface", TEXT],
  ["danger", "bg", TEXT], ["danger", "surface", TEXT],
  ["brand", "brand-subtle", TEXT],
  ["success", "success-subtle", TEXT],
  ["warning", "warning-subtle", TEXT],
  ["danger", "danger-subtle", TEXT],
  ["border-strong", "bg", UI], ["border-strong", "surface", UI],
  ["border-strong", "surface-muted", UI],
  ["focus", "bg", UI], ["focus", "surface", UI],
];

let failed = 0;
for (const [theme, vars] of [["light", light], ["dark", dark]]) {
  for (const [fg, bg, min] of pairs) {
    if (!(fg in vars) || !(bg in vars)) {
      console.error(`FAIL ${theme}: --${fg} or --${bg} undefined`);
      failed++;
      continue;
    }
    const r = ratio(vars[fg], vars[bg]);
    const ok = r >= min ? "ok" : "FAIL";
    if (r < min) failed++;
    console.log(`${ok} ${theme} ${fg} on ${bg}: ${r.toFixed(2)}:1 (min ${min})`);
  }
}
if (failed > 0) {
  console.error(`\n${failed} pair(s) below WCAG AA — adjust token values, never the thresholds.`);
  process.exit(1);
}
console.log("\nAll pairs meet WCAG AA.");
