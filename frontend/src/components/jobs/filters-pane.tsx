import { useEffect, useState } from "react";
import {
  SlidersHorizontal,
  MapPin,
  Briefcase,
  Building2,
  Clock,
  Sparkles,
  Wrench,
  ArrowUpDown,
  RotateCcw,
  Search,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { filterOptions } from "@/lib/jobs";

export type FiltersPaneValues = {
  role?: string;
  company?: string;
  location?: string;
  workMode?: string[];
  employmentType?: string[];
  experience?: string[];
  skills?: string[];
  sort?: string;
};

export function AdditionalFiltersDrawer({
  open,
  onOpenChange,
  values,
  onApply,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values?: FiltersPaneValues;
  onApply?: (filters: Record<string, string[]>) => void;
  onReset?: () => void;
}) {
  const [companyQuery, setCompanyQuery] = useState(values?.company ?? "");
  const [locationQuery, setLocationQuery] = useState(values?.location ?? "");
  const [selectedSort, setSelectedSort] = useState<string>(values?.sort ?? "best-match");
  const [skillSearch, setSkillSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, Set<string>>>({
    workMode: new Set(values?.workMode ?? []),
    employmentType: new Set(values?.employmentType ?? []),
    experience: new Set(values?.experience ?? []),
    skills: new Set(values?.skills ?? []),
  });

  useEffect(() => {
    if (values) {
      setCompanyQuery(values.company ?? "");
      setLocationQuery(values.location ?? "");
      if (values.sort) setSelectedSort(values.sort);
      setSelected({
        workMode: new Set(values.workMode ?? []),
        employmentType: new Set(values.employmentType ?? []),
        experience: new Set(values.experience ?? []),
        skills: new Set(values.skills ?? []),
      });
    }
  }, [values, open]);

  const toggle = (group: string, val: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      const s = new Set(next[group] ?? []);
      if (s.has(val)) s.delete(val);
      else s.add(val);
      next[group] = s;
      return next;
    });
  };

  const isOn = (group: string, val: string) => {
    return selected[group]?.has(val) ?? false;
  };

  const handleApply = () => {
    const payload: Record<string, string[]> = {};
    if (companyQuery.trim()) payload.company = [companyQuery.trim()];
    if (locationQuery.trim()) payload.location = [locationQuery.trim()];
    if (selectedSort) payload.sort = [selectedSort];
    Object.entries(selected).forEach(([key, set]) => {
      if (set.size > 0) payload[key] = Array.from(set);
    });
    onApply?.(payload);
    onOpenChange(false);
  };

  const handleReset = () => {
    setCompanyQuery("");
    setLocationQuery("");
    setSelectedSort("best-match");
    setSelected({
      workMode: new Set(),
      employmentType: new Set(),
      experience: new Set(),
      skills: new Set(),
    });
    onReset?.();
    onApply?.({});
  };

  const filteredSkills = filterOptions.skills.filter((s) =>
    s.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  const activeCount =
    (companyQuery.trim() ? 1 : 0) +
    (locationQuery.trim() ? 1 : 0) +
    selected.skills.size +
    (selectedSort && selectedSort !== "best-match" ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 gap-0 border-l-2 border-border bg-surface shadow-brutal-lg">
        <SheetHeader className="p-5 border-b-2 border-border text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <SheetTitle className="text-sm font-extrabold tracking-tight uppercase">
                Additional Filters
              </SheetTitle>
              {activeCount > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-sm text-[10px] bg-primary text-primary-foreground border border-primary font-mono font-bold"
                >
                  {activeCount} active
                </Badge>
              )}
            </div>
          </div>
          <SheetDescription className="text-xs text-muted-foreground mt-0.5">
            Refine opportunities by company, tech stack, and discovery criteria.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-5 py-4">
          <div className="space-y-5">
            {/* Skills & Tech Stack Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-mono">
                  <Wrench className="h-3.5 w-3.5 text-primary" />
                  Skills & Technologies
                </label>
                {selected.skills.size > 0 && (
                  <span className="text-[11px] font-mono text-primary font-bold">
                    {selected.skills.size} selected
                  </span>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Filter skills (e.g. React, Python)..."
                  className="h-8.5 rounded-md pl-8 text-xs bg-background border-2 border-border font-medium"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {filteredSkills.map((skill) => {
                  const active = isOn("skills", skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggle("skills", skill)}
                      className={`inline-flex items-center gap-1 rounded-sm border-2 px-2.5 py-1 text-xs font-mono font-bold transition-all ${
                        active
                          ? "border-primary bg-primary/10 text-primary shadow-brutal-xs"
                          : "border-border bg-surface-elevated text-muted-foreground hover:border-border hover:text-foreground"
                      }`}
                    >
                      {active && <Check className="h-3 w-3 text-primary" />}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Company Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-mono">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                Company
              </label>
              <Input
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                placeholder="e.g. Stripe, OpenAI, Google"
                className="h-9 rounded-md text-xs bg-background border-2 border-border font-medium"
              />
            </div>

            {/* Target Location / City Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-mono">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Specific City or Region
              </label>
              <Input
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="e.g. Bengaluru, San Francisco, London"
                className="h-9 rounded-md text-xs bg-background border-2 border-border font-medium"
              />
            </div>

            {/* Sort Criteria */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-mono">
                <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-2">
                {filterOptions.sort.map((s) => {
                  const active = selectedSort === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSelectedSort(s.value)}
                      className={`rounded-md border-2 px-3 py-2 text-left text-xs font-semibold transition-all ${
                        active
                          ? "border-primary bg-surface-elevated text-foreground shadow-brutal-xs"
                          : "border-border bg-background text-muted-foreground hover:border-border hover:text-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="p-4 border-t-2 border-border bg-surface flex flex-row items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-9 rounded-md px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset all
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-md px-3 text-xs font-semibold border-2 border-border shadow-brutal-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="h-9 rounded-md px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary shadow-brutal-primary"
            >
              Apply Filters
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Export backward-compatible alias for existing imports
export { AdditionalFiltersDrawer as FiltersPane };
