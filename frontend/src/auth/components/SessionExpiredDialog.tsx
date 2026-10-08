import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

interface SessionExpiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionExpiredDialog({ isOpen, onClose }: SessionExpiredDialogProps) {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleLogin = () => {
    setIsVisible(false);
    navigate({ to: "/login", replace: true });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-warning" />
          <h2 className="text-lg font-semibold text-foreground">Session Expired</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Your session has expired. Please log in again to continue.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleLogin}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}
