import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  User,
  Palette,
  Bell,
  Link2,
  Shield,
  CheckCircle2,
  Sparkles,
  Save,
  Moon,
  Sun,
  Laptop,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/useAuth";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings · CareerOS" },
      {
        name: "description",
        content: "Account, appearance, integrations and workspace preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile } = useAuth();

  // Form states truthfully initialized from auth user/profile
  const extProfile = profile as any;
  const [name, setName] = useState(user?.name || extProfile?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [jobTitle, setJobTitle] = useState(extProfile?.desiredRole || "");
  const [location, setLocation] = useState(extProfile?.location || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user?.name && !name) setName(user.name);
    else if (extProfile?.fullName && !name) setName(extProfile.fullName);
    if (user?.email && !email) setEmail(user.email);
    if (extProfile?.desiredRole && !jobTitle) setJobTitle(extProfile.desiredRole);
    if (extProfile?.location && !location) setLocation(extProfile.location);
  }, [user, profile]);

  // Appearance states
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [compactMode, setCompactMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Notification states
  const [emailDigest, setEmailDigest] = useState(true);
  const [interviewAlerts, setInterviewAlerts] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  // Integration states
  const [linkedInConnected, setLinkedInConnected] = useState(true);
  const [githubConnected, setGithubConnected] = useState(true);
  const [calendarSync, setCalendarSync] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Manage your account profile, appearance, notifications, and integrations."
      />

      <Tabs defaultValue="account" className="w-full space-y-6">
        <TabsList className="h-11 w-full justify-start gap-1 rounded-lg border-2 border-border bg-card p-1 shadow-brutal-xs sm:w-auto">
          <TabsTrigger value="account" className="gap-2 rounded font-mono text-xs font-bold uppercase">
            <User className="h-3.5 w-3.5" />
            Account
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 rounded font-mono text-xs font-bold uppercase">
            <Palette className="h-3.5 w-3.5" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 rounded font-mono text-xs font-bold uppercase">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2 rounded font-mono text-xs font-bold uppercase">
            <Link2 className="h-3.5 w-3.5" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* ACCOUNT TAB */}
        <TabsContent value="account" className="space-y-6">
          <Card className="rounded-lg border-2 border-border bg-card shadow-brutal-xs">
            <CardHeader className="p-5 pb-3 border-b-2 border-border/40">
              <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider">Profile Information</CardTitle>
              <CardDescription className="text-xs">
                Update your personal details and public career persona.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-mono font-medium text-foreground">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      value={name}
                      placeholder="e.g. Alex Morgan"
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 rounded border-2 border-border bg-background text-xs sm:text-sm font-sans"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-mono font-medium text-foreground">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      placeholder="e.g. alex@example.com"
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 rounded border-2 border-border bg-background text-xs sm:text-sm font-sans"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="jobTitle" className="text-xs font-mono font-medium text-foreground">
                      Target Job Title
                    </label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      placeholder="e.g. Staff Software Engineer"
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="h-10 rounded border-2 border-border bg-background text-xs sm:text-sm font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="location" className="text-xs font-mono font-medium text-foreground">
                      Location / Timezone
                    </label>
                    <Input
                      id="location"
                      value={location}
                      placeholder="e.g. San Francisco, CA or Remote"
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-10 rounded border-2 border-border bg-background text-xs sm:text-sm font-sans"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3">
                  {savedSuccess ? (
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> CHANGES SAVED SUCCESSFULLY
                    </span>
                  ) : (
                    <span />
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 gap-1.5 rounded border-2 border-primary shadow-brutal-primary font-mono text-xs uppercase tracking-wider"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-2 border-border bg-card shadow-brutal-xs">
            <CardHeader className="p-5 pb-3 border-b-2 border-border/40">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider">Security & Authentication</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Manage your credentials and authentication security.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="currentPass" className="text-xs font-mono font-medium text-foreground">
                    Current Password
                  </label>
                  <Input
                    id="currentPass"
                    type="password"
                    placeholder="••••••••••••"
                    className="h-10 rounded border-2 border-border bg-background text-xs sm:text-sm font-sans"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="newPass" className="text-xs font-mono font-medium text-foreground">
                    New Password
                  </label>
                  <Input
                    id="newPass"
                    type="password"
                    placeholder="••••••••••••"
                    className="h-10 rounded border-2 border-border bg-background text-xs sm:text-sm font-sans"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button variant="outline" size="sm" className="h-9 rounded border-2 border-border shadow-brutal-xs hover:shadow-brutal-sm font-mono text-xs uppercase tracking-wider">
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPEARANCE TAB */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="rounded-lg border-2 border-border bg-card shadow-brutal-xs">
            <CardHeader className="p-5 pb-3 border-b-2 border-border/40">
              <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider">Workspace Theme</CardTitle>
              <CardDescription className="text-xs">
                Select your preferred visual mode for CareerOS workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    id: "dark" as const,
                    label: "Dark Mode",
                    icon: Moon,
                    desc: "Default precision aesthetic",
                  },
                  {
                    id: "light" as const,
                    label: "Light Mode",
                    icon: Sun,
                    desc: "Crisp daytime brightness",
                  },
                  {
                    id: "system" as const,
                    label: "System Sync",
                    icon: Laptop,
                    desc: "Follow OS setting",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTheme(item.id)}
                      className={`group flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all ${
                        active
                          ? "border-primary bg-primary/10 shadow-brutal-primary"
                          : "border-border bg-card hover:border-primary/60 hover:shadow-brutal-xs"
                      }`}
                    >
                      <div
                        className={`grid h-8 w-8 place-items-center rounded border-2 ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold uppercase tracking-tight text-foreground">{item.label}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-4 border-t border-border/80 pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-foreground">Compact Density</div>
                    <div className="text-[11px] text-muted-foreground">
                      Tighter padding and smaller row heights for maximum information density.
                    </div>
                  </div>
                  <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-foreground">High Contrast Borders</div>
                    <div className="text-[11px] text-muted-foreground">
                      Increase separation lines for improved visibility in high-glare environments.
                    </div>
                  </div>
                  <Switch checked={highContrast} onCheckedChange={setHighContrast} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="rounded-lg border-2 border-border bg-card shadow-brutal-xs">
            <CardHeader className="p-5 pb-3 border-b-2 border-border/40">
              <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider">Notification Preferences</CardTitle>
              <CardDescription className="text-xs">
                Configure how and when CareerOS keeps you updated during your search.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">Daily Job Digest</div>
                    <div className="text-[11px] text-muted-foreground">
                      Morning briefing of newly matched roles and saved job updates.
                    </div>
                  </div>
                  <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
                </div>

                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      Interview & Deadline Alerts
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Reminders for upcoming interview rounds, take-homes, and follow-ups.
                    </div>
                  </div>
                  <Switch checked={interviewAlerts} onCheckedChange={setInterviewAlerts} />
                </div>

                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      AI Resume Copilot Suggestions
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Proactive optimization recommendations when analyzing target postings.
                    </div>
                  </div>
                  <Switch checked={aiSuggestions} onCheckedChange={setAiSuggestions} />
                </div>

                <div className="flex items-center justify-between pb-1">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      Weekly Performance Summary
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Analytics digest with application metrics and interview conversion rate.
                    </div>
                  </div>
                  <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTEGRATIONS TAB */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="rounded-lg border-2 border-border bg-card shadow-brutal-xs">
            <CardHeader className="p-5 pb-3 border-b-2 border-border/40">
              <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider">Connected Services</CardTitle>
              <CardDescription className="text-xs">
                Synchronize your professional accounts and calendar with CareerOS.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border-2 border-border bg-muted/20 p-3.5 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded border-2 border-border bg-muted/50 font-mono font-bold text-primary shadow-2xs">
                      in
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">LinkedIn Sync</span>
                        <Badge variant="secondary" className="rounded border border-border px-1.5 py-0 font-mono text-[10px] uppercase">
                          Active
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Import profile data, recommendations, and job bookmarks.
                      </p>
                    </div>
                  </div>
                  <Switch checked={linkedInConnected} onCheckedChange={setLinkedInConnected} />
                </div>

                <div className="flex items-center justify-between rounded-lg border-2 border-border bg-muted/20 p-3.5 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded border-2 border-border bg-muted/50 font-mono font-bold text-foreground shadow-2xs">
                      GH
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          GitHub Portfolio
                        </span>
                        <Badge variant="secondary" className="rounded border border-border px-1.5 py-0 font-mono text-[10px] uppercase">
                          Active
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Extract top repositories and contribution evidence for resume bullets.
                      </p>
                    </div>
                  </div>
                  <Switch checked={githubConnected} onCheckedChange={setGithubConnected} />
                </div>

                <div className="flex items-center justify-between rounded-lg border-2 border-border bg-muted/20 p-3.5 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded border-2 border-border bg-muted/50 text-warning shadow-2xs">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          Google Calendar
                        </span>
                        <Badge variant="outline" className="rounded border border-border px-1.5 py-0 font-mono text-[10px] uppercase">
                          Optional
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Auto-sync scheduled interview rounds to your external calendar.
                      </p>
                    </div>
                  </div>
                  <Switch checked={calendarSync} onCheckedChange={setCalendarSync} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
