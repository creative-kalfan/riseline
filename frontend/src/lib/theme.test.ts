import { describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY, resolvePreference } from "./theme";

describe("theme preference resolution", () => {
  it("honors explicit light/dark preferences", () => {
    expect(resolvePreference("light")).toBe("light");
    expect(resolvePreference("dark")).toBe("dark");
  });

  it("falls back to light without a window (SSR)", () => {
    expect(resolvePreference("system")).toBe("light");
  });

  it("persists under the documented storage key", () => {
    expect(THEME_STORAGE_KEY).toBe("careeros-theme");
  });
});
