# Shared UI kit

Reusable primitives that unify the CareerOS experience across every module.
Import these instead of hand-rolling equivalent UI in a route or feature folder.

## Components

- `PageTransition` — subtle fade-in on route change, keyed by pathname.
  Wraps `<Outlet />` in the app shell; respects `prefers-reduced-motion`.
- `EmptyState` — glass-styled empty/zero-data placeholder with optional CTA.
- `SkeletonCard` / `SkeletonList` / `SkeletonBlock` — consistent loading
  skeletons that match the glass card language.
- `Kbd` — keyboard-hint chip for shortcut affordances.

## Hooks

- `useKeyboardShortcut({ key, meta })` — reusable shortcut handler that
  automatically ignores keystrokes inside `<input>`, `<textarea>` and
  `contenteditable` targets.
- `useReducedMotion()` — boolean signal for animations that need a JS
  fallback in addition to the `motion-reduce:` Tailwind variant.

## Conventions

- Every module keeps its mock data in `src/lib/*-data.ts` with `TODO(API)`
  markers at each integration point.
- Icon-only buttons MUST carry `aria-label`.
- Prefer `min-h-dvh` over `min-h-screen` for full-viewport layouts.
- Fade / scale animations use the `animate-fade-in` / `animate-scale-in`
  keyframes defined in `src/styles.css`; wrap in `motion-reduce:animate-none`
  when the movement is decorative.
