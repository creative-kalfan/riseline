import { Archive, MessageSquare, Pin, Search, Star } from "lucide-react";
import { useState } from "react";
import type { Conversation } from "@/lib/copilot-data";
import { cn } from "@/lib/utils";

export function ConversationList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pinned" | "favorites" | "archived">("all");

  const filtered = conversations.filter((c) => {
    if (filter === "pinned" && !c.pinned) return false;
    if (filter === "favorites" && !c.favorite) return false;
    if (filter === "archived" && !c.archived) return false;
    if (filter === "all" && c.archived) return false;
    if (q && !c.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border/60 p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations"
            className="h-8 w-full rounded-lg border border-border bg-surface-elevated/50 pl-8 pr-2 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div className="mt-2 flex gap-1">
          {(
            [
              ["all", MessageSquare, "All"],
              ["pinned", Pin, "Pinned"],
              ["favorites", Star, "Favs"],
              ["archived", Archive, "Archive"],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition",
                filter === id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-surface-elevated/60",
              )}
            >
              <Icon className="h-3 w-3" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">
            No conversations
          </div>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "group mb-1 flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left transition",
                activeId === c.id
                  ? "bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_var(--border)]"
                  : "hover:bg-surface-elevated/60",
              )}
            >
              <div className="flex items-center gap-1.5">
                {c.pinned && <Pin className="h-3 w-3 text-primary" />}
                {c.favorite && <Star className="h-3 w-3 text-warning" />}
                <span className="truncate text-xs font-medium">{c.title}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{c.updatedAt}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
