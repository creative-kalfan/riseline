// Hero carousel timing + structure. Node env (no jsdom): the autoplay
// controller is a plain function, so fake timers drive it directly.
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTOPLAY_MS,
  HERO_SLIDES,
  HeroCarousel,
  TRANSITION_MS,
  createAutoplay,
  slideOffset,
} from "@/components/landing/sections/hero-carousel";

describe("hero carousel timing contract", () => {
  it("advances every 4–5s with a 700–900ms transition", () => {
    expect(AUTOPLAY_MS).toBeGreaterThanOrEqual(4000);
    expect(AUTOPLAY_MS).toBeLessThanOrEqual(5000);
    expect(TRANSITION_MS).toBeGreaterThanOrEqual(700);
    expect(TRANSITION_MS).toBeLessThanOrEqual(900);
  });
});

describe("createAutoplay", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("ticks once per interval and cycles through every slide back to the start", () => {
    let active = 0;
    const ap = createAutoplay(() => (active = (active + 1) % HERO_SLIDES.length));
    ap.restart();
    const seen = [active];
    for (let i = 0; i < HERO_SLIDES.length; i++) {
      vi.advanceTimersByTime(AUTOPLAY_MS - 1);
      expect(seen.at(-1)).toBe(active); // not early
      vi.advanceTimersByTime(1);
      seen.push(active);
    }
    expect(seen).toEqual([0, 1, 2, 3, 0]);
    ap.stop();
  });

  it("never stacks timers on repeated restart", () => {
    const tick = vi.fn();
    const ap = createAutoplay(tick);
    for (let i = 0; i < 10; i++) ap.restart();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(AUTOPLAY_MS);
    expect(tick).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
    ap.stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("pauses while hovered or keyboard-focused; resumes only when both end", () => {
    const tick = vi.fn();
    const ap = createAutoplay(tick);
    ap.restart();
    ap.hold("hover");
    ap.hold("focus");
    vi.advanceTimersByTime(AUTOPLAY_MS * 3);
    expect(tick).not.toHaveBeenCalled();
    ap.release("hover");
    vi.advanceTimersByTime(AUTOPLAY_MS * 3);
    expect(tick).not.toHaveBeenCalled();
    expect(ap.running).toBe(false);
    ap.release("focus");
    expect(ap.running).toBe(true);
    vi.advanceTimersByTime(AUTOPLAY_MS);
    expect(tick).toHaveBeenCalledTimes(1);
    ap.stop();
  });

  it("manual prev/next restart gives a full interval before the next auto move", () => {
    const tick = vi.fn();
    const ap = createAutoplay(tick);
    ap.restart();
    vi.advanceTimersByTime(AUTOPLAY_MS - 100);
    ap.restart(); // user pressed Next
    vi.advanceTimersByTime(AUTOPLAY_MS - 1);
    expect(tick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(tick).toHaveBeenCalledTimes(1);
    ap.stop();
  });

  it("reduced-motion hold blocks autoplay, and restart is a no-op while held", () => {
    const tick = vi.fn();
    const ap = createAutoplay(tick);
    ap.hold("motion");
    ap.restart();
    vi.advanceTimersByTime(AUTOPLAY_MS * 5);
    expect(tick).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stop() is final and leaves no timers (unmount)", () => {
    const tick = vi.fn();
    const ap = createAutoplay(tick);
    ap.restart();
    ap.stop();
    ap.release("hover");
    vi.advanceTimersByTime(AUTOPLAY_MS * 5);
    expect(tick).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("slideOffset", () => {
  it("places neighbours at ±1 and wraps around the ring", () => {
    expect([0, 1, 2, 3].map((i) => slideOffset(i, 0, 4))).toEqual([0, 1, 2, -1]);
    expect([0, 1, 2, 3].map((i) => slideOffset(i, 3, 4))).toEqual([1, 2, -1, 0]);
  });
});

describe("HeroCarousel render", () => {
  const html = renderToString(<HeroCarousel />);

  it("renders all slides with one foreground slide and labelled controls", () => {
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html.match(/aria-roledescription="slide"/g)).toHaveLength(HERO_SLIDES.length);
    expect(html.match(/data-offset="0"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Previous slide"');
    expect(html).toContain('aria-label="Next slide"');
    expect(html).toContain('aria-label="Pause slideshow"');
  });

  it("animates only transform/opacity and has a reduced-motion path", () => {
    expect(html).toContain("transition-[transform,opacity]");
    expect(html).not.toContain("transition-all");
    expect(html).toContain("motion-reduce:transition-none");
    expect(html).toContain("motion-reduce:[--tilt:0deg]");
  });

  it("makes no unverifiable claims", () => {
    const text = html.toLowerCase();
    for (const banned of ["guarantee", "% match", "score lift", "testimonial", "ats score"]) {
      expect(text).not.toContain(banned);
    }
  });
});
