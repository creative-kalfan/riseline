import { useState, type ReactNode } from "react";
import { Copy, Pin, RotateCcw, Trash2, Check } from "lucide-react";
import type { ChatMessage } from "@/lib/copilot-data";
import { ResponseCardView } from "./response-card";
import { cn } from "@/lib/utils";

function renderMarkdown(text: string) {
  const blocks = text.split(/\n\n+/);
  return blocks.map((block, bi) => {
    if (block.startsWith("- ")) {
      const items = block.split(/\n- /).map((s) => s.replace(/^-\s*/, ""));
      return (
        <ul key={bi} className="my-1.5 list-disc space-y-1 pl-5">
          {items.map((it, i) => (
            <li key={i}>{inline(it)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={bi} className="leading-relaxed">
        {inline(block)}
      </p>
    );
  });
}

function inline(text: string) {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) parts.push(<strong key={idx++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`"))
      parts.push(
        <code
          key={idx++}
          className="rounded-md bg-surface-elevated px-1 py-0.5 font-mono text-[0.85em]"
        >
          {t.slice(1, -1)}
        </code>,
      );
    else parts.push(<em key={idx++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function ChatBubble({
  message,
  onPin,
  onDelete,
  onRegenerate,
}: {
  message: ChatMessage;
  onPin?: () => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = () => {
    navigator.clipboard?.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className={cn("group flex animate-fade-in gap-2.5", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded border-2 border-primary bg-primary text-primary-foreground shadow-brutal-xs">
          <span className="font-mono text-[10px] font-bold tracking-tight">AI</span>
        </div>
      )}
      <div className="min-w-0 max-w-[85%]">
        <div
          className={cn(
            "rounded-lg px-4 py-2.5 text-xs sm:text-sm border-2 transition-all leading-relaxed",
            isUser
              ? "border-primary bg-primary text-primary-foreground shadow-brutal-xs"
              : "border-border bg-card text-foreground shadow-brutal-xs",
          )}
        >
          <div className="space-y-1.5">{renderMarkdown(message.content)}</div>
        </div>
        {message.card && <ResponseCardView card={message.card} />}
        {!isUser && (
          <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={copy}
              className="rounded border border-border/80 bg-surface-elevated/40 p-1 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground transition-all"
              title="Copy"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
            <button
              onClick={onRegenerate}
              className="rounded border border-border/80 bg-surface-elevated/40 p-1 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground transition-all"
              title="Regenerate"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
            <button
              onClick={onPin}
              className={cn(
                "rounded border border-border/80 bg-surface-elevated/40 p-1 text-[11px] transition-all hover:border-primary hover:text-foreground",
                message.pinned ? "text-primary border-primary bg-primary/10" : "text-muted-foreground",
              )}
              title="Pin"
            >
              <Pin className="h-3 w-3" />
            </button>
            <button
              onClick={onDelete}
              className="rounded border border-border/80 bg-surface-elevated/40 p-1 text-[11px] text-muted-foreground hover:border-destructive hover:text-destructive transition-all"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
