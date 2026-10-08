import { useMemo } from "react";

type DiffPart = { text: string; type: "equal" | "removed" | "added" };

function tokenize(text: string): string[] {
  // Split keeping whitespace so reconstruction is faithful.
  return text.match(/\S+|\s+/g) ?? [];
}

function computeDiff(current: string, suggested: string): DiffPart[] {
  const a = tokenize(current);
  const b = tokenize(suggested);
  const n = a.length;
  const m = b.length;

  // LCS-based diff
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      parts.push({ text: a[i], type: "equal" });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      parts.push({ text: a[i], type: "removed" });
      i++;
    } else {
      parts.push({ text: b[j], type: "added" });
      j++;
    }
  }
  while (i < n) parts.push({ text: a[i++], type: "removed" });
  while (j < m) parts.push({ text: b[j++], type: "added" });
  return parts;
}

export function OptimizationDiffView({
  currentText,
  suggestedText,
  showBoth = true,
}: {
  currentText: string | null | undefined;
  suggestedText: string | null | undefined;
  showBoth?: boolean;
}) {
  const current = currentText || "";
  const suggested = suggestedText || "";

  const parts = useMemo(() => computeDiff(current, suggested), [current, suggested]);

  if (current === suggested || (!current && !suggested)) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {suggested || current || "No content to compare."}
        </p>
      </div>
    );
  }

  if (!showBoth && suggested) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
        <p className="text-sm whitespace-pre-wrap">
          {parts.map((p, idx) =>
            p.type === "removed" ? null : (
              <span
                key={idx}
                className={p.type === "added" ? "bg-emerald-500/20 rounded px-0.5" : ""}
              >
                {p.text}
              </span>
            ),
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-rose-500/70">
          Before
        </p>
        <p className="text-sm whitespace-pre-wrap">
          {parts.map((p, idx) =>
            p.type === "removed" ? (
              <span
                key={idx}
                className="bg-rose-500/20 line-through decoration-rose-500/60 rounded px-0.5"
              >
                {p.text}
              </span>
            ) : (
              <span key={idx}>{p.text}</span>
            ),
          )}
        </p>
      </div>
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-500/70">
          After
        </p>
        <p className="text-sm whitespace-pre-wrap">
          {parts.map((p, idx) =>
            p.type === "added" ? (
              <span key={idx} className="bg-emerald-500/20 rounded px-0.5">
                {p.text}
              </span>
            ) : (
              <span key={idx}>{p.text}</span>
            ),
          )}
        </p>
      </div>
    </div>
  );
}
