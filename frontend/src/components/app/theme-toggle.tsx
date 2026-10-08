import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

/** Persisted light/dark toggle. Follows the system until explicitly set. */
export function ThemeToggle() {
  const { resolved, setPreference } = useTheme();

  const toggle = () => {
    setPreference(resolved === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {resolved === "dark" ? (
        <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </Button>
  );
}
