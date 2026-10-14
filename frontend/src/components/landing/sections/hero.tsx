import { HeroCarousel } from "./hero-carousel";

export const HERO_CTAS = [
  { label: "Try Free", href: "/try", primary: true },
  { label: "See How It Works", href: "#how-it-works", primary: false },
] as const;

export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="mx-auto w-full max-w-5xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
      <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
        Free guest preview — no account needed
      </p>
      <h1
        id="hero-heading"
        className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl"
      >
        Tailor your resume to the role.
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        Paste your resume and a job post. Riseline maps your experience to what the role asks
        for and drafts a truth-preserving tailored version — with the evidence shown.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href="/try"
          className="inline-flex w-full items-center justify-center rounded-md border border-brand bg-brand px-7 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2 sm:w-auto"
        >
          Try Free
        </a>
        <a
          href="#how-it-works"
          className="inline-flex w-full items-center justify-center rounded-md border border-border bg-surface px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2 sm:w-auto"
        >
          See How It Works
        </a>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Guest sessions are ephemeral — your pasted text expires within 24 hours.
      </p>
      <HeroCarousel />
    </section>
  );
}
