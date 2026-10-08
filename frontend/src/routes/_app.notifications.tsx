import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Settings,
  Filter,
  Search,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/api/useNotifications";
import {
  transformNotifications,
  type NotificationUI,
  type NotificationType,
  type NotificationPriority,
  priorityConfig,
  typeLabels,
} from "@/types/notification";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · CareerOS" },
      {
        name: "description",
        content: "Event-driven, preference-aware alerts across the platform.",
      },
    ],
  }),
  component: NotificationsPage,
});

type ViewMode = "inbox" | "unread" | "preferences";

function NotificationsPage() {
  const [view, setView] = useState<ViewMode>("inbox");
  const [query, setQuery] = useState("");

  // Live backend data
  const { data: notifications, isLoading, isError, error, refetch } = useNotifications();
  const unreadCount = useUnreadCount();
  const { data: preferences } = useNotificationPreferences();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const updatePreferencesMutation = useUpdateNotificationPreferences();

  // Filter notifications by search query
  const filtered = useMemo(() => {
    if (!notifications) return [];
    const all = transformNotifications(notifications);
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        typeLabels[n.type].toLowerCase().includes(q),
    );
  }, [notifications, query]);

  // Get unread notifications
  const unread = useMemo(() => {
    return filtered.filter((n) => !n.isRead);
  }, [filtered]);

  // Handle mark as read
  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-[1536px] mx-auto flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          eyebrow="Personal"
          title="Notifications"
          description="Event-driven, preference-aware alerts across the platform."
        />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="w-full max-w-[1536px] mx-auto flex flex-col items-center justify-center gap-4 px-4 sm:px-6 lg:px-8 py-20">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold">Failed to load notifications</h2>
        <p className="text-sm text-muted-foreground">
          {(error as Error)?.message ?? "An unexpected error occurred"}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1536px] mx-auto flex flex-col gap-6 px-4 sm:px-6 lg:px-8 py-6">
      <PageHeader
        eyebrow="Personal"
        title="Notifications"
        description="Event-driven, preference-aware alerts across the platform."
        actions={
          <div className="flex items-center gap-2">
            {view === "inbox" && unread.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="rounded border-2 border-border shadow-brutal-xs font-mono text-xs uppercase"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="rounded border-2 border-border shadow-brutal-xs hover:shadow-brutal-sm"
              aria-label="Refresh"
              onClick={() => refetch()}
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-border bg-card p-2 shadow-brutal-xs">
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList className="rounded border-2 border-border bg-muted/40 p-1">
            <TabsTrigger value="inbox" className="gap-1.5 rounded font-mono text-xs font-bold uppercase">
              <Bell className="h-3.5 w-3.5" />
              Inbox
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 px-1 font-mono text-[10px] border border-border">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-1.5 rounded font-mono text-xs font-bold uppercase">
              <XCircle className="h-3.5 w-3.5" />
              Unread
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-1.5 rounded font-mono text-xs font-bold uppercase">
              <Settings className="h-3.5 w-3.5" />
              Preferences
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {view !== "preferences" && (
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notification alerts…"
              className="h-9 rounded border-2 border-border bg-background pl-8 text-xs font-sans"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {view === "preferences" ? (
        <PreferencesPanel preferences={preferences} updateMutation={updatePreferencesMutation} />
      ) : (
        <NotificationList
          notifications={view === "unread" ? unread : filtered}
          onMarkAsRead={handleMarkAsRead}
          isMarkingRead={markAsReadMutation.isPending}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notification List Component
// ---------------------------------------------------------------------------

function NotificationList({
  notifications,
  onMarkAsRead,
  isMarkingRead,
}: {
  notifications: NotificationUI[];
  onMarkAsRead: (id: string) => void;
  isMarkingRead: boolean;
}) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border/80 bg-card p-12 text-center">
        <Bell className="h-10 w-10 text-muted-foreground/40" />
        <h2 className="text-sm font-mono font-bold uppercase tracking-tight text-foreground">No alerts active</h2>
        <p className="text-xs font-mono text-muted-foreground max-w-xs">
          System telemetry, job matching alerts, and pipeline notifications will stream here.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="rounded-lg border-2 border-border bg-card shadow-brutal-xs">
      <div className="flex flex-col divide-y-2 divide-border/60">
        {notifications.map((n) => (
          <NotificationRow
            key={n.id}
            notification={n}
            onMarkAsRead={onMarkAsRead}
            isMarkingRead={isMarkingRead}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function NotificationRow({
  notification,
  onMarkAsRead,
  isMarkingRead,
}: {
  notification: NotificationUI;
  onMarkAsRead: (id: string) => void;
  isMarkingRead: boolean;
}) {
  const priorityStyle = priorityConfig[notification.priority];

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 transition-colors hover:bg-muted/30",
        !notification.isRead && "bg-primary/5",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate tracking-tight">{notification.title}</h3>
              <Badge variant="secondary" className={cn("text-[10px] h-5 rounded border border-border font-mono uppercase", priorityStyle.color)}>
                {priorityStyle.label}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {notification.message}
            </p>
            <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
              <span>{typeLabels[notification.type]}</span>
              <span>·</span>
              <span>{notification.timeAgo}</span>
            </div>
          </div>

          {!notification.isRead && (
            <Button
              variant="outline"
              size="sm"
              className="rounded border-2 border-border/80 h-7 px-2 font-mono text-[10px] uppercase shadow-brutal-xs hover:border-primary"
              onClick={() => onMarkAsRead(notification.id)}
              disabled={isMarkingRead}
            >
              <Check className="h-3 w-3 mr-1 text-primary" />
              Acknowledge
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preferences Panel Component
// ---------------------------------------------------------------------------

function PreferencesPanel({
  preferences,
  updateMutation,
}: {
  preferences?: {
    email_enabled: boolean;
    in_app_enabled: boolean;
    push_enabled: boolean;
    high_match_threshold: number;
    daily_digest: boolean;
    weekly_digest: boolean;
    quiet_hours?: {
      startHour: number;
      endHour: number;
      timezoneOffsetMinutes?: number;
    } | null;
  };
  updateMutation: ReturnType<typeof useUpdateNotificationPreferences>;
}) {
  const [emailEnabled, setEmailEnabled] = useState(preferences?.email_enabled ?? true);
  const [inAppEnabled, setInAppEnabled] = useState(preferences?.in_app_enabled ?? true);
  const [pushEnabled, setPushEnabled] = useState(preferences?.push_enabled ?? false);
  const [highMatchThreshold, setHighMatchThreshold] = useState(
    preferences?.high_match_threshold ?? 80,
  );
  const [dailyDigest, setDailyDigest] = useState(preferences?.daily_digest ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(preferences?.weekly_digest ?? false);

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      setEmailEnabled(preferences.email_enabled);
      setInAppEnabled(preferences.in_app_enabled);
      setPushEnabled(preferences.push_enabled);
      setHighMatchThreshold(preferences.high_match_threshold);
      setDailyDigest(preferences.daily_digest);
      setWeeklyDigest(preferences.weekly_digest);
    }
  }, [preferences]);

  const handleSave = () => {
    updateMutation.mutate({
      email_enabled: emailEnabled,
      in_app_enabled: inAppEnabled,
      push_enabled: pushEnabled,
      high_match_threshold: highMatchThreshold,
      daily_digest: dailyDigest,
      weekly_digest: weeklyDigest,
    });
  };

  return (
    <div className="rounded-lg border-2 border-border bg-card p-5 sm:p-6 shadow-brutal-sm max-w-2xl">
      <h3 className="mb-4 text-xs font-mono font-bold uppercase tracking-wider text-foreground">
        Telemetry & Notification Preferences
      </h3>

      <div className="space-y-4 font-sans">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div>
            <div className="text-xs font-semibold text-foreground">Email Notifications</div>
            <div className="text-[11px] text-muted-foreground">Receive telemetry digest via email</div>
          </div>
          <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
        </div>

        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div>
            <div className="text-xs font-semibold text-foreground">In-App Notifications</div>
            <div className="text-[11px] text-muted-foreground">Show real-time alerts in interface</div>
          </div>
          <Switch checked={inAppEnabled} onCheckedChange={setInAppEnabled} />
        </div>

        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div>
            <div className="text-xs font-semibold text-foreground">Push Notifications</div>
            <div className="text-[11px] text-muted-foreground">Browser push alerts for critical events</div>
          </div>
          <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-foreground">High Match Threshold</div>
            <div className="text-[11px] text-muted-foreground">
              Minimum match score required to trigger recommendation alert
            </div>
          </div>
          <div className="flex items-center gap-3 w-44">
            <Slider
              min={50}
              max={100}
              step={5}
              value={[highMatchThreshold]}
              onValueChange={(val) => setHighMatchThreshold(val[0])}
              className="flex-1"
            />
            <span className="text-xs font-mono w-12 text-right font-bold text-primary">
              {highMatchThreshold}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div>
            <div className="text-xs font-semibold text-foreground">Daily Digest</div>
            <div className="text-[11px] text-muted-foreground">Summary of daily intelligence activity</div>
          </div>
          <Switch checked={dailyDigest} onCheckedChange={setDailyDigest} />
        </div>

        <div className="flex items-center justify-between pb-2">
          <div>
            <div className="text-xs font-semibold text-foreground">Weekly Digest</div>
            <div className="text-[11px] text-muted-foreground">Summary of weekly pipeline telemetry</div>
          </div>
          <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          size="sm"
          className="rounded border-2 border-primary shadow-brutal-primary font-mono text-xs uppercase tracking-wider"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
