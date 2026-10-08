import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Shield,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal · CareerOS" },
      {
        name: "description",
        content: "Platform administration and analytics dashboard.",
      },
    ],
  }),
  component: AdminPortal,
} as any);

function AdminPortal() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Portal</h1>
          <p className="mt-1 text-muted-foreground">Platform administration and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Admin Access</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="crawlers">Crawlers</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="ats">ATS Reports</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Overview Tab — no admin metrics endpoint exists, so show an honest
          placeholder instead of fabricated platform numbers. */}
      {activeTab === "overview" && (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Platform administration and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Settings className="h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">Not available yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Platform metrics aren&apos;t exposed by the backend yet. The overview
                will appear here once an admin metrics endpoint exists.
              </p>
              <Button className="mt-4" variant="outline">
                Request Access
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Tabs */}
      {activeTab !== "overview" && (
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">{activeTab}</CardTitle>
            <CardDescription>Manage {activeTab}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Settings className="h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">Coming Soon</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The {activeTab} management interface is under development.
              </p>
              <Button className="mt-4" variant="outline">
                Request Access
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
