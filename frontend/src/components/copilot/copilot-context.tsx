import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface CopilotCtx {
  open: boolean;
  pinned: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  togglePinned: () => void;
  sendPrompt: (prompt: string) => void;
  pendingPrompt: string | null;
  clearPendingPrompt: () => void;
}

const Ctx = createContext<CopilotCtx | null>(null);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const togglePinned = useCallback(() => setPinned((v) => !v), []);
  const sendPrompt = useCallback((p: string) => {
    setPendingPrompt(p);
    setOpen(true);
  }, []);
  const clearPendingPrompt = useCallback(() => setPendingPrompt(null), []);

  const value = useMemo(
    () => ({
      open,
      pinned,
      setOpen,
      toggle,
      togglePinned,
      sendPrompt,
      pendingPrompt,
      clearPendingPrompt,
    }),
    [open, pinned, toggle, togglePinned, sendPrompt, pendingPrompt, clearPendingPrompt],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCopilot() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCopilot must be used inside CopilotProvider");
  return ctx;
}
