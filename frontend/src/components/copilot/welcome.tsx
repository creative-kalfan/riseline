import { FileText, Sparkles } from "lucide-react";
import {
  pinnedPrompts,
  recentFiles,
  suggestedPrompts,
  toolsForModule,
  moduleMeta,
  type CopilotModule,
} from "@/lib/copilot-data";

export function WelcomeState({
  module: mod,
  onPrompt,
}: {
  module: CopilotModule;
  onPrompt: (p: string) => void;
}) {
  const tools = toolsForModule(mod).slice(0, 6);
  const meta = moduleMeta[mod];
  const Icon = meta.icon;

  return (
    <div className="animate-fade-in space-y-5 px-1 py-4">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-primary/10 via-transparent to-accent/10 p-5 shadow-elevation-1">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          <Icon className="h-3 w-3" /> {meta.hint}
        </div>
        <h2 className="bg-linear-to-r from-primary to-accent bg-clip-text text-xl font-semibold tracking-tight text-transparent">
          Your Career Copilot
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Context-aware guidance across resumes, ATS, jobs and applications. Ask anything.
        </p>
      </div>

      <section>
        <SectionLabel icon={Sparkles} title={`Suggested in ${meta.title}`} />
        <div className="grid grid-cols-1 gap-2">
          {tools.map((t) => {
            const TIcon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => onPrompt(t.prompt)}
                className="group flex items-start gap-3 rounded-xl border border-border/70 bg-surface-elevated/50 p-3 text-left transition hover:border-primary/40 hover:bg-surface-elevated hover:shadow-elevation-1"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:scale-105">
                  <TIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{t.label}</div>
                  <div className="truncate text-xs text-muted-foreground">{t.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionLabel title="Quick prompts" />
        <div className="flex flex-wrap gap-1.5">
          {suggestedPrompts.map((p) => (
            <button
              key={p}
              onClick={() => onPrompt(p)}
              className="rounded-full border border-border/70 bg-surface-elevated/40 px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionLabel title="Pinned prompts" />
        <div className="space-y-1.5">
          {pinnedPrompts.map((p) => (
            <button
              key={p}
              onClick={() => onPrompt(p)}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/60 px-3 py-1.5 text-left text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              <Sparkles className="h-3 w-3 text-primary" /> {p}
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionLabel title="Recent" />
        <div className="grid grid-cols-1 gap-1.5">
          {recentFiles.slice(0, 4).map((f) => (
            <button
              key={f.id}
              onClick={() => onPrompt(`Work on "${f.name}"`)}
              className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-surface-elevated/40 px-3 py-2 text-left transition hover:bg-surface-elevated"
            >
              <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{f.name}</div>
                <div className="truncate text-[10px] text-muted-foreground">{f.meta}</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ icon: Icon, title }: { icon?: typeof Sparkles; title: string }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {Icon && <Icon className="h-3 w-3" />} {title}
    </div>
  );
}
