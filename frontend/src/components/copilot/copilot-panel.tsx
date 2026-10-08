import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { copilotApi } from "@/api/copilot";
import { getErrorMessage, isApiError } from "@/utils/api-error";
import {
  ArrowUp,
  ChevronDown,
  Pin,
  PinOff,
  Plus,
  Sparkles,
  X,
  History,
  Command as CommandIcon,
  PanelRightClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  moduleFromPath,
  moduleMeta,
  toolsForModule,
  type ChatMessage,
  type Conversation,
  type CopilotModule,
  type CopilotTool,
} from "@/lib/copilot-data";
import { useCopilot } from "./copilot-context";
import { ChatBubble } from "./chat-bubble";
import { ConversationList } from "./conversation-list";
import { WelcomeState } from "./welcome";
import { ThinkingIndicator } from "./thinking";

const MIN_W = 380;
const MAX_W = 640;

/** Backend returns plain label strings; tolerate object-shaped chips defensively. */
function normalizeChips(actions: unknown): string[] {
  if (!Array.isArray(actions)) return [];
  const out: string[] = [];
  for (const a of actions) {
    if (typeof a === "string" && a.trim()) out.push(a.trim());
    else if (
      a !== null &&
      typeof a === "object" &&
      typeof (a as { label?: unknown }).label === "string" &&
      (a as { label: string }).label.trim()
    ) {
      out.push((a as { label: string }).label.trim());
    }
    if (out.length >= 4) break;
  }
  return out;
}

