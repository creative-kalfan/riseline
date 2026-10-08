"use client";

import { useState } from "react";
import { MoreVertical, Trash2, Copy, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-tooltip";
import {
  useVersions,
  useCreateVersion,
  useUpdateVersion,
  useDeleteVersion,
  useDuplicateVersion,
  useVersionDiff,
} from "@/hooks/api/useVersions";
import type { ResumeVersion } from "@/types/version";

type VersionManagerProps = {
  resumeId: string;
  onSelectVersion?: (version: ResumeVersion | null) => void;
  selectedVersionId?: string | null;
};

export function VersionManager({
  resumeId,
  onSelectVersion,
  selectedVersionId,
}: VersionManagerProps) {
  const { toast } = useToast();
  const { data: versionsData } = useVersions(resumeId);

  const [showCreate, setShowCreate] = useState(false);
  const [showRename, setShowRename] = useState<ResumeVersion | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobDescription, setNewJobDescription] = useState("");

  const createVersion = useCreateVersion(resumeId);
  const updateVersion = useUpdateVersion(showRename?.id || "", resumeId);
  const deleteVersion = useDeleteVersion(resumeId);
  const duplicateVersion = useDuplicateVersion(resumeId);
  const diffQuery = useVersionDiff(selectedVersionId || "");

  const versions = versionsData?.versions || [];
  const master = versions.find((v) => v.is_master);
  const targeted = versions.filter((v) => !v.is_master && v.status !== "deleted");

  const handleCreate = async () => {
    if (!newVersionName.trim()) return;
    try {
      await createVersion.mutateAsync({
        version_name: newVersionName.trim(),
        target_job_title: newJobTitle.trim() || undefined,
        job_description: newJobDescription.trim() || undefined,
        template: "minimal",
        source: "manual",
      });
      toast.success("Version created");
      setShowCreate(false);
      setNewVersionName("");
      setNewJobTitle("");
      setNewJobDescription("");
    } catch {
      toast.error("Failed to create version");
    }
  };

  const handleDelete = async (version: ResumeVersion) => {
    if (version.is_master) {
      toast.error("Cannot delete master resume");
      return;
    }
    try {
      await deleteVersion.mutateAsync(version.id);
      toast.success("Version deleted");
      if (selectedVersionId === version.id) {
        onSelectVersion?.(null);
      }
    } catch {
      toast.error("Failed to delete version");
    }
  };

  const handleDuplicate = async (version: ResumeVersion) => {
    try {
      await duplicateVersion.mutateAsync({
        versionId: version.id,
        newName: `Copy of ${version.version_name}`,
      });
      toast.success("Version duplicated");
    } catch {
      toast.error("Failed to duplicate version");
    }
  };

  const handleRename = async () => {
    if (!showRename || !newVersionName.trim()) return;
    try {
      await updateVersion.mutateAsync({
        version_name: newVersionName.trim(),
      });
      toast.success("Renamed");
      setShowRename(null);
      setNewVersionName("");
    } catch {
      toast.error("Failed to rename");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Resume Versions</h3>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="border-2 border-border font-mono text-xs shadow-brutal-xs hover:shadow-brutal-sm">
              <span className="mr-1 font-bold">+</span> New Version
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 border-border shadow-brutal-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-mono uppercase tracking-tight">Create Job-Specific Resume</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Version Name</Label>
                <Input
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  placeholder="e.g. Barclays Data Analyst"
                />
              </div>
              <div>
                <Label>Target Job Title</Label>
                <Input
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="e.g. Data Analyst"
                />
              </div>
              <div>
                <Label>Job Description</Label>
                <Textarea
                  value={newJobDescription}
                  onChange={(e) => setNewJobDescription(e.target.value)}
                  rows={4}
                  placeholder="Paste job description..."
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Version
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {master && (
        <Card
          className={`p-4 cursor-pointer transition-all border-2 rounded-lg ${
            selectedVersionId === master.id
              ? "border-primary bg-primary/5 shadow-brutal-sm"
              : "border-border/70 hover:border-primary/60 hover:shadow-brutal-xs"
          }`}
          onClick={() => onSelectVersion?.(master)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-amber-500 font-bold">★</span>
              <div>
                <p className="text-sm font-semibold tracking-tight">{master.version_name}</p>
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Master Resume</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono border border-border/80">
              MASTER
            </Badge>
          </div>
        </Card>
      )}

      {targeted.length === 0 && (
        <p className="text-xs text-muted-foreground border-2 border-dashed border-border/60 rounded-md p-4 text-center">
          No targeted versions yet. Create one to get started.
        </p>
      )}

      {targeted.map((version) => (
        <Card
          key={version.id}
          className={`p-4 cursor-pointer transition-all border-2 rounded-lg ${
            selectedVersionId === version.id
              ? "border-primary bg-primary/5 shadow-brutal-sm"
              : "border-border/70 hover:border-primary/60 hover:shadow-brutal-xs"
          }`}
          onClick={() => onSelectVersion?.(version)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate tracking-tight">{version.version_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {version.target_job_title && (
                    <span className="text-xs text-muted-foreground truncate">
                      {version.target_job_title}
                    </span>
                  )}
                  {version.target_company && (
                    <span className="text-xs text-muted-foreground truncate">
                      @{version.target_company}
                    </span>
                  )}
                  {version.last_ats_score !== null && version.last_ats_score !== undefined && (
                    <Badge variant="outline" className="text-[10px] font-mono border-2 border-primary/30 text-primary">
                      ATS {Math.round(version.last_ats_score)}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 border border-border/60 hover:border-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-2 border-border shadow-brutal-md">
                <DropdownMenuItem
                  onClick={() => {
                    setShowRename(version);
                    setNewVersionName(version.version_name);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(version)}>
                  <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    diffQuery.refetch();
                    setShowDiff(true);
                  }}
                >
                  <span className="h-3.5 w-3.5 mr-2">↔</span> View Changes
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive font-medium"
                  onClick={() => handleDelete(version)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      ))}

      {showRename && (
        <Dialog open={!!showRename} onOpenChange={(open) => !open && setShowRename(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Version</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="New name"
              />
              <Button onClick={handleRename} className="w-full">
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showDiff && selectedVersionId && (
        <Dialog open={showDiff} onOpenChange={setShowDiff}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Changes from Master</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {diffQuery.data?.diff?.changed?.length ? (
                diffQuery.data.diff.changed.map((item) => (
                  <div key={item} className="text-sm">
                    ✓ {item}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No changes detected or diff not available.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
