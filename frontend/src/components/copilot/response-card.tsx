import type { ResponseCard } from "@/lib/copilot-data";
import { Check, Sparkles, TrendingUp } from "lucide-react";

export function ResponseCardView({ card }: { card: ResponseCard }) {
  if (card.type === "ats") {
    return (
      <div className="mt-3 overflow-hidden rounded-lg border-2 border-border bg-card shadow-brutal-xs">
        <div className="flex items-center justify-between border-b-2 border-border px-4 py-2.5 bg-muted/20">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> {card.title}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
              {card.score}%
            </span>
            <span className="inline-flex items-center gap-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
              <TrendingUp className="h-3 w-3" />+{card.delta}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 text-xs font-mono">
          <div>
            <div className="mb-1.5 font-bold uppercase text-[11px] text-muted-foreground">Matched</div>
            <div className="flex flex-wrap gap-1">
              {card.keywords.matched.map((k) => (
                <span key={k} className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">
                  {k}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 font-bold uppercase text-[11px] text-muted-foreground">Missing</div>
            <div className="flex flex-wrap gap-1">
              {card.keywords.missing.map((k) => (
                <span key={k} className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-amber-400">
                  {k}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (card.type === "checklist") {
    return (
      <div className="mt-3 overflow-hidden rounded-lg border-2 border-border bg-card shadow-brutal-xs">
        <div className="border-b-2 border-border px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground bg-muted/20">
          {card.title}
        </div>
        <ul className="divide-y divide-border/60 font-sans">
          {card.items.map((it, i) => (
            <li key={i} className="flex items-center gap-2.5 px-4 py-2.5 text-xs">
              <span
                className={
                  "grid h-4 w-4 place-items-center rounded border-2 " +
                  (it.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background")
                }
              >
                {it.done && <Check className="h-3 w-3" />}
              </span>
              <span className={it.done ? "text-muted-foreground line-through" : "text-foreground font-medium"}>
                {it.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (card.type === "table") {
    return (
      <div className="mt-3 overflow-hidden rounded-lg border-2 border-border bg-card shadow-brutal-xs">
        <div className="border-b-2 border-border px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground bg-muted/20">
          {card.title}
        </div>
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b-2 border-border text-left text-muted-foreground bg-muted/10">
              {card.columns.map((c) => (
                <th key={c} className="px-4 py-2 font-bold uppercase text-[10px]">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {card.rows.map((row, i) => (
              <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2 tabular-nums">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  // job-match
  return (
    <div className="mt-3 overflow-hidden rounded-lg border-2 border-border bg-card shadow-brutal-xs">
      <div className="flex items-center justify-between border-b-2 border-border px-4 py-2.5 bg-muted/20">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
            {card.title}
          </div>
          <div className="mt-0.5 text-xs font-mono font-bold text-foreground">{card.company}</div>
        </div>
        <div className="font-mono text-2xl font-bold tabular-nums text-foreground">
          {card.score}%
        </div>
      </div>
      <div className="space-y-2.5 p-4 font-mono">
        {card.factors.map((f) => (
          <div key={f.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px] uppercase">{f.label}</span>
              <span className="tabular-nums font-bold">{f.value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-none border border-border bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${f.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
