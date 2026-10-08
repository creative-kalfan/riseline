import { createFileRoute, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge, StatusChip } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Evidence } from "@/components/ui/evidence";
import { ListRow } from "@/components/ui/list-row";
import { Kbd } from "@/components/shared/kbd";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/dev/ui")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: DevUiPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="text-13 font-semibold text-muted-foreground">{title}</h2>
      <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>
    </section>
  );
}

function ThemeColumn({ theme, label }: { theme: "light" | "dark"; label: string }) {
  return (
    <div data-theme={theme} className="rounded-lg border border-border bg-bg p-4">
      <p className="text-13 font-semibold text-text">{label}</p>
      <div className="mt-3 grid gap-3">
        <Section title="Buttons">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
        </Section>
        <Section title="Status">
          <Badge>Default</Badge>
          <StatusChip status="success">Matched</StatusChip>
          <StatusChip status="warning">Partial</StatusChip>
          <StatusChip status="danger">Missing</StatusChip>
        </Section>
        <Section title="Inputs">
          <Input placeholder="Search roles" aria-label={`${label} search`} className="max-w-56" />
          <Select>
            <SelectTrigger className="max-w-56" aria-label={`${label} select`}>
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Applied</SelectItem>
              <SelectItem value="b">Interview</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-text">
            <Checkbox defaultChecked aria-label={`${label} checkbox`} /> Remember
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <Switch defaultChecked aria-label={`${label} switch`} /> Alerts
          </label>
        </Section>
        <Section title="Evidence">
          <p className="prose text-sm text-text">
            Led checkout migration with <Evidence>99.98% success over 40k orders</Evidence> in Q2.
          </p>
          <span className="tnum text-sm text-text">Score 87.5</span>
          <Kbd>⌘K</Kbd>
        </Section>
        <Section title="List rows">
          <div role="table" aria-label={`${label} jobs`} className="w-full">
            <ListRow selected>
              <span>Senior Frontend Engineer · Acme</span>
            </ListRow>
            <ListRow>
              <span>Platform Engineer · Globex</span>
            </ListRow>
          </div>
        </Section>
        <Section title="Table">
          <Table aria-label={`${label} table`}>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Fit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Frontend Engineer</TableCell>
                <TableCell>87.5</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Section>
        <Section title="Alerts">
          <Alert variant="success">
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription>Application moved to Interview.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Something failed</AlertTitle>
            <AlertDescription>Retry the request.</AlertDescription>
          </Alert>
        </Section>
      </div>
    </div>
  );
}

function DevUiPage() {
  const { preference, resolved } = useTheme();
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Design primitives (dev only)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          <span className="tnum text-sm text-muted-foreground">
            Preference: {preference} · Resolved: {resolved}
          </span>
          <Textarea placeholder="Notes" aria-label="Notes" className="max-w-72" />
          <Tabs defaultValue="a" aria-label="Demo tabs">
            <TabsList>
              <TabsTrigger value="a">Suggestions</TabsTrigger>
              <TabsTrigger value="b">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="a">
              <Skeleton className="h-8 w-48" />
            </TabsContent>
            <TabsContent value="b">Preview pane</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <ThemeColumn theme="light" label="Light" />
        <ThemeColumn theme="dark" label="Dark" />
      </div>
    </div>
  );
}
