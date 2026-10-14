import React from "react";

// Timing contract (asserted in __tests__/hero-carousel.test.ts).
export const AUTOPLAY_MS = 4500;
export const TRANSITION_MS = 800;

type Status = "match" | "partial" | "gap";

const STATUS_STYLE: Record<Status, string> = {
  match: "bg-success-subtle text-success",
  partial: "bg-warning-subtle text-warning",
  gap: "bg-danger-subtle text-danger",
};
const STATUS_LABEL: Record<Status, string> = { match: "Matched", partial: "Partial", gap: "Gap" };

function Pill({ status }: { status: Status }) {
  return (
    <span className={`shrink-0 rounded-[var(--radius-chip)] px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// Illustrative sample content only — mirrors real Riseline steps (parse,
// requirement mapping, skills evidence, truth-preserving rewrite). No metrics.
export const HERO_SLIDES = [
  {
    eyebrow: "Resume analysis",
    title: "Your resume, parsed into sections",
    body: (
      <ul className="space-y-2 text-sm">
        {[
          ["Summary", "Detected"],
          ["Experience", "3 roles"],
          ["Skills", "12 listed"],
          ["Education", "Detected"],
        ].map(([k, v]) => (
          <li key={k} className="flex items-center justify-between rounded-md bg-bg px-3 py-2">
            <span className="font-medium text-foreground">{k}</span>
            <span className="text-muted-foreground">{v}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    eyebrow: "Job-description alignment",
    title: "Each requirement mapped to your evidence",
    body: (
      <ul className="space-y-2 text-sm">
        {(
          [
            ["Build REST APIs in Python", "match", "Order-tracking API in FastAPI"],
            ["PostgreSQL query tuning", "partial", "Mentions PostgreSQL, no tuning detail"],
            ["Kubernetes in production", "gap", "No evidence found — left as a gap"],
          ] as const
        ).map(([req, status, evidence]) => (
          <li key={req} className="rounded-md bg-bg px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">{req}</span>
              <Pill status={status} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{evidence}</p>
          </li>
        ))}
      </ul>
    ),
  },
  {
    eyebrow: "Relevant skills",
    title: "Skills the role asks for, checked against yours",
    body: (
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Found in your resume</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {["Python", "FastAPI", "PostgreSQL", "CI/CD", "Docker"].map((s) => (
              <span key={s} className="rounded-[var(--radius-chip)] bg-success-subtle px-2 py-0.5 text-xs font-medium text-success">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Asked for, not found</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {["Kubernetes", "Terraform"].map((s) => (
              <span key={s} className="rounded-[var(--radius-chip)] bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: "Before / after",
    title: "Bullets reframed around what you actually did",
    body: (
      <div className="space-y-2 text-sm">
        <div className="rounded-md bg-bg px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Before</p>
          <p className="mt-0.5 text-muted-foreground">Worked on backend APIs for orders.</p>
        </div>
        <div className="rounded-md border border-brand/30 bg-brand-subtle px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">After</p>
          <p className="mt-0.5 text-foreground">
            Built Python REST APIs in FastAPI for order tracking, backed by PostgreSQL.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Uses only facts already in your resume.</p>
      </div>
    ),
  },
] as const;

const N = HERO_SLIDES.length;

/** Signed distance of slide `i` from `active` on a ring of `n` (e.g. -1, 0, 1, 2). */
export function slideOffset(i: number, active: number, n = N) {
  const d = (((i - active) % n) + n) % n;
  return d > n / 2 ? d - n : d;
}

/**
 * One timer, many independent holds (hover, keyboard focus, user pause,
 * reduced motion). Autoplay runs only when no hold is active, so hover and
 * focus can't race each other or stack a second timer.
 */
export function createAutoplay(advance: () => void, intervalMs = AUTOPLAY_MS) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const holds = new Set<string>();
  const clear = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  const restart = () => {
    clear();
    if (holds.size) return;
    timer = setTimeout(() => {
      timer = undefined;
      advance();
      restart();
    }, intervalMs);
  };
  return {
    hold(reason: string) {
      holds.add(reason);
      clear();
    },
    release(reason: string) {
      holds.delete(reason);
      restart();
    },
    restart,
    stop() {
      holds.add("stopped");
      clear();
    },
    get running() {
      return timer !== undefined;
    },
  };
}

/** Position on the ring. Only transform + opacity change, so the move stays on the compositor. */
function slideStyle(o: number): React.CSSProperties {
  const hidden = Math.abs(o) > 1;
  return {
    transform: hidden
      ? "translate3d(0,0,-260px) scale(0.7)"
      : `translate3d(calc(var(--spread) * ${o}), 0, ${-Math.abs(o) * 140}px) rotateY(calc(var(--tilt) * ${o})) scale(${o ? 0.86 : 1})`,
    opacity: hidden ? 0 : o ? 0.5 : 1,
    // overflow-x clip flattens 3D, so stack by distance explicitly.
    zIndex: 3 - Math.min(Math.abs(o), 2),
    transitionDuration: `${TRANSITION_MS}ms`,
  };
}

const CONTROL =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] touch-manipulation";

export function HeroCarousel() {
  const [active, setActive] = React.useState(0);
  const [userPaused, setUserPaused] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const [keyboardInside, setKeyboardInside] = React.useState(false);
  const autoplay = React.useRef<ReturnType<typeof createAutoplay> | null>(null);

  React.useEffect(() => {
    const ap = createAutoplay(() => setActive((i) => (i + 1) % N));
    autoplay.current = ap;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(mq.matches);
      if (mq.matches) ap.hold("motion");
      else ap.release("motion");
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      ap.stop();
    };
  }, []);

  const go = (delta: number) => {
    setActive((i) => (i + delta + N) % N);
    autoplay.current?.restart(); // full interval after a manual move
  };

  const togglePause = () => {
    setUserPaused((p) => {
      if (p) autoplay.current?.release("user");
      else autoplay.current?.hold("user");
      return !p;
    });
  };

  const rotating = !userPaused && !reduced && !keyboardInside;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="How Riseline tailors a resume (sample)"
      className="mx-auto mt-12 w-full max-w-4xl"
      onMouseEnter={() => autoplay.current?.hold("hover")}
      onMouseLeave={() => autoplay.current?.release("hover")}
      onFocus={(e) => {
        // Only keyboard focus pauses; a mouse/touch click shouldn't freeze it.
        if (!e.target.matches(":focus-visible")) return;
        setKeyboardInside(true);
        autoplay.current?.hold("focus");
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setKeyboardInside(false);
        autoplay.current?.release("focus");
      }}
    >
      <div
        aria-live={rotating ? "off" : "polite"}
        className="relative h-[380px] overflow-x-clip sm:h-[320px] [--spread:12%] [--tilt:8deg] [perspective:1200px] sm:[--spread:40%] sm:[--tilt:14deg] lg:[--spread:62%] lg:[--tilt:18deg] motion-reduce:[--tilt:0deg]"
      >
        {HERO_SLIDES.map((slide, i) => {
          const o = slideOffset(i, active);
          return (
            <div
              key={slide.eyebrow}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${N}: ${slide.eyebrow}`}
              aria-hidden={o !== 0}
              inert={o !== 0}
              data-offset={o}
              style={slideStyle(o)}
              className="absolute inset-x-0 top-2 mx-auto h-[360px] w-[min(86vw,380px)] overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface p-5 text-left shadow-[var(--shadow-float)] transition-[transform,opacity] ease-[cubic-bezier(0.22,1,0.36,1)] [backface-visibility:hidden] motion-reduce:transition-none sm:h-[300px] sm:w-[400px]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-brand">
                  {String(i + 1).padStart(2, "0")} · {slide.eyebrow}
                </p>
                <span className="rounded-[var(--radius-chip)] border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Sample
                </span>
              </div>
              <h3 className="mt-1.5 text-base font-semibold leading-snug text-foreground">{slide.title}</h3>
              <div className="mt-3">{slide.body}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button type="button" className={CONTROL} onClick={() => go(-1)} aria-label="Previous slide">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.5 4.5 7 10l5.5 5.5" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {HERO_SLIDES.map((s, i) => (
            <span
              key={s.eyebrow}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${
                i === active ? "w-5 bg-brand" : "w-1.5 bg-border-strong/50"
              }`}
            />
          ))}
        </div>
        <button type="button" className={CONTROL} onClick={() => go(1)} aria-label="Next slide">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7.5 4.5 13 10l-5.5 5.5" />
          </svg>
        </button>
        {!reduced && (
          <button
            type="button"
            className={CONTROL}
            onClick={togglePause}
            aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
          >
            {userPaused ? (
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                <path d="M6.5 4.5v11l9-5.5z" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                <path d="M6 4.5h3v11H6zM11 4.5h3v11h-3z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
