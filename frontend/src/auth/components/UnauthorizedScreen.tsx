import { Lock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function UnauthorizedScreen() {
  const navigate = useNavigate();
  const handleLogin = () => {
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <Lock className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Unauthorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need to log in to access this page.
        </p>
        <div className="mt-6">
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
