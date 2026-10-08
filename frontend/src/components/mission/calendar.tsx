import { cn } from "@/lib/utils";
import type { CalendarEventUI } from "@/lib/applications";

const kindTone: Record<CalendarEventUI["kind"], string> = {
  interview: "bg-warning/15 text-warning ring-warning/25",
  deadline: "bg-destructive/15 text-destructive ring-destructive/25",
  followup: "bg-primary/15 text-primary ring-primary/25",
  assessment: "bg-accent/15 text-accent ring-accent/25",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthCalendar({
  year,
  month,
  events,
  activeDay,
}: {
  year: number;
  month: number;
  events: CalendarEventUI[];
  activeDay?: number;
}) {
  // Build a month grid (Mon-first)
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7; // 0 = Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const byDay = new Map<number, CalendarEventUI[]>();
  events
    .filter((e) => e.year === year && e.month === month)
    .forEach((e) => {
      const arr = byDay.get(e.day) ?? [];
      arr.push(e);
      byDay.set(e.day, arr);
    });

  const monthLabel = first.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{monthLabel}</h3>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <Legend tone="warning" label="Interview" />
          <Legend tone="destructive" label="Deadline" />
          <Legend tone="primary" label="Follow-up" />
          <Legend tone="accent" label="Assessment" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {DAYS.map((d) => (
          <div key={d} className="px-2 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <div
            key={i}
            className={cn(
              "relative min-h-[92px] rounded-xl border border-border/50 bg-background/25 p-2 transition",
              d && "hover:bg-background/40",
              d === activeDay && "ring-1 ring-primary/40 border-primary/40",
            )}
          >
            {d && (
              <>
                <div className="mb-1 text-[11px] font-medium text-muted-foreground">{d}</div>
                <div className="space-y-1">
                  {(byDay.get(d) ?? []).slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className={cn(
                        "truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1",
                        kindTone[e.kind],
                      )}
                      title={`${e.title} · ${e.company}`}
                    >
                      {e.hour !== undefined && (
                        <span className="mr-1 font-mono">{String(e.hour).padStart(2, "0")}:00</span>
                      )}
                      {e.title}
                    </div>
                  ))}
                  {(byDay.get(d)?.length ?? 0) > 3 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{(byDay.get(d)?.length ?? 0) - 3} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({
  tone,
  label,
}: {
  tone: "warning" | "destructive" | "primary" | "accent";
  label: string;
}) {
  const cls = {
    warning: "bg-warning",
    destructive: "bg-destructive",
    primary: "bg-primary",
    accent: "bg-accent",
  }[tone];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", cls)} />
      {label}
    </span>
  );
}
