import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Sparkles,
  KanbanSquare,
  Mic,
  Bell,
  User,
  Settings,
  Command,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  badge?: string;
};

const workspace: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Resume Studio", url: "/resumes", icon: FileText, badge: "Flagship" },
];

const intelligence: NavItem[] = [
  { title: "Job Intelligence", url: "/jobs", icon: Briefcase },
  { title: "Recommendations", url: "/recommendations", icon: Sparkles },
  { title: "Mission Control", url: "/applications", icon: KanbanSquare },
  { title: "Interview Prep", url: "/interview-prep", icon: Mic },
  { title: "AI Copilot", url: "/copilot", icon: Sparkles, badge: "AI" },
];

const personal: NavItem[] = [
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
];

function Section({
  label,
  items,
  currentPath,
}: {
  label: string;
  items: NavItem[];
  currentPath: string;
}) {
  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel className="px-2.5 text-[11px] font-semibold text-muted-foreground">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const active =
              item.url === "/resumes"
                ? currentPath.startsWith("/resumes") || currentPath.startsWith("/resumes/")
                : currentPath === item.url || currentPath.startsWith(item.url + "/");

            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  aria-current={active ? "page" : undefined}
                  className={`group relative h-10 rounded-md px-2.5 text-[13px] font-medium transition-colors duration-150 ${
                    active
                      ? "bg-brand-subtle text-foreground border border-brand/40"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground border border-transparent"
                  }`}
                >
                  <Link to={item.url} className="flex items-center gap-2.5">
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r bg-brand"
                      />
                    )}
                    <item.icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? "text-brand" : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    />
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span
                        className={`ml-auto rounded border px-1.5 py-px text-[11px] font-semibold ${
                          active
                            ? "bg-brand text-on-brand border-brand"
                            : "bg-surface-muted text-muted-foreground border-border"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar
      collapsible="icon"
      aria-label="Primary"
      className="border-r border-sidebar-border bg-sidebar select-none"
    >
      <SidebarHeader className="px-3 pt-3.5 pb-2">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-colors hover:bg-surface-muted border border-transparent"
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-brand bg-brand text-on-brand text-xs font-bold">
            <span>C</span>
          </div>
          <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-bold tracking-tight text-foreground">
                CareerOS
              </span>
              <span className="text-[11px] font-semibold px-1.5 py-px rounded border border-brand/40 bg-brand-subtle text-brand">
                PRO
              </span>
            </div>
            <span className="truncate text-[11px] text-muted-foreground font-medium">
              Career workspace
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-1 gap-1">
        <Section label="Workspace" items={workspace} currentPath={currentPath} />
        <Section label="Intelligence" items={intelligence} currentPath={currentPath} />
        <Section label="System" items={personal} currentPath={currentPath} />
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3 group-data-[collapsible=icon]:hidden">
        <div className="rounded-md border border-border bg-surface p-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Activity className="h-3.5 w-3.5 text-success" />
              <span>Sync status</span>
            </div>
            <span className="tnum text-xs font-semibold text-success">Live</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1.5 border-t border-border">
            <Command className="h-3 w-3 text-brand" />
            <span className="font-medium">Command Bar</span>
            <kbd className="tnum ml-auto rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">
              ⌘K
            </kbd>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
