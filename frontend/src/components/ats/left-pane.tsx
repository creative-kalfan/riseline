import { useState } from "react";
import {
  Activity,
  History,
  ListTree,
  Heart,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ScoreRing } from "./score-ring";
import { useResumes } from "@/hooks/api";
import {
  overallScore,
  overallDelta,
  previousScore,
  resumeHealthMetrics,
  sectionNav,
  history,
} from "@/lib/ats-data";

function PaneSection({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-fade-in">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {title}
          </h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function LeftPane({
  activeSection,
  onSectionChange,
}: {
  activeSection: string;
  onSectionChange: (id: string) => void;
}) {
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-4">
        <PaneSection
          icon={Activity}
          title="Overall ATS Score"
          action={
            <Badge variant="secondary" className="rounded-full text-[10px]">
              Mock
            </Badge>
          }
        >
          <Card className="glass rounded-2xl border-border/60 p-4">
            <div className="flex items-center gap-4">
              <ScoreRing score={overallScore} delta={overallDelta} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Strong match</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  vs. {previousScore} last version
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border/60 bg-background/40 p-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Percentile
                    </div>
                    <div className="mt-0.5 font-mono text-sm">92nd</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/40 p-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Verdict
                    </div>
                    <div className="mt-0.5 font-mono text-sm text-success">Ship</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </PaneSection>

        <PaneSection icon={Heart} title="Resume Health">
          <Card className="glass rounded-2xl border-border/60 p-4">
            <div className="space-y-3">
              {resumeHealthMetrics.map((m) => {
                const gap = m.target - m.value;
                return (
                  <div key={m.id}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-foreground/90">{m.label}</span>
                      <span className="font-mono text-muted-foreground">
                        {m.value}
                        <span className="text-[10px] text-muted-foreground/70"> / {m.target}</span>
                      </span>
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-border/70">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-primary to-accent transition-[width] duration-700"
                        style={{ width: `${m.value}%` }}
                      />
                      <div
                        className="absolute inset-y-0 w-px bg-foreground/40"
                        style={{ left: `${m.target}%` }}
                        title={`Target ${m.target}`}
                      />
                    </div>
                    {gap > 0 && (
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {gap} pts to target
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </PaneSection>

        <PaneSection icon={ListTree} title="Section Navigation">
          <nav className="space-y-1">
            {sectionNav.map((s) => {
              const active = s.id === activeSection;
              return (
                <button
                  key={s.id}
                  onClick={() => onSectionChange(s.id)}
                  className={`group flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[12px] transition ${
                    active
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-surface-elevated/60 hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{s.label}</span>
                  <ChevronRight
                    className={`h-3 w-3 transition ${
                      active ? "text-primary" : "opacity-0 group-hover:opacity-70"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </PaneSection>

        <PaneSection icon={History} title="History">
          <Card className="glass rounded-2xl border-border/60 p-3">
            <ol className="relative space-y-3 pl-4">
              <span className="absolute inset-y-1 left-1 w-px bg-border" aria-hidden />
              {history.map((h) => {
                const active = selectedHistory === h.id;
                return (
                  <li key={h.id}>
                    <button
                      onClick={() => setSelectedHistory(active ? null : h.id)}
                      className={`group -ml-1 flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition ${
                        active ? "bg-surface-elevated" : "hover:bg-surface-elevated/60"
                      }`}
                    >
                      <span
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ring-2 ring-background ${
                          h.delta > 0 ? "bg-success" : "bg-muted-foreground/50"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-[12px] font-medium">{h.label}</div>
                          <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                            {h.delta > 0 ? (
                              <ArrowUpRight className="h-3 w-3 text-success" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 opacity-40" />
                            )}
                            {h.score}
                          </div>
                        </div>
                        <div className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                          {h.timestamp} · {h.note}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
            <Separator className="my-2" />
            <button className="w-full rounded-md py-1.5 text-[11px] text-muted-foreground hover:text-foreground">
              View full history →
            </button>
          </Card>
        </PaneSection>
      </div>
    </ScrollArea>
  );
}
