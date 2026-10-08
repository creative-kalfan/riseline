import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function JobSearch({
  value,
  onChange,
  placeholder = "Search opportunities by role, company, or skills...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        ref.current?.focus();
        ref.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative flex-1 group">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-md border-2 border-border bg-surface pl-9.5 pr-20 text-xs sm:text-sm shadow-brutal-xs transition-all focus-visible:border-primary focus-visible:ring-0 font-medium"
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              ref.current?.focus();
            }}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <kbd className="hidden -translate-y-[0.5px] items-center rounded-sm border-2 border-border bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground sm:inline-flex shadow-2xs select-none">
          ⌘J
        </kbd>
      </div>
    </div>
  );
}