export function CopilotPanel() {
  const { open, setOpen, pinned, togglePinned, pendingPrompt, clearPendingPrompt } = useCopilot();
  const isMobile = useIsMobile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const currentModule = moduleFromPath(pathname);

  // History starts empty: seeding demo threads would present fake
  // conversations as the user's own. New threads are created on demand.
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "conv-new", title: "New conversation", updatedAt: "now", module: currentModule, messages: [] },
  ]);
  const [activeId, setActiveId] = useState<string>("conv-new");
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [width, setWidth] = useState(460);
  const [resizing, setResizing] = useState(false);
  const lastPromptRef = useRef<string>("");

  const chat = useMutation({
    mutationFn: copilotApi.sendChat,
  });

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [conversations, activeId],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, thinking]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setOpen(!open);
      } else if (meta && e.key === "/") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === "Escape" && open && !pinned) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pinned, setOpen]);

  function submit(prompt: string) {
    const text = prompt.trim();
    if (!text || thinking) return;
    const targetId = active.id;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: "now",
    };
    const nextMessages = [...active.messages, userMsg];
    setConversations((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, messages: nextMessages, updatedAt: "now" } : c)),
    );
    setInput("");
    setThinking(true);
    setSuggested([]);
    setChatError(null);
    lastPromptRef.current = text;

    // Active context: current page always; resume_id when inside Resume Studio.
    const resumeMatch = pathname.match(/^\/resumes\/([^/?#]+)/);
    chat.mutate(
      {
        messages: nextMessages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
        context: {
          current_page: pathname,
          ...(resumeMatch ? { resume_id: resumeMatch[1] } : {}),
        },
      },
      {
        onSuccess: (res) => {
          const aiMsg: ChatMessage = {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: res.data.message,
            timestamp: "now",
          };
          setConversations((prev) =>
            prev.map((c) =>
              c.id === targetId ? { ...c, messages: [...c.messages, aiMsg], updatedAt: "now" } : c,
            ),
          );
          setSuggested(normalizeChips(res.data.suggested_actions));
        },
        onError: (err) => {
          const code = isApiError(err) ? err.code : undefined;
          const status = isApiError(err) ? err.statusCode : undefined;
          const unavailable =
            code === "LLM_UNAVAILABLE" ||
            code === "LLM_TIMEOUT" ||
            status === 503 ||
            code === "TIMEOUT";
          const message = unavailable
            ? "The AI assistant is temporarily unavailable. Please try again in a moment."
            : getErrorMessage(err);
          setChatError(message);
          if (unavailable) {
            toast.error("Copilot is temporarily unavailable", {
              description: "The AI service timed out. You can retry your question.",
            });
          } else {
            toast.error("Copilot request failed", { description: message });
          }
        },
        onSettled: () => setThinking(false),
      },
    );
  }

  function retryLast() {
    if (lastPromptRef.current) submit(lastPromptRef.current);
  }

  useEffect(() => {
    if (pendingPrompt && open) {
      submit(pendingPrompt);
      clearPendingPrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt, open]);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const next = Math.min(MAX_W, Math.max(MIN_W, window.innerWidth - e.clientX));
      setWidth(next);
    };
    const onUp = () => setResizing(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizing]);

  function newConversation() {
    const id = `conv-${Date.now()}`;
    const conv: Conversation = {
      id,
      title: "New conversation",
      updatedAt: "now",
      module: currentModule,
      messages: [],
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(id);
    setShowHistory(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const meta = moduleMeta[currentModule];
  const ModuleIcon = meta.icon;
  const tools = toolsForModule(currentModule);

  if (!open) return <CopilotLauncher />;

  const bodyProps = {
    active,
    mod: currentModule,
    thinking,
    input,
    setInput,
    onSubmit: () => submit(input),
    onPrompt: (p: string) => submit(p),
    inputRef,
    scrollRef,
    tools,
    showHistory,
    conversations,
    activeId,
    suggested,
    chatError,
    onRetry: retryLast,
    onSelectConversation: (id: string) => {
      setActiveId(id);
      setShowHistory(false);
    },
  };

  const headerProps = {
    ModuleIcon,
    moduleTitle: meta.title,
    active,
    pinned,
    togglePinned,
    onClose: () => setOpen(false),
    onNew: newConversation,
    onToggleHistory: () => setShowHistory((v) => !v),
    showHistory,
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 animate-fade-in">
        <div
          className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <div className="glass-strong absolute inset-x-0 bottom-0 top-[10vh] flex animate-[slide-in-right_0.3s_ease-out] flex-col rounded-t-3xl shadow-elevation-3">
          <PanelHeader {...headerProps} mobile />
          <PanelBody {...bodyProps} />
        </div>
      </div>
    );
  }

  return (
    <>
      {!pinned && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-background/30 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "glass-strong fixed bottom-3 right-3 top-3 z-50 flex flex-col overflow-hidden rounded-2xl shadow-elevation-3 animate-[scale-in_0.18s_ease-out]",
          resizing && "select-none",
        )}
        style={{ width }}
      >
        <div
          onMouseDown={() => setResizing(true)}
          className="group absolute left-0 top-0 z-10 h-full w-1.5 cursor-ew-resize"
        >
          <div className="absolute inset-y-0 left-0 w-px bg-border/60 transition group-hover:w-0.5 group-hover:bg-primary/60" />
        </div>
        <PanelHeader {...headerProps} />
        <PanelBody {...bodyProps} />
      </aside>
    </>
  );
}

function PanelHeader({
  ModuleIcon,
  moduleTitle,
  active,
  pinned,
  togglePinned,
  onClose,
  onNew,
  onToggleHistory,
  showHistory,
  mobile,
}: {
  ModuleIcon: typeof Sparkles;
  moduleTitle: string;
  active: Conversation;
  pinned: boolean;
  togglePinned: () => void;
  onClose: () => void;
  onNew: () => void;
  onToggleHistory: () => void;
  showHistory: boolean;
  mobile?: boolean;
}) {
  return (
    <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold tracking-tight">Career Copilot</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface-instrument px-1.5 py-0.5 font-mono">
            <ModuleIcon className="h-2.5 w-2.5 text-primary" />
            <span className="uppercase tracking-wider">{moduleTitle}</span>
          </span>
          <span className="truncate">{active.title}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <IconBtn title="History" active={showHistory} onClick={onToggleHistory}>
          {showHistory ? (
            <PanelRightClose className="h-3.5 w-3.5" />
          ) : (
            <History className="h-3.5 w-3.5" />
          )}
        </IconBtn>
        <IconBtn title="New conversation" onClick={onNew}>
          <Plus className="h-3.5 w-3.5" />
        </IconBtn>
        {!mobile && (
          <IconBtn title={pinned ? "Unpin" : "Pin"} active={pinned} onClick={togglePinned}>
            {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </IconBtn>
        )}
        <IconBtn title="Close" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </IconBtn>
      </div>
    </header>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-lg transition",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PanelBody({
  active,
  mod,
  thinking,
  input,
  setInput,
  onSubmit,
  onPrompt,
  inputRef,
  scrollRef,
  tools,
  showHistory,
  conversations,
  activeId,
  suggested,
  chatError,
  onRetry,
  onSelectConversation,
}: {
  active: Conversation;
  mod: CopilotModule;
  thinking: boolean;
  input: string;
  setInput: (v: string) => void;
  onSubmit: () => void;
  onPrompt: (p: string) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  scrollRef: RefObject<HTMLDivElement | null>;
  tools: CopilotTool[];
  showHistory: boolean;
  conversations: Conversation[];
  activeId: string;
  suggested: string[];
  chatError: string | null;
  onRetry: () => void;
  onSelectConversation: (id: string) => void;
}) {
  const isEmpty = active.messages.length === 0;
  return (
    <div
      className="grid min-h-0 flex-1"
      style={{ gridTemplateColumns: showHistory ? "220px 1fr" : "1fr" }}
    >
      {showHistory && (
        <div className="min-h-0 border-r border-border/60 bg-sidebar/40">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={onSelectConversation}
          />
        </div>
      )}
      <div className="flex min-h-0 flex-col">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {isEmpty ? (
            <WelcomeState module={mod} onPrompt={onPrompt} />
          ) : (
            <div className="space-y-4">
              {active.messages.map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
              {thinking && <ThinkingIndicator />}
              {chatError && !thinking && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/40 bg-destructive/5 p-3"
                >
                  <p className="text-xs leading-relaxed text-foreground">{chatError}</p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border/70 bg-surface-elevated/60 px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/10"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {!isEmpty && (
          <div className="border-t border-border/60 px-3 py-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {tools.slice(0, 8).map((t) => {
                const TIcon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => onPrompt(t.prompt)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-surface-elevated/40 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
                  >
                    <TIcon className="h-3 w-3" /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {suggested.length > 0 && !thinking && (
          <div className="border-t border-border/60 px-3 py-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Suggested follow-ups
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {suggested.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onPrompt(chip)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] text-foreground transition hover:bg-primary/20"
                >
                  <Sparkles className="h-3 w-3 text-primary" /> {chip}
                </button>
              ))}
            </div>
          </div>
        )}
        <Composer
          input={input}
          setInput={setInput}
          onSubmit={onSubmit}
          inputRef={inputRef}
          disabled={thinking}
        />
      </div>
    </div>
  );
}

function Composer({
  input,
  setInput,
  onSubmit,
  inputRef,
  disabled,
}: {
  input: string;
  setInput: (v: string) => void;
  onSubmit: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  disabled: boolean;
}) {
  return (
    <div className="border-t border-border/60 p-3">
      <div className="glass rounded-2xl p-2 shadow-elevation-1 transition focus-within:ring-2 focus-within:ring-primary/40">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          rows={2}
          placeholder="Ask about your resume, ATS, jobs, applications…"
          className="block w-full resize-none rounded-lg bg-transparent px-2 py-1 text-sm placeholder:text-muted-foreground focus:outline-none"
        />
        <div className="mt-1 flex items-center justify-between px-1">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <kbd className="rounded border border-border bg-background/60 px-1 py-0.5 font-mono">
              ⌘
            </kbd>
            <kbd className="rounded border border-border bg-background/60 px-1 py-0.5 font-mono">
              /
            </kbd>
            <span>to focus · Shift+Enter for newline</span>
          </div>
          <button
            onClick={onSubmit}
            disabled={disabled || !input.trim()}
            className="grid h-8 w-8 place-items-center rounded-xl bg-linear-to-br from-primary to-accent text-primary-foreground shadow-elevation-1 transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CopilotLauncher() {
  const { setOpen } = useCopilot();
  return (
    <button
      onClick={() => setOpen(true)}
      title="Open AI Copilot (⌘I)"
      aria-label="Open AI Copilot"
      className="group fixed bottom-5 right-5 z-40 hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-surface-elevated/90 text-primary shadow-elevation-2 backdrop-blur-md transition-all hover:scale-110 hover:border-primary hover:bg-primary hover:text-primary-foreground cursor-pointer"
    >
      <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
    </button>
  );
}
