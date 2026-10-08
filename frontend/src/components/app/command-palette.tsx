import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Bell,
  Briefcase,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  Settings,
  Sparkles,
  User,
} from "lucide-react";

const items = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, group: "Navigate" },
  { label: "Resumes", to: "/resumes", icon: FileText, group: "Navigate" },
  { label: "Jobs", to: "/jobs", icon: Briefcase, group: "Navigate" },
  { label: "Recommendations", to: "/recommendations", icon: Sparkles, group: "Navigate" },
  { label: "Applications", to: "/applications", icon: KanbanSquare, group: "Navigate" },
  { label: "Notifications", to: "/notifications", icon: Bell, group: "Personal" },
  { label: "Profile", to: "/profile", icon: User, group: "Personal" },
  { label: "Settings", to: "/settings", icon: Settings, group: "Personal" },
] as const;

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const groups = Array.from(new Set(items.map((i) => i.group)));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search or jump to…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group, i) => (
          <div key={group}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items
                .filter((it) => it.group === group)
                .map((it) => (
                  <CommandItem
                    key={it.to}
                    onSelect={() => {
                      onOpenChange(false);
                      navigate({ to: it.to });
                    }}
                  >
                    <it.icon className="mr-2 h-4 w-4" />
                    <span>{it.label}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
