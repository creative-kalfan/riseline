import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  MessageSquare,
  Target,
  FileText,
  Users,
  Mail,
  KanbanSquare,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { copilotApi } from "@/api/copilot";
import { getErrorMessage, isApiError } from "@/utils/api-error";

export const Route = createFileRoute("/_app/copilot")({
  head: () => ({
    meta: [
      { title: "AI Copilot · CareerOS" },
      {
        name: "description",
        content:
          "Your personal AI career assistant for job search, resume optimization, and interview prep.",
      },
    ],
  }),
  component: CopilotPage,
} as any);

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const SUGGESTED_PROMPTS = [
  {
    icon: Target,
    label: "Find matching jobs",
    prompt: "Find jobs that match my profile and skills",
  },
  {
    icon: BarChart3,
    label: "Improve ATS score",
    prompt: "How can I improve my ATS score?",
  },
  {
    icon: FileText,
    label: "Analyze job description",
    prompt: "Can you explain this job description and key requirements?",
  },
  {
    icon: Users,
    label: "Interview prep",
    prompt: "Help me prepare for an interview for my target role",
  },
  {
    icon: Mail,
    label: "Draft referral note",
    prompt: "Write a professional referral request message",
  },
  {
    icon: KanbanSquare,
    label: "Pipeline status",
    prompt: "Show me a summary of my application status",
  },
];

function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI career assistant. I can help you with:\n\n• Finding jobs that match your profile\n• Improving your ATS score\n• Preparing for interviews\n• Tracking your applications\n• Generating referral messages\n\nWhat would you like help with today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  // Tracks whether the last request failed so the status badge stays honest
  // instead of claiming "Online" when the backend is unreachable.
  const [unavailable, setUnavailable] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSuggested([]);
    setIsLoading(true);

    try {
      // Live backend: POST /api/copilot/chat with recent history + page context.
      const res = await copilotApi.sendChat({
        messages: nextMessages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
        context: { current_page: "/copilot" },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setUnavailable(false);
      const chips = Array.isArray(res.data.suggested_actions)
        ? res.data.suggested_actions.filter(
            (a): a is string => typeof a === "string" && a.trim().length > 0,
          )
        : [];
      setSuggested(chips.slice(0, 4));
    } catch (error) {
      const code = isApiError(error) ? error.code : undefined;
      const isUnavailable =
        code === "LLM_UNAVAILABLE" || code === "LLM_TIMEOUT" || code === "TIMEOUT";
      const content = isUnavailable
        ? "The AI assistant is temporarily unavailable. Please try again in a moment."
        : getErrorMessage(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setUnavailable(isUnavailable);
      if (isUnavailable) {
        toast.error("Copilot is temporarily unavailable", {
          description: "The AI service timed out. You can retry your question.",
        });
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-56px)] max-w-4xl flex-col bg-background">
      {/* Header */}
      <div className="border-b-2 border-border/80 px-4 py-3 sm:px-6 bg-card">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded border-2 border-primary bg-primary/10 text-primary shadow-brutal-xs">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-mono font-bold uppercase tracking-tight text-foreground">AI Copilot</h1>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Context-Aware Career Telemetry</p>
          </div>
          <Badge variant="outline" className="ml-auto rounded border-2 border-border/80 font-mono text-[10px] uppercase tracking-wider">
            <Sparkles className="mr-1.5 h-3 w-3 text-primary" />
            {unavailable ? "UNAVAILABLE" : "ONLINE"}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded border-2 border-primary bg-primary text-primary-foreground shadow-brutal-xs">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}
              <Card
                className={`max-w-[80%] rounded-lg border-2 shadow-brutal-xs ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                <CardContent className="p-3">
                  <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{message.content}</p>
                  <p className="mt-1.5 text-[10px] font-mono uppercase opacity-70">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </CardContent>
              </Card>
              {message.role === "user" && (
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded border-2 border-border bg-muted/60 text-muted-foreground shadow-brutal-xs">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded border-2 border-primary bg-primary text-primary-foreground shadow-brutal-xs">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <Card className="rounded-lg border-2 border-border bg-card shadow-brutal-xs">
                <CardContent className="p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Suggested Prompts */}
      {messages.length === 1 && (
        <div className="border-t-2 border-border/80 p-4 bg-muted/10">
          <p className="mb-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Suggested Directives
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SUGGESTED_PROMPTS.map((suggestion) => {
              const Icon = suggestion.icon;
              return (
                <button
                  key={suggestion.label}
                  type="button"
                  disabled={isLoading}
                  className="flex items-center gap-2.5 rounded-lg border-2 border-border/80 bg-card p-2.5 text-left transition-all hover:border-primary hover:shadow-brutal-xs disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => handleSend(suggestion.prompt)}
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded border border-border/80 bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate text-xs font-mono font-medium text-foreground">
                    {suggestion.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Live follow-up chips from POST /api/copilot/chat */}
      {suggested.length > 0 && !isLoading && (
        <div className="border-t-2 border-border/80 p-3 pb-0 bg-muted/10">
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Recommended Follow-Ups
          </p>
          <div className="flex flex-wrap gap-2">
            {suggested.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={isLoading}
                onClick={() => handleSend(chip)}
                className="inline-flex items-center gap-1.5 rounded border-2 border-primary/60 bg-primary/10 px-2.5 py-1 font-mono text-xs text-foreground transition-all hover:border-primary hover:shadow-brutal-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t-2 border-border/80 p-3 bg-card">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything or request telemetry analysis..."
            className="h-10 flex-1 rounded border-2 border-border text-xs sm:text-sm font-sans"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="h-10 w-10 shrink-0 rounded border-2 border-primary p-0 shadow-brutal-primary"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
