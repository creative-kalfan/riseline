// Contrast AA gate — Vitest mirror of scripts/check-contrast.mjs.
// styles.css is the single source of truth; keep the pair table in sync.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

function blockVars(selector: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const m of css.matchAll(/([^{}]+){([^}]*)}/g)) {
    if (!m[1].includes(selector)) continue;
    for (const [, name, hex] of m[2].matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g)) {
      vars[name] = hex;
    }
  }
  return vars;
}

function luminance(hex: string): number {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const TEXT = 4.5;
const UI = 3;
const pairs: Array<[string, string, number]> = [
  ["text", "bg", TEXT],
  ["text", "surface", TEXT],
  ["text", "surface-muted", TEXT],
  ["text-muted", "bg", TEXT],
  ["text-muted", "surface", TEXT],
  ["text-muted", "surface-muted", TEXT],
  ["on-brand", "brand", TEXT],
  ["on-brand", "brand-hover", TEXT],
  ["on-brand", "success", TEXT],
  ["on-brand", "warning", TEXT],
  ["on-brand", "danger", TEXT],
  ["brand", "bg", TEXT],
  ["brand", "surface", TEXT],
  ["success", "bg", TEXT],
  ["success", "surface", TEXT],
  ["warning", "bg", TEXT],
  ["warning", "surface", TEXT],
  ["danger", "bg", TEXT],
  ["danger", "surface", TEXT],
  ["brand", "brand-subtle", TEXT],
  ["success", "success-subtle", TEXT],
  ["warning", "warning-subtle", TEXT],
  ["danger", "danger-subtle", TEXT],
  ["border-strong", "bg", UI],
  ["border-strong", "surface", UI],
  ["border-strong", "surface-muted", UI],
  ["focus", "bg", UI],
  ["focus", "surface", UI],
];

describe("semantic token contrast (WCAG AA)", () => {
  for (const theme of [":root", '[data-theme="dark"]'] as const) {
    describe(theme === ":root" ? "light" : "dark", () => {
      const vars = blockVars(theme);
      for (const [fg, bg, min] of pairs) {
        it(`${fg} on ${bg} >= ${min}:1`, () => {
          expect(vars[fg], `--${fg} defined`).toBeDefined();
          expect(vars[bg], `--${bg} defined`).toBeDefined();
          expect(ratio(vars[fg], vars[bg])).toBeGreaterThanOrEqual(min);
        });
      }
    });
  }
});
