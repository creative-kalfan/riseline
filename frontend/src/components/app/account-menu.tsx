"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { User, Settings, Bell, LogOut, ChevronRight } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/auth/useAuth";
import { getInitials } from "@/lib/get-initials";
import { cn } from "@/lib/utils";

type AccountMenuItem = {
  label: string;
  icon: typeof User;
  to?: string;
  onClick?: () => void;
  destructive?: boolean;
};

const menuItems: AccountMenuItem[] = [
  { label: "Profile", icon: User, to: "/profile" },
  { label: "Settings", icon: Settings, to: "/settings" },
  { label: "Notifications", icon: Bell, to: "/notifications" },
];

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleNavigate = (to?: string) => {
    if (!to) return;
    setOpen(false);
    navigate({ to });
  };

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
    } catch {
      // logout failure is handled inside authService
    }
  };

  const initials = getInitials(user?.name, user?.email);
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const email = user?.email;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative h-9 w-9 rounded-full p-0 transition-all",
            "hover:shadow-[var(--shadow-glow)]",
            open && "shadow-[var(--shadow-glow)]",
          )}
          aria-label={`Account menu for ${displayName}`}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <Avatar className="h-9 w-9 border border-border/60">
            <AvatarFallback className="bg-linear-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(
          "z-50 w-72 rounded-2xl border border-border/70 p-1.5",
          "bg-surface-elevated/75 backdrop-blur-2xl",
          "shadow-[var(--shadow-elevation-3)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "origin-(--radix-popover-content-transform-origin)",
        )}
      >
        {/* Account header */}
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <Avatar className="h-10 w-10 border border-border/60">
            <AvatarFallback className="bg-linear-to-br from-primary to-accent text-sm font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
          </div>
        </div>

        <Separator className="my-1.5" />

        {/* Menu items */}
        <div className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleNavigate(item.to)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                  "text-foreground/80 transition-colors",
                  "hover:bg-surface-elevated hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              </button>
            );
          })}
        </div>

        <Separator className="my-1.5" />

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
            "text-destructive/90 transition-colors",
            "hover:bg-destructive/10 hover:text-destructive",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Sign out</span>
        </button>
      </PopoverContent>
    </Popover>
  );
}
