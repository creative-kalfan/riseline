export function ThinkingIndicator() {
  return (
    <div className="flex animate-fade-in items-center gap-2.5">
      <div className="grid h-7 w-7 place-items-center rounded-xl bg-linear-to-br from-primary to-accent text-primary-foreground shadow-elevation-1">
        <span className="font-mono text-[11px] font-bold">AI</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border/70 bg-surface-elevated/60 px-3 py-2.5 shadow-elevation-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
        <span className="ml-1 text-xs text-muted-foreground">Thinking…</span>
      </div>
    </div>
  );
}
