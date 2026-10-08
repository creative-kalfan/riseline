export function ScoreRing({
  score,
  size = 132,
  stroke = 10,
  label = "ATS score",
  delta,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  delta?: number;
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const gradId = `ring-grad-${size}`;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="fill-none stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="fill-none transition-[stroke-dashoffset] duration-700"
          stroke={`url(#${gradId})`}
        />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="oklch(0.62 0.22 260)" />
            <stop offset="1" stopColor="oklch(0.68 0.20 305)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center leading-none">
          <div className="font-mono text-3xl font-semibold tracking-tight">{score}</div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
          {typeof delta === "number" && (
            <div
              className={`mt-1 text-[10px] font-medium ${
                delta >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
