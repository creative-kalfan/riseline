import React from "react";
import { SlidersHorizontal, MapPin, X, Briefcase, Layers, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterOptions } from "@/lib/jobs";

export type PrimaryFilterState = {
  // No Hybrid option: the backend exposes only a boolean remote flag, so a
  // Hybrid button would filter nothing. Add when hybrid-aware filtering lands.
  workMode?: "Remote" | "On-site" | "All";
  experience?: string;
  employmentType?: string;
  location?: string;
  verifiedLiveOnly?: boolean;
};

export function PrimaryFiltersBar({
  workMode,
  experience,
  employmentType,
  location,
  verifiedLiveOnly,
  onWorkModeSelect,
  onExperienceSelect,
  onEmploymentTypeSelect,
  onLocationChange,
  onToggleVerifiedLive,
  onOpenAdditional,
  onResetAll,
  activeAdditionalCount = 0,
  totalActiveCount = 0,
}: {
  workMode?: string;
  experience?: string;
  employmentType?: string;
  location?: string;
  verifiedLiveOnly?: boolean;
  onWorkModeSelect: (mode: "Remote" | "On-site" | "All") => void;
  onExperienceSelect: (exp: string | undefined) => void;
  onEmploymentTypeSelect: (type: string | undefined) => void;
  onLocationChange: (loc: string | undefined) => void;
  onToggleVerifiedLive?: () => void;
  onOpenAdditional: () => void;
  onResetAll: () => void;
  activeAdditionalCount?: number;
  totalActiveCount?: number;
}) {
  const currentWorkMode = workMode || "All";


  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b-2 border-border bg-surface">
      {/* Work Mode Segmented Control */}
      <div className="inline-flex items-center rounded-md border-2 border-border bg-background p-0.5 text-xs">
        {(["All", "Remote", "On-site"] as const).map((mode) => {
          const active = currentWorkMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onWorkModeSelect(mode)}
              className={`rounded-sm px-2.5 py-1 font-semibold transition-all text-xs select-none ${
                active
                  ? "bg-surface-elevated text-foreground border border-border shadow-brutal-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode}
            </button>
          );
        })}
      </div>

      {/* Experience Level Dropdown */}
      <div className="w-[125px]">
        <Select
          value={experience || "all"}
          onValueChange={(val) => onExperienceSelect(val === "all" ? undefined : val)}
        >
          <SelectTrigger className="h-8 rounded-md border-2 border-border bg-background px-2 text-xs font-medium">
            <div className="flex items-center gap-1.5 truncate">
              <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Experience" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-lg border-2 border-border shadow-brutal-md">
            <SelectItem value="all" className="text-xs">
              All Levels
            </SelectItem>
            {filterOptions.experience.map((exp) => (
              <SelectItem key={exp} value={exp} className="text-xs">
                {exp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Employment Type Dropdown */}
      <div className="w-[130px]">
        <Select
          value={employmentType || "all"}
          onValueChange={(val) => onEmploymentTypeSelect(val === "all" ? undefined : val)}
        >
          <SelectTrigger className="h-8 rounded-md border-2 border-border bg-background px-2 text-xs font-medium">
            <div className="flex items-center gap-1.5 truncate">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Job Type" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-lg border-2 border-border shadow-brutal-md">
            <SelectItem value="all" className="text-xs">
              All Job Types
            </SelectItem>
            {filterOptions.employmentType.map((type) => (
              <SelectItem key={type} value={type} className="text-xs">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Location Chip if provided */}
      {location && (
        <div className="inline-flex items-center gap-1.5 rounded-md border-2 border-border bg-surface-elevated px-2 py-1 text-xs text-foreground font-medium shadow-brutal-xs">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="max-w-[120px] truncate">{location}</span>
          <button
            onClick={() => onLocationChange(undefined)}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
            aria-label="Remove location filter"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {/* Verified Live Only Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVerifiedLive}
          className={`h-8 gap-1.5 rounded-md border-2 text-xs px-2.5 font-semibold transition-all ${
            verifiedLiveOnly
              ? "border-success bg-success/15 text-success shadow-brutal-xs"
              : "border-border bg-surface text-muted-foreground hover:text-foreground shadow-brutal-xs"
          }`}
          title="Filter for jobs verified live on first-party ATS"
        >
          <span className={`h-2 w-2 rounded-full ${verifiedLiveOnly ? "bg-success" : "bg-muted-foreground"}`} />
          <span>Verified Live</span>
        </Button>

        {/* Additional Filters Button */}
        <Button

          variant="outline"
          size="sm"
          onClick={onOpenAdditional}
          className={`h-8 gap-1.5 rounded-md border-2 text-xs px-2.5 font-semibold transition-all ${
            activeAdditionalCount > 0
              ? "border-primary bg-primary/10 text-primary shadow-brutal-xs"
              : "border-border bg-surface text-foreground hover:border-primary/80 shadow-brutal-xs"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
          {activeAdditionalCount > 0 && (
            <Badge
              variant="secondary"
              className="h-4.5 min-w-4.5 rounded-sm px-1.5 text-[10px] font-mono bg-primary text-primary-foreground border border-primary font-bold"
            >
              {activeAdditionalCount}
            </Badge>
          )}
        </Button>

        {/* Clear All action */}
        {totalActiveCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetAll}
            className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-md"
            title="Reset all filters"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
