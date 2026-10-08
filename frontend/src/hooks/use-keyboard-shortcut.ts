import { useEffect } from "react";

type Handler = (e: KeyboardEvent) => void;

interface Options {
  /** Match against event.key (case-insensitive). */
  key: string;
  /** Require ⌘ on macOS or Ctrl on other platforms. */
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  /** Skip when focus is inside an editable field (default true). */
  ignoreInInputs?: boolean;
  enabled?: boolean;
}

/** Reusable keyboard-shortcut hook that respects editable fields. */
export function useKeyboardShortcut(opts: Options, handler: Handler) {
  useEffect(() => {
    if (opts.enabled === false) return;
    const ignore = opts.ignoreInInputs ?? true;
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== opts.key.toLowerCase()) return;
      if (opts.meta && !(e.metaKey || e.ctrlKey)) return;
      if (!opts.meta && (e.metaKey || e.ctrlKey)) return;
      if (opts.shift !== undefined && opts.shift !== e.shiftKey) return;
      if (opts.alt !== undefined && opts.alt !== e.altKey) return;
      if (ignore) {
        const t = e.target as HTMLElement | null;
        if (t) {
          const tag = t.tagName;
          if (tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable) return;
        }
      }
      handler(e);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opts.key, opts.meta, opts.shift, opts.alt, opts.ignoreInInputs, opts.enabled, handler]);
}
