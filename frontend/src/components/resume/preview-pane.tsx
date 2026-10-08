import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import {
  Minus,
  Plus,
  Maximize2,
  Download,
  Printer,
  FileText,
  AlertTriangle,
  Loader2,
  Sparkles,
  Check,
  X,
  Pencil,
  Trash2,
  PlusCircle,
  GripVertical,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ResumeData,
  ResumeProfile,
  ResumeContact,
  ExperienceItem,
  BulletItem,
} from "@/types/resume";
import type { OptimizationSuggestion } from "@/types/optimization";
import { TemplatePreview } from "@/components/resume/templates/template-preview";
// Split: pdf-canvas-preview statically imports pdfjs-dist. Lazy keeps the PDF
// engine off the resume route critical path; it loads only when canvas mode
// (original-PDF view) actually renders. TemplatePreview stays static.
const PdfCanvasPreview = lazy(() =>
  import("@/components/resume/pdf-canvas-preview").then((m) => ({
    default: m.PdfCanvasPreview,
  })),
);
import type { AtsRequirementCoverage } from "@/api/ats";
import type { EvidenceLocationMap } from "@/lib/evidence-location";
import type { DocumentGeometryMap, GeometryBlock } from "@/types/geometry";
import type { ResumeVersion } from "@/types/version";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

/** Adds subtle perspective tilt to the document — degrades gracefully on mobile/reduced-motion. */
function SpatialDocumentStage({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 30 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 30 });

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    rotateY.set(dx * 2.5);
    rotateX.set(-dy * 1.5);
  }

  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  if (reducedMotion) {
    return <div className="flex min-h-full items-start justify-center p-6 sm:p-10">{children}</div>;
  }

  return (
    <motion.div
      className="flex min-h-full items-start justify-center p-6 sm:p-10"
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ perspective: "1400px" }}
    >
      <motion.div
        style={{
          rotateX: springX,
          rotateY: springY,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, y: 24, rotateX: 3 }}
        animate={{
          opacity: 1,
          y: 0,
          rotateX: 0,
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 10;

export type DocumentPreviewMode = "canonical";

interface PreviewPaneProps {
  resume: ResumeData;
  templateSlug?: string;
  isScanning?: boolean;
  atsIssues?: string[];
  onSelectIssue?: (issue: string) => void;
  requirementCoverage?: AtsRequirementCoverage[];
  evidenceLocations?: EvidenceLocationMap | null;
  onEvidenceLocationsChange?: (locations: EvidenceLocationMap | null) => void;
  selectedRequirementId?: string | null;
  selectedTargetId?: string | null;
  onSelectElement?: (elementId: string, section?: string) => void;
  onExportPdf?: () => void;
  onExportDocx?: () => void;
  onCompareOriginal?: () => void;
  isDocumentLoading?: boolean;
  onUpdateResume?: (updated: ResumeData) => void;
  onDropSuggestion?: (
    suggestion: OptimizationSuggestion,
    section: string,
    targetId?: string,
  ) => void;
  selectedVersion?: ResumeVersion | null;
  /** Canonical storage path resolved by the route (version → resume fallback). */
  activeStoragePath?: string | null;
  /** Error raised while resolving the signed URL for the original PDF. */
  originalPdfError?: string | null;
  /** Retry callback for the signed-URL resolution. */
  onRetryOriginalPdf?: () => void;
  originalPdfUrl?: string | null;
  geometryMap?: DocumentGeometryMap | null;
  onMutateBlock?: (pageIndex: number, block: GeometryBlock, text: string) => Promise<void>;
}

export function PreviewPane({
  resume,
  templateSlug,
  isScanning = false,
  atsIssues = [],
  onSelectIssue,
  requirementCoverage,
  evidenceLocations,
  onEvidenceLocationsChange,
  selectedRequirementId,
  selectedTargetId,
  onSelectElement,
  onExportPdf,
  onExportDocx,
  onCompareOriginal,
  isDocumentLoading = false,
  onUpdateResume,
  onDropSuggestion,
  selectedVersion,
  activeStoragePath: activeStoragePathProp,
  originalPdfError,
  onRetryOriginalPdf,
  originalPdfUrl,
  geometryMap,
  onMutateBlock,
}: PreviewPaneProps) {
  const [zoom, setZoom] = useState(100);

  // Single source of truth: the route resolves the canonical storage path
  // (selected version meta → resume meta → resume record column). Do NOT
  // re-derive it here from the projected `resume` object, which does not
  // carry the storage path — that divergence is what previously caused the
  // synthetic A4Page fallback to render instead of the original PDF.
  const activeStoragePath =
    activeStoragePathProp ??
    selectedVersion?.meta?.storage_path ??
    resume.meta?.storage_path ??
    resume.storage_path ??
    null;

  const isUploadedDocument = Boolean(
    activeStoragePath ||
    resume.original_filename ||
    resume.source === "upload" ||
    resume.source === "upload_parse" ||
    resume.source === "pdf_edit" ||
    selectedVersion?.source === "upload_parse" ||
    selectedVersion?.source === "pdf_edit",
  );

  // A resume backed by an uploaded file must NEVER silently fall back to a
  // synthetic resume. While the signed URL resolves we show a loading
  // skeleton; if resolution fails we show a real error with retry.
  const isAwaitingPdf = Boolean(
    (activeStoragePath || (isUploadedDocument && !originalPdfError)) &&
    !originalPdfUrl &&
    !originalPdfError &&
    !templateSlug,
  );
  const isPdfFailed = Boolean(
    (activeStoragePath || isUploadedDocument) && originalPdfError && !templateSlug,
  );
  const isCanvasMode = Boolean(activeStoragePath && originalPdfUrl && !templateSlug);

  const change = (dir: 1 | -1) => {
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + dir * ZOOM_STEP)));
  };

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Bidirectional sync: when selectedTargetId or selectedRequirementId changes, smooth-scroll to it
  useEffect(() => {
    if (!selectedTargetId && !selectedRequirementId) return;
    const targetKey = selectedTargetId || selectedRequirementId;
    if (!targetKey) return;

    const normalizedKey = targetKey.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const targetEl =
      document.querySelector(`[data-resume-bullet-id="${targetKey}"]`) ||
      document.querySelector(`[data-resume-item-id="${targetKey}"]`) ||
      document.querySelector(`[data-resume-section="${targetKey}"]`) ||
      document.getElementById(`resume-bullet-${targetKey}`) ||
      document.getElementById(`resume-item-${targetKey}`) ||
      document.getElementById(`resume-section-${targetKey}`) ||
      document.getElementById(`resume-skill-${normalizedKey}`) ||
      document.getElementById(targetKey);

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedTargetId, selectedRequirementId]);

  return (
    <div className="flex h-full flex-col bg-background select-none">
      {/* Professional Canonical Workspace Toolbar */}
      <div className="workstation-panel flex items-center gap-2 border-b border-border/80 px-4 py-2 shrink-0 z-10 shadow-xs flex-wrap">
        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 rounded-lg border border-border/80 bg-surface-instrument/80 p-0.5 shadow-inner-recessed shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => change(-1)}
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
            aria-label="Zoom out"
            disabled={zoom <= ZOOM_MIN}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            title="Reset to 100%"
            className="w-12 text-center font-mono text-[11px] tabular-nums font-semibold text-foreground hover:bg-surface-elevated rounded py-0.5 transition-colors"
          >
            {zoom}%
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => change(1)}
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
            aria-label="Zoom in"
            disabled={zoom >= ZOOM_MAX}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
          onClick={() => setZoom(100)}
          aria-label="Actual size"
          title="Actual size (100%)"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-5 bg-border/60" />

        {/* Canonical Document Identifier */}
        <Badge
          variant="outline"
          className="rounded-md border-border/80 bg-surface-elevated/40 px-2.5 py-0.5 text-[10.5px] font-medium text-foreground flex items-center gap-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {isCanvasMode
            ? "Original PDF Stage · Interactive Geometry"
            : templateSlug
              ? `Template: ${templateSlug}`
              : "Canonical Resume Document · Editable"}
        </Badge>

        {isScanning && (
          <span
            role="status"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[10.5px] font-medium text-primary shadow-2xs"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
            Scanning resume…
          </span>
        )}

        {/* Right Action Controls */}
        <div className="ml-auto flex items-center gap-1.5 flex-wrap justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
            onClick={handlePrint}
            aria-label="Print document"
            title="Print resume"
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>
          {onExportPdf && (
            <Button
              size="sm"
              onClick={onExportPdf}
              className="h-7 rounded-md text-xs font-medium px-2.5 shadow-2xs"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
            </Button>
          )}
          {onExportDocx && (
            <Button size="sm" variant="outline" onClick={onExportDocx} className="h-7 rounded-md px-2.5 text-xs font-medium">
              <FileText className="mr-1.5 h-3.5 w-3.5" /> DOCX
            </Button>
          )}
          {onCompareOriginal && (
            <Button size="sm" variant="outline" onClick={onCompareOriginal} className="h-7 rounded-md px-2.5 text-xs font-medium">
              Compare original
            </Button>
          )}
        </div>
      </div>

      {/* Neutral Dark Document Workbench Canvas */}
      <ScrollArea className="flex-1 bg-zinc-950/95 dark:bg-[#090a0d] bg-cockpit-grid">
        {isDocumentLoading || isAwaitingPdf ? (
          <div className="flex min-h-full items-start justify-center p-6 sm:p-10">
            <div
              className="transition-transform duration-100 ease-out origin-top flex flex-col items-center"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <A4DocumentSkeleton />
            </div>
          </div>
        ) : isPdfFailed ? (
          <div className="flex min-h-full items-start justify-center p-6 sm:p-10">
            <div
              className="flex flex-col items-center gap-4 rounded-lg border border-destructive/40 bg-destructive/5 px-8 py-10 text-center"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
              role="alert"
            >
              <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Unable to load original resume
                </p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  The original uploaded document could not be opened. Your resume file is intact —
                  retry loading it.
                </p>
              </div>
              {onRetryOriginalPdf && (
                <Button size="sm" variant="outline" onClick={onRetryOriginalPdf}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retry
                </Button>
              )}
            </div>
          </div>
        ) : isCanvasMode ? (
          <SpatialDocumentStage>
            <Suspense fallback={<A4DocumentSkeleton />}>
              <PdfCanvasPreview
              url={originalPdfUrl!}
              zoom={zoom / 100}
              isScanning={isScanning}
              highlightStrings={atsIssues}
              onSelectIssue={onSelectIssue}
              requirementCoverage={requirementCoverage}
              evidenceLocations={evidenceLocations}
              onEvidenceLocationsChange={onEvidenceLocationsChange}
              selectedRequirementId={selectedRequirementId}
              geometryMap={geometryMap}
              selectedTargetId={selectedTargetId}
              onSelectElement={onSelectElement}
              onMutateBlock={onMutateBlock}
              />
            </Suspense>
          </SpatialDocumentStage>
        ) : !templateSlug && isUploadedDocument ? (
          <div className="flex min-h-full items-start justify-center p-6 sm:p-10">
            <div
              className="flex flex-col items-center gap-4 rounded-lg border border-border/60 bg-surface-elevated/40 px-8 py-10 text-center"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
              role="status"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Synchronizing Resume Document
                </p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Compiling high-fidelity layout and verifying document geometry...
                </p>
              </div>
              {onRetryOriginalPdf && (
                <Button size="sm" variant="outline" onClick={onRetryOriginalPdf}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reload Document
                </Button>
              )}
            </div>
          </div>
        ) : (
          <SpatialDocumentStage>
            <div
              className="transition-transform duration-100 ease-out origin-top flex flex-col items-center"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              {templateSlug ? (
                <TemplatePreviewWrapper resume={resume} templateSlug={templateSlug} />
              ) : (
                <A4Page
                  resume={resume}
                  selectedTargetId={selectedTargetId}
                  onSelectElement={onSelectElement}
                  onUpdateResume={onUpdateResume}
                  onDropSuggestion={onDropSuggestion}
                />
              )}
            </div>
          </SpatialDocumentStage>
        )}
      </ScrollArea>
    </div>
  );
}

interface A4PageProps {
  resume: ResumeData;
  selectedTargetId?: string | null;
  onSelectElement?: (elementId: string, section?: string) => void;
  onUpdateResume?: (updated: ResumeData) => void;
  onDropSuggestion?: (
    suggestion: OptimizationSuggestion,
    section: string,
    targetId?: string,
  ) => void;
}

// 794 × 1123 px ≈ A4 at 96dpi
export function A4Page({
  resume,
  selectedTargetId,
  onSelectElement,
  onUpdateResume,
  onDropSuggestion,
}: A4PageProps) {
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [newSkillText, setNewSkillText] = useState("");
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  const contact = resume.contact;

  const handleUpdateContact = (field: keyof ResumeContact, value: string) => {
    if (!onUpdateResume) return;
    onUpdateResume({
      ...resume,
      contact: {
        ...resume.contact,
        [field]: value,
      },
    });
  };

  const handleUpdateSummary = (text: string) => {
    if (!onUpdateResume) return;
    onUpdateResume({
      ...resume,
      summary: text,
    });
  };

  const handleUpdateExperienceItem = (expId: string, updates: Partial<ExperienceItem>) => {
    if (!onUpdateResume) return;
    onUpdateResume({
      ...resume,
      experience: resume.experience.map((exp) => (exp.id === expId ? { ...exp, ...updates } : exp)),
    });
  };

  const handleUpdateBullet = (expId: string, bulletId: string, newText: string) => {
    if (!onUpdateResume) return;
    onUpdateResume({
      ...resume,
      experience: resume.experience.map((exp) => {
        if (exp.id !== expId) return exp;
        return {
          ...exp,
          bullets: exp.bullets.map((b) => (b.id === bulletId ? { ...b, text: newText } : b)),
        };
      }),
    });
  };

  const handleAddBullet = (expId: string) => {
    if (!onUpdateResume) return;
    const newBulletId = `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    onUpdateResume({
      ...resume,
      experience: resume.experience.map((exp) => {
        if (exp.id !== expId) return exp;
        return {
          ...exp,
          bullets: [...exp.bullets, { id: newBulletId, text: "New achievement or responsibility" }],
        };
      }),
    });
    setEditingTarget(`bullet-${newBulletId}`);
  };

  const handleDeleteBullet = (expId: string, bulletId: string) => {
    if (!onUpdateResume) return;
    onUpdateResume({
      ...resume,
      experience: resume.experience.map((exp) => {
        if (exp.id !== expId) return exp;
        return {
          ...exp,
          bullets: exp.bullets.filter((b) => b.id !== bulletId),
        };
      }),
    });
  };

  const handleUpdateSkill = (index: number, newSkill: string) => {
    if (!onUpdateResume) return;
    const trimmed = newSkill.trim();
    if (!trimmed) {
      handleRemoveSkill(index);
      return;
    }
    const updated = [...(resume.skills || [])];
    updated[index] = trimmed;
    onUpdateResume({
      ...resume,
      skills: updated,
    });
  };

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || !onUpdateResume) return;
    if (!resume.skills.includes(trimmed)) {
      onUpdateResume({
        ...resume,
        skills: [...(resume.skills || []), trimmed],
      });
    }
    setNewSkillText("");
    setIsAddingSkill(false);
  };

  const handleRemoveSkill = (index: number) => {
    if (!onUpdateResume) return;
    const updated = [...(resume.skills || [])];
    updated.splice(index, 1);
    onUpdateResume({
      ...resume,
      skills: updated,
    });
  };

  const handleUpdateEducationItem = (
    eduId: string,
    updates: Partial<ResumeData["education"][0]>,
  ) => {
    if (!onUpdateResume) return;
    onUpdateResume({
      ...resume,
      education: resume.education.map((edu) => (edu.id === eduId ? { ...edu, ...updates } : edu)),
    });
  };

  const handleUpdateProjectItem = (projId: string, updates: Partial<ResumeData["projects"][0]>) => {
    if (!onUpdateResume) return;
    onUpdateResume({
      ...resume,
      projects: resume.projects.map((proj) =>
        proj.id === projId ? { ...proj, ...updates } : proj,
      ),
    });
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (dragOverSection !== section) {
      setDragOverSection(section);
    }
  };

  const handleDragLeave = (e: React.DragEvent, section: string) => {
    if (dragOverSection === section) {
      setDragOverSection(null);
    }
  };

  const handleDrop = (e: React.DragEvent, section: string, targetId?: string) => {
    e.preventDefault();
    setDragOverSection(null);
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) {
        const suggestion: OptimizationSuggestion = JSON.parse(dataStr);
        onDropSuggestion?.(suggestion, section, targetId);
      }
    } catch (err) {
      console.error("Failed to parse dropped suggestion:", err);
    }
  };

  const hasSummary = Boolean(resume.summary?.trim() || editingTarget === "summary");
  const hasExperience = Boolean(resume.experience?.length > 0);
  const hasInternships = Boolean(resume.internships?.length > 0);
  const hasEducation = Boolean(resume.education?.length > 0);
  const hasSkills = Boolean(resume.skills?.length > 0 || isAddingSkill);
  const hasProjects = Boolean(resume.projects?.length > 0);
  const hasCertifications = Boolean(resume.certifications?.length > 0);
  const hasAchievements = Boolean(resume.achievements?.length > 0);
  const hasLeadership = Boolean(resume.leadership?.length > 0);
  const hasLanguages = Boolean(resume.languages?.length > 0);
  const hasLinks = Boolean(resume.links?.length > 0);
  const hasAdditional = Boolean(resume.additional?.length > 0);

  return (
    <article
      className="mx-auto rounded-xs bg-white text-[#0f172a] document-paper ring-1 ring-black/10 select-text relative transition-all"
      style={{
        width: 794,
        minHeight: 1123,
        padding: "48px 56px",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Header & Contact Information */}
      <header
        id="resume-section-contact"
        data-resume-section="contact"
        onClick={() => onSelectElement?.("contact", "contact")}
        className={`border-b border-slate-200 pb-4 mb-5 transition-colors rounded p-1 -m-1 relative ${
          selectedTargetId === "contact"
            ? "ring-2 ring-primary/60 bg-primary/[0.04]"
            : "hover:bg-slate-50/50"
        }`}
      >
        {/* Full Name */}
        {editingTarget === "contact-fullName" ? (
          <input
            type="text"
            autoFocus
            defaultValue={contact.fullName || ""}
            onBlur={(e) => {
              handleUpdateContact("fullName", e.target.value);
              setEditingTarget(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleUpdateContact("fullName", e.currentTarget.value);
                setEditingTarget(null);
              }
              if (e.key === "Escape") setEditingTarget(null);
            }}
            className="w-full text-[26px] font-bold tracking-tight text-slate-900 border border-primary/50 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
          />
        ) : (
          <h1
            onClick={(e) => {
              e.stopPropagation();
              setEditingTarget("contact-fullName");
            }}
            className="group text-[26px] font-bold tracking-tight text-slate-900 cursor-pointer hover:bg-slate-100/60 rounded px-1 -mx-1 inline-flex items-center gap-1.5"
            title="Click to edit name"
          >
            <span>{contact.fullName || "Your Name"}</span>
            <Pencil className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h1>
        )}

        {/* Headline / Target Role */}
        <div className="mt-0.5">
          {editingTarget === "contact-headline" ? (
            <input
              type="text"
              autoFocus
              defaultValue={contact.headline || ""}
              placeholder="e.g. Senior Full Stack Engineer"
              onBlur={(e) => {
                handleUpdateContact("headline", e.target.value);
                setEditingTarget(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUpdateContact("headline", e.currentTarget.value);
                  setEditingTarget(null);
                }
                if (e.key === "Escape") setEditingTarget(null);
              }}
              className="w-full text-[13px] font-medium text-slate-700 border border-primary/50 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
            />
          ) : (
            <p
              onClick={(e) => {
                e.stopPropagation();
                setEditingTarget("contact-headline");
              }}
              className="group text-[13px] font-medium text-slate-600 cursor-pointer hover:bg-slate-100/60 rounded px-1 -mx-1 inline-flex items-center gap-1.5"
              title="Click to edit headline"
            >
              <span>{contact.headline || "Click to add professional headline"}</span>
              <Pencil className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          )}
        </div>

        {/* Contact Links & Info Row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-slate-600">
          {/* Email */}
          {editingTarget === "contact-email" ? (
            <input
              type="email"
              autoFocus
              defaultValue={contact.email || ""}
              placeholder="email@example.com"
              onBlur={(e) => {
                handleUpdateContact("email", e.target.value);
                setEditingTarget(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUpdateContact("email", e.currentTarget.value);
                  setEditingTarget(null);
                }
                if (e.key === "Escape") setEditingTarget(null);
              }}
              className="text-[11.5px] border border-primary/50 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/40 bg-white"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setEditingTarget("contact-email");
              }}
              className="cursor-pointer hover:underline hover:text-slate-900"
              title="Click to edit email"
            >
              {contact.email || "add email"}
            </span>
          )}

          <span className="text-slate-300">·</span>

          {/* Phone */}
          {editingTarget === "contact-phone" ? (
            <input
              type="text"
              autoFocus
              defaultValue={contact.phone || ""}
              placeholder="+1 555-0100"
              onBlur={(e) => {
                handleUpdateContact("phone", e.target.value);
                setEditingTarget(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUpdateContact("phone", e.currentTarget.value);
                  setEditingTarget(null);
                }
                if (e.key === "Escape") setEditingTarget(null);
              }}
              className="text-[11.5px] border border-primary/50 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/40 bg-white"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setEditingTarget("contact-phone");
              }}
              className="cursor-pointer hover:underline hover:text-slate-900"
              title="Click to edit phone"
            >
              {contact.phone || "add phone"}
            </span>
          )}

          <span className="text-slate-300">·</span>

          {/* Location */}
          {editingTarget === "contact-location" ? (
            <input
              type="text"
              autoFocus
              defaultValue={contact.location || ""}
              placeholder="City, State"
              onBlur={(e) => {
                handleUpdateContact("location", e.target.value);
                setEditingTarget(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUpdateContact("location", e.currentTarget.value);
                  setEditingTarget(null);
                }
                if (e.key === "Escape") setEditingTarget(null);
              }}
              className="text-[11.5px] border border-primary/50 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/40 bg-white"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setEditingTarget("contact-location");
              }}
              className="cursor-pointer hover:underline hover:text-slate-900"
              title="Click to edit location"
            >
              {contact.location || "add location"}
            </span>
          )}

          {contact.website && (
            <>
              <span className="text-slate-300">·</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTarget("contact-website");
                }}
                className="text-blue-700 cursor-pointer hover:underline"
              >
                {contact.website}
              </span>
            </>
          )}

          {contact.linkedin && (
            <>
              <span className="text-slate-300">·</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTarget("contact-linkedin");
                }}
                className="text-blue-700 cursor-pointer hover:underline"
              >
                {contact.linkedin}
              </span>
            </>
          )}

          {contact.github && (
            <>
              <span className="text-slate-300">·</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTarget("contact-github");
                }}
                className="text-blue-700 cursor-pointer hover:underline"
              >
                {contact.github}
              </span>
            </>
          )}
        </div>
      </header>

      <div className="space-y-5">
        {/* Professional Summary Section (with In-Place Editing & Drag-and-Drop) */}
        <section
          id="resume-section-summary"
          data-resume-section="summary"
          onDragOver={(e) => handleDragOver(e, "summary")}
          onDragLeave={(e) => handleDragLeave(e, "summary")}
          onDrop={(e) => handleDrop(e, "summary")}
          onClick={() => onSelectElement?.("summary", "summary")}
          className={`transition-all rounded p-2 -m-2 relative ${
            dragOverSection === "summary"
              ? "ring-2 ring-emerald-500 bg-emerald-500/10 border-2 border-dashed border-emerald-500/60"
              : selectedTargetId === "summary"
                ? "ring-2 ring-primary/60 bg-primary/[0.04]"
                : "hover:bg-slate-50/50"
          }`}
        >
          <SectionTitle>Professional Summary</SectionTitle>

          {dragOverSection === "summary" && (
            <div className="mb-2 py-1.5 text-center text-xs font-semibold text-emerald-700 bg-emerald-500/15 rounded border border-emerald-500/30 animate-pulse">
              📥 Drop summary suggestion here to replace
            </div>
          )}

          {editingTarget === "summary" ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                defaultValue={resume.summary || ""}
                rows={4}
                onBlur={(e) => {
                  handleUpdateSummary(e.target.value);
                  setEditingTarget(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingTarget(null);
                }}
                className="w-full text-[12px] leading-relaxed text-slate-800 border border-primary/60 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                placeholder="Write your professional summary..."
              />
              <div className="flex justify-end gap-1.5 text-[11px] text-muted-foreground">
                <span>Click outside to save · Esc to cancel</span>
              </div>
            </div>
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setEditingTarget("summary");
              }}
              className="group cursor-pointer rounded p-1 -m-1 hover:bg-slate-100/70 transition-colors"
              title="Click to edit summary directly"
            >
              <p className="text-[12px] leading-relaxed text-slate-700 whitespace-pre-line">
                {resume.summary || (
                  <span className="text-slate-400 italic">
                    Click here to write your professional summary or drag a summary suggestion...
                  </span>
                )}
              </p>
            </div>
          )}
        </section>

        {/* Experience Section (with In-Place Editing & Drag-and-Drop) */}
        {hasExperience && (
          <section
            id="resume-section-experience"
            data-resume-section="experience"
            onDragOver={(e) => handleDragOver(e, "experience")}
            onDragLeave={(e) => handleDragLeave(e, "experience")}
            onDrop={(e) => handleDrop(e, "experience")}
            className={`transition-all rounded p-2 -m-2 ${
              dragOverSection === "experience"
                ? "ring-2 ring-primary bg-primary/[0.05] border-2 border-dashed border-primary/50"
                : ""
            }`}
          >
            <SectionTitle>Professional Experience</SectionTitle>

            {dragOverSection === "experience" && (
              <div className="mb-2 py-1.5 text-center text-xs font-semibold text-primary bg-primary/10 rounded border border-primary/30 animate-pulse">
                📥 Drop bullet suggestion here to add or replace
              </div>
            )}

            <div className="space-y-4">
              {resume.experience.map((e) => (
                <div
                  key={e.id}
                  id={`resume-item-${e.id}`}
                  data-resume-item-id={e.id}
                  onDragOver={(evt) => {
                    evt.stopPropagation();
                    handleDragOver(evt, `experience-${e.id}`);
                  }}
                  onDragLeave={(evt) => {
                    evt.stopPropagation();
                    handleDragLeave(evt, `experience-${e.id}`);
                  }}
                  onDrop={(evt) => {
                    evt.stopPropagation();
                    handleDrop(evt, "experience", e.id);
                  }}
                  className={`space-y-1.5 rounded p-1.5 -m-1.5 transition-colors ${
                    dragOverSection === `experience-${e.id}`
                      ? "ring-2 ring-primary bg-primary/[0.06] border border-dashed border-primary"
                      : selectedTargetId === e.id
                        ? "ring-2 ring-primary/60 bg-primary/[0.04]"
                        : "hover:bg-slate-50/40"
                  }`}
                >
                  {/* Role Header */}
                  <div
                    className="flex items-baseline justify-between gap-4 cursor-pointer rounded px-1"
                    onClick={() => onSelectElement?.(e.id, "experience")}
                  >
                    <div className="flex items-baseline flex-wrap gap-x-1.5">
                      {/* Role Title */}
                      {editingTarget === `exp-role-${e.id}` ? (
                        <input
                          type="text"
                          autoFocus
                          defaultValue={e.role}
                          onBlur={(evt) => {
                            handleUpdateExperienceItem(e.id, { role: evt.target.value });
                            setEditingTarget(null);
                          }}
                          onKeyDown={(evt) => {
                            if (evt.key === "Enter") {
                              handleUpdateExperienceItem(e.id, { role: evt.currentTarget.value });
                              setEditingTarget(null);
                            }
                            if (evt.key === "Escape") setEditingTarget(null);
                          }}
                          className="text-[12.5px] font-bold text-slate-900 border border-primary/50 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/40 bg-white"
                        />
                      ) : (
                        <span
                          onClick={(evt) => {
                            evt.stopPropagation();
                            setEditingTarget(`exp-role-${e.id}`);
                          }}
                          className="text-[12.5px] font-bold text-slate-900 cursor-pointer hover:underline"
                          title="Click to edit role title"
                        >
                          {e.role || "Job Title"}
                        </span>
                      )}

                      {/* Company Name */}
                      <span className="text-[12px] font-semibold text-slate-700"> — </span>
                      {editingTarget === `exp-company-${e.id}` ? (
                        <input
                          type="text"
                          autoFocus
                          defaultValue={e.company}
                          onBlur={(evt) => {
                            handleUpdateExperienceItem(e.id, { company: evt.target.value });
                            setEditingTarget(null);
                          }}
                          onKeyDown={(evt) => {
                            if (evt.key === "Enter") {
                              handleUpdateExperienceItem(e.id, {
                                company: evt.currentTarget.value,
                              });
                              setEditingTarget(null);
                            }
                            if (evt.key === "Escape") setEditingTarget(null);
                          }}
                          className="text-[12px] font-semibold text-slate-700 border border-primary/50 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/40 bg-white"
                        />
                      ) : (
                        <span
                          onClick={(evt) => {
                            evt.stopPropagation();
                            setEditingTarget(`exp-company-${e.id}`);
                          }}
                          className="text-[12px] font-semibold text-slate-700 cursor-pointer hover:underline"
                          title="Click to edit company"
                        >
                          {e.company || "Company"}
                        </span>
                      )}

                      {/* Location */}
                      {e.location && (
                        <span className="text-[11px] text-slate-500"> · {e.location}</span>
                      )}
                    </div>

                    {/* Dates */}
                    {(e.start || e.end) && (
                      <div className="shrink-0 font-mono text-[10.5px] text-slate-500">
                        {e.start} {e.start && e.end ? "—" : ""} {e.end}
                      </div>
                    )}
                  </div>

                  {/* Experience Bullets with In-Place Editing */}
                  <ul className="mt-1 space-y-1.5 pl-4 list-disc marker:text-slate-400">
                    {e.bullets &&
                      e.bullets.map((b) => (
                        <li
                          key={b.id}
                          id={`resume-bullet-${b.id}`}
                          data-resume-bullet-id={b.id}
                          className={`text-[11.5px] leading-relaxed text-slate-700 pl-0.5 rounded transition-colors group relative ${
                            selectedTargetId === b.id
                              ? "ring-2 ring-primary/70 bg-primary/[0.08] font-medium text-slate-900 px-1 -mx-1"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          {editingTarget === `bullet-${b.id}` ? (
                            <div className="py-0.5">
                              <textarea
                                autoFocus
                                defaultValue={b.text}
                                rows={2}
                                onBlur={(evt) => {
                                  handleUpdateBullet(e.id, b.id, evt.target.value);
                                  setEditingTarget(null);
                                }}
                                onKeyDown={(evt) => {
                                  if (evt.key === "Enter" && !evt.shiftKey) {
                                    evt.preventDefault();
                                    handleUpdateBullet(e.id, b.id, evt.currentTarget.value);
                                    setEditingTarget(null);
                                  }
                                  if (evt.key === "Escape") setEditingTarget(null);
                                }}
                                className="w-full text-[11.5px] leading-relaxed text-slate-800 border border-primary/60 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40 bg-white"
                              />
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <span
                                onClick={(evt) => {
                                  evt.stopPropagation();
                                  onSelectElement?.(b.id, "experience");
                                  setEditingTarget(`bullet-${b.id}`);
                                }}
                                className="cursor-pointer hover:text-slate-900 flex-1"
                                title="Click to edit bullet directly"
                              >
                                {b.text}
                              </span>
                              <button
                                type="button"
                                onClick={(evt) => {
                                  evt.stopPropagation();
                                  handleDeleteBullet(e.id, b.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-destructive transition-opacity shrink-0"
                                title="Delete bullet"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                  </ul>

                  {/* Add bullet trigger */}
                  <div className="pl-4 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleAddBullet(e.id)}
                      className="text-[11px] font-medium text-primary/80 hover:text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add bullet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills Section (with In-Place Editing, Chip Removal & Drag-and-Drop) */}
        {hasSkills && (
          <section
            id="resume-section-skills"
            data-resume-section="skills"
            onDragOver={(e) => handleDragOver(e, "skills")}
            onDragLeave={(e) => handleDragLeave(e, "skills")}
            onDrop={(e) => handleDrop(e, "skills")}
            onClick={() => onSelectElement?.("skills", "skills")}
            className={`transition-all rounded p-2 -m-2 ${
              dragOverSection === "skills"
                ? "ring-2 ring-emerald-500 bg-emerald-500/10 border-2 border-dashed border-emerald-500/60"
                : selectedTargetId === "skills"
                  ? "ring-2 ring-primary/60 bg-primary/[0.04]"
                  : "hover:bg-slate-50/50"
            }`}
          >
            <SectionTitle>Skills & Technical Competencies</SectionTitle>

            {dragOverSection === "skills" && (
              <div className="mb-2 py-1.5 text-center text-xs font-semibold text-emerald-700 bg-emerald-500/15 rounded border border-emerald-500/30 animate-pulse">
                📥 Drop skill suggestion here to add to resume
              </div>
            )}

            {resume.skillCategories && Object.keys(resume.skillCategories).length > 0 ? (
              <div className="space-y-1.5 text-[11.5px] leading-relaxed text-slate-700">
                {Object.entries(resume.skillCategories).map(([category, skills]) => (
                  <div key={category} className="flex flex-wrap items-baseline gap-1.5">
                    <span className="font-semibold text-slate-900">{category}:</span>
                    <span>{skills.join(", ")}</span>
                  </div>
                ))}
              </div>
            ) : (
            <div className="flex flex-wrap gap-1.5 text-[11.5px] leading-relaxed text-slate-700 items-center">
              {resume.skills.map((skill, idx) => {
                const normId = skill.toLowerCase().replace(/[^a-z0-9]/g, "-");
                const isSelected =
                  selectedTargetId === skill ||
                  selectedTargetId === normId ||
                  selectedTargetId === `skill-${idx}`;

                return (
                  <span
                    key={idx}
                    id={`resume-skill-${normId}`}
                    data-resume-skill={skill}
                    className={`group rounded px-2 py-0.5 transition-all inline-flex items-center gap-1 ${
                      isSelected
                        ? "ring-2 ring-primary bg-primary/15 text-slate-900 font-semibold shadow-xs"
                        : "bg-slate-100/90 hover:bg-slate-200/80 text-slate-800"
                    }`}
                  >
                    {editingTarget === `skill-${idx}` ? (
                      <input
                        type="text"
                        autoFocus
                        defaultValue={skill}
                        onBlur={(evt) => {
                          handleUpdateSkill(idx, evt.target.value);
                          setEditingTarget(null);
                        }}
                        onKeyDown={(evt) => {
                          if (evt.key === "Enter") {
                            handleUpdateSkill(idx, evt.currentTarget.value);
                            setEditingTarget(null);
                          }
                          if (evt.key === "Escape") setEditingTarget(null);
                        }}
                        className="text-[11.5px] border border-primary/50 rounded px-1 py-0 bg-white focus:outline-none"
                      />
                    ) : (
                      <>
                        <span
                          onClick={(evt) => {
                            evt.stopPropagation();
                            onSelectElement?.(skill, "skills");
                            setEditingTarget(`skill-${idx}`);
                          }}
                          className="cursor-pointer hover:underline"
                          title="Click to edit skill"
                        >
                          {skill}
                        </span>
                        <button
                          type="button"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            handleRemoveSkill(idx);
                          }}
                          className="opacity-40 group-hover:opacity-100 hover:text-destructive transition-opacity"
                          title="Remove skill"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </span>
                );
              })}

              {/* Add Skill Button / Input */}
              {isAddingSkill ? (
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Type skill..."
                    value={newSkillText}
                    onChange={(e) => setNewSkillText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSkill(newSkillText);
                      if (e.key === "Escape") setIsAddingSkill(false);
                    }}
                    onBlur={() => {
                      if (newSkillText.trim()) handleAddSkill(newSkillText);
                      else setIsAddingSkill(false);
                    }}
                    className="text-[11.5px] border border-primary/50 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingSkill(true);
                  }}
                  className="rounded border border-dashed border-slate-300 hover:border-primary hover:text-primary px-2 py-0.5 text-[11px] font-medium text-slate-500 transition-colors inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add skill
                </button>
              )}
            </div>
            )}
          </section>
        )}

        {/* Education Section */}
        {hasEducation && (
          <section id="resume-section-education" data-resume-section="education">
            <SectionTitle>Education</SectionTitle>
            <div className="space-y-2">
              {resume.education.map((ed) => (
                <div
                  key={ed.id}
                  id={`resume-item-${ed.id}`}
                  data-resume-item-id={ed.id}
                  onClick={() => onSelectElement?.(ed.id, "education")}
                  className={`flex items-baseline justify-between gap-4 rounded p-1 -m-1 transition-colors cursor-pointer ${
                    selectedTargetId === ed.id
                      ? "ring-2 ring-primary/60 bg-primary/[0.04]"
                      : "hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-baseline flex-wrap gap-x-1.5">
                    {/* School Name */}
                    {editingTarget === `edu-school-${ed.id}` ? (
                      <input
                        type="text"
                        autoFocus
                        defaultValue={ed.school}
                        onBlur={(evt) => {
                          handleUpdateEducationItem(ed.id, { school: evt.target.value });
                          setEditingTarget(null);
                        }}
                        onKeyDown={(evt) => {
                          if (evt.key === "Enter") {
                            handleUpdateEducationItem(ed.id, { school: evt.currentTarget.value });
                            setEditingTarget(null);
                          }
                          if (evt.key === "Escape") setEditingTarget(null);
                        }}
                        className="text-[12px] font-bold text-slate-900 border border-primary/50 rounded px-1 py-0.5 bg-white"
                      />
                    ) : (
                      <span
                        onClick={(evt) => {
                          evt.stopPropagation();
                          setEditingTarget(`edu-school-${ed.id}`);
                        }}
                        className="text-[12px] font-bold text-slate-900 hover:underline"
                        title="Click to edit institution"
                      >
                        {ed.school}
                      </span>
                    )}

                    {/* Degree */}
                    {ed.degree && (
                      <span className="text-[11.5px] text-slate-600"> — {ed.degree}</span>
                    )}
                    {ed.field && (
                      <span className="text-[11.5px] text-slate-600"> in {ed.field}</span>
                    )}
                    {ed.location && (
                      <span className="text-[11px] text-slate-500"> · {ed.location}</span>
                    )}
                    {ed.gpa && (
                      <span className="text-[11px] text-slate-500">
                        {" "}
                        · {ed.gpa.startsWith("CGPA") ? ed.gpa : `GPA: ${ed.gpa}`}
                      </span>
                    )}
                  </div>

                  {(ed.start || ed.end) && (
                    <div className="shrink-0 font-mono text-[10.5px] text-slate-500">
                      {ed.start} {ed.start && ed.end ? "—" : ""} {ed.end}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects Section */}
        {hasProjects && (
          <section id="resume-section-projects" data-resume-section="projects">
            <SectionTitle>Projects</SectionTitle>
            <div className="space-y-2.5">
              {resume.projects.map((p) => (
                <div
                  key={p.id}
                  id={`resume-item-${p.id}`}
                  data-resume-item-id={p.id}
                  onClick={() => onSelectElement?.(p.id, "projects")}
                  className={`space-y-0.5 rounded p-1.5 -m-1.5 transition-colors cursor-pointer ${
                    selectedTargetId === p.id
                      ? "ring-2 ring-primary/60 bg-primary/[0.04]"
                      : "hover:bg-slate-50/50"
                  }`}
                >
                  <div className="text-[12px] font-bold text-slate-900">{p.name}</div>
                  {p.description && (
                    <div className="text-[11.5px] leading-relaxed text-slate-700">
                      {p.description}
                    </div>
                  )}
                  {p.responsibilities && p.responsibilities.length > 0 && (
                    <ul className="mt-1 space-y-1 pl-4 list-disc marker:text-slate-400">
                      {p.responsibilities.map((bullet) => (
                        <li key={bullet.id} className="text-[11.5px] leading-relaxed text-slate-700">
                          {bullet.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {hasCertifications && (
          <section id="resume-section-certifications" data-resume-section="certifications">
            <SectionTitle>Certifications</SectionTitle>
            <div className="space-y-1.5">
              {resume.certifications.map((c) => (
                <div
                  key={c.id}
                  id={`resume-item-${c.id}`}
                  data-resume-item-id={c.id}
                  onClick={() => onSelectElement?.(c.id, "certifications")}
                  className={`flex items-baseline justify-between gap-4 text-[11.5px] rounded p-1 -m-1 transition-colors cursor-pointer ${
                    selectedTargetId === c.id
                      ? "ring-2 ring-primary/60 bg-primary/[0.04]"
                      : "hover:bg-slate-50/50"
                  }`}
                >
                  <div>
                    <span className="font-semibold text-slate-900">{c.name}</span>
                    {c.issuer && <span className="text-slate-600"> — {c.issuer}</span>}
                  </div>
                  {c.date && (
                    <span className="shrink-0 font-mono text-[10.5px] text-slate-500">
                      {c.date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Achievements */}
        {hasAchievements && (
          <section id="resume-section-achievements" data-resume-section="achievements">
            <SectionTitle>Key Achievements</SectionTitle>
            <ul className="space-y-1 pl-4 list-disc marker:text-slate-400">
              {resume.achievements.map((item, i) => (
                <li
                  key={i}
                  id={`resume-achievement-${i}`}
                  onClick={() => onSelectElement?.(`achievement-${i}`, "achievements")}
                  className={`text-[11.5px] leading-relaxed text-slate-700 pl-0.5 rounded transition-colors cursor-pointer ${
                    selectedTargetId === `achievement-${i}`
                      ? "ring-2 ring-primary/70 bg-primary/[0.08] font-medium text-slate-900"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Leadership & Activities */}
        {hasLeadership && (
          <section id="resume-section-leadership" data-resume-section="leadership">
            <SectionTitle>Leadership & Activities</SectionTitle>
            <div className="space-y-2">
              {resume.leadership.map((l) => (
                <div
                  key={l.id}
                  id={`resume-item-${l.id}`}
                  data-resume-item-id={l.id}
                  onClick={() => onSelectElement?.(l.id, "leadership")}
                  className={`space-y-0.5 rounded p-1 -m-1 transition-colors cursor-pointer ${
                    selectedTargetId === l.id
                      ? "ring-2 ring-primary/60 bg-primary/[0.04]"
                      : "hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4 text-[12px]">
                    <div>
                      <span className="font-bold text-slate-900">{l.role}</span>
                      {l.organization && (
                        <span className="text-slate-600"> — {l.organization}</span>
                      )}
                    </div>
                    {(l.startDate || l.endDate) && (
                      <span className="shrink-0 font-mono text-[10.5px] text-slate-500">
                        {l.startDate} {l.startDate && l.endDate ? "—" : ""} {l.endDate}
                      </span>
                    )}
                  </div>
                  {l.description && (
                    <p className="text-[11.5px] text-slate-700 leading-relaxed">{l.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Languages */}
        {hasLanguages && (
          <section
            id="resume-section-languages"
            data-resume-section="languages"
            onClick={() => onSelectElement?.("languages", "languages")}
            className={`transition-colors rounded p-1 -m-1 cursor-pointer ${
              selectedTargetId === "languages"
                ? "ring-2 ring-primary/60 bg-primary/[0.04]"
                : "hover:bg-slate-50/50"
            }`}
          >
            <SectionTitle>Languages</SectionTitle>
            <div className="text-[11.5px] text-slate-700">
              {resume.languages.map((l) => `${l.language} (${l.proficiency})`).join(" · ")}
            </div>
          </section>
        )}

        {/* Links */}
        {hasLinks && (
          <section id="resume-section-links" data-resume-section="links">
            <SectionTitle>Links & Portfolios</SectionTitle>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px]">
              {resume.links.map((link) => (
                <span
                  key={link.id}
                  id={`resume-link-${link.id}`}
                  onClick={() => onSelectElement?.(link.id, "links")}
                  className={`text-blue-700 rounded px-1 transition-colors cursor-pointer ${
                    selectedTargetId === link.id
                      ? "ring-2 ring-primary/60 bg-primary/[0.04]"
                      : "hover:underline"
                  }`}
                >
                  {link.label}: {link.url}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Additional Information */}
        {hasAdditional && (
          <section id="resume-section-additional" data-resume-section="additional">
            <SectionTitle>Additional Information</SectionTitle>
            <div className="space-y-1.5">
              {resume.additional.map((item) => (
                <div
                  key={item.id}
                  id={`resume-item-${item.id}`}
                  data-resume-item-id={item.id}
                  onClick={() => onSelectElement?.(item.id, "additional")}
                  className={`text-[11.5px] text-slate-700 rounded p-1 -m-1 transition-colors cursor-pointer ${
                    selectedTargetId === item.id
                      ? "ring-2 ring-primary/60 bg-primary/[0.04]"
                      : "hover:bg-slate-50/50"
                  }`}
                >
                  {item.title && (
                    <span className="font-semibold text-slate-900">{item.title}: </span>
                  )}
                  <span>{item.description}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-800">
      {children}
    </h2>
  );
}

function TemplatePreviewWrapper({
  resume,
  templateSlug,
}: {
  resume: ResumeData;
  templateSlug: string;
}) {
  const profile: ResumeProfile = {
    personal: {
      fullName: resume.contact.fullName,
      email: resume.contact.email,
      phone: resume.contact.phone,
      location: resume.contact.location,
      headline: resume.contact.headline,
      website: resume.contact.website,
      linkedin: resume.contact.linkedin ?? "",
      github: resume.contact.github ?? "",
    },
    targetRole: resume.targetRole,
    summary: resume.summary,
    experience: resume.experience.map((e) => ({
      id: e.id,
      company: e.company,
      role: e.role,
      location: e.location,
      startDate: e.start,
      endDate: e.end,
      current: e.end === "" || e.end === "Present",
      employmentType: "",
      responsibilities: e.bullets.map((b) => ({ id: b.id, text: b.text })),
      sub_engagements: e.sub_engagements || [],
      achievements: [],
      tools: [],
      metrics: "",
    })),
    internships:
      resume.internships?.map((e) => ({
        id: e.id,
        company: e.company,
        role: e.role,
        location: e.location,
        startDate: e.start,
        endDate: e.end,
        current: e.end === "" || e.end === "Present",
        employmentType: "",
        responsibilities: e.bullets.map((b) => ({ id: b.id, text: b.text })),
        achievements: [],
        tools: [],
        metrics: "",
      })) ?? [],
    education: resume.education.map((ed) => ({
      id: ed.id,
      institution: ed.school,
      degree: ed.degree,
      field: ed.field || "",
      location: ed.location || "",
      startDate: ed.start,
      endDate: ed.end,
      gpa: ed.gpa || "",
      coursework: ed.coursework || [],
      achievements: ed.achievements || [],
    })),
    skills: {
      technical: resume.skills ?? [],
      tools: [],
      languages: [],
      databases: [],
      analytics: [],
      softSkills: [],
      custom: resume.skillCategories || {},
    },
    projects: resume.projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      problem: p.problem || "",
      contribution: p.contribution || "",
      technologies: p.technologies || [],
      methodology: p.methodology || "",
      results: p.results || "",
      metrics: p.metrics || "",
      url: p.url || "",
      responsibilities: p.responsibilities || [],
    })),
    certifications: resume.certifications ?? [],
    achievements: resume.achievements ?? [],
    leadership: resume.leadership ?? [],
    languages: resume.languages ?? [],
    links: resume.links ?? [],
    additional: resume.additional ?? [],
  };

  return (
    <div className="w-full">
      <TemplatePreview templateSlug={templateSlug} profile={profile} />
    </div>
  );
}

export function A4DocumentSkeleton() {
  return (
    <div
      className="mx-auto rounded-sm bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.65),0_2px_8px_rgba(0,0,0,0.2)] ring-1 ring-black/10 select-none animate-pulse"
      style={{
        width: 794,
        minHeight: 1123,
        padding: "48px 56px",
      }}
    >
      {/* Header Skeleton */}
      <div className="border-b border-slate-200 pb-4 mb-6 space-y-2.5">
        <div className="h-7 w-56 rounded bg-slate-200" />
        <div className="h-4 w-72 rounded bg-slate-150 bg-slate-200/70" />
        <div className="flex gap-4 pt-1">
          <div className="h-3 w-28 rounded bg-slate-200/60" />
          <div className="h-3 w-24 rounded bg-slate-200/60" />
          <div className="h-3 w-32 rounded bg-slate-200/60" />
        </div>
      </div>

      {/* Summary Section */}
      <div className="space-y-2 mb-6">
        <div className="h-3.5 w-36 rounded bg-slate-200" />
        <div className="h-2.5 w-full rounded bg-slate-100" />
        <div className="h-2.5 w-11/12 rounded bg-slate-100" />
        <div className="h-2.5 w-4/5 rounded bg-slate-100" />
      </div>

      {/* Experience Section */}
      <div className="space-y-4 mb-6">
        <div className="h-3.5 w-44 rounded bg-slate-200" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-48 rounded bg-slate-200/80" />
            <div className="h-3 w-24 rounded bg-slate-200/50" />
          </div>
          <div className="h-2.5 w-full rounded bg-slate-100 pl-4" />
          <div className="h-2.5 w-11/12 rounded bg-slate-100 pl-4" />
          <div className="h-2.5 w-3/4 rounded bg-slate-100 pl-4" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex justify-between">
            <div className="h-3 w-40 rounded bg-slate-200/80" />
            <div className="h-3 w-24 rounded bg-slate-200/50" />
          </div>
          <div className="h-2.5 w-full rounded bg-slate-100 pl-4" />
          <div className="h-2.5 w-4/5 rounded bg-slate-100 pl-4" />
        </div>
      </div>

      {/* Skills Section */}
      <div className="space-y-2 mb-6">
        <div className="h-3.5 w-32 rounded bg-slate-200" />
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="h-5 w-20 rounded bg-slate-150 bg-slate-200/60" />
          <div className="h-5 w-24 rounded bg-slate-150 bg-slate-200/60" />
          <div className="h-5 w-16 rounded bg-slate-150 bg-slate-200/60" />
          <div className="h-5 w-28 rounded bg-slate-150 bg-slate-200/60" />
          <div className="h-5 w-20 rounded bg-slate-150 bg-slate-200/60" />
        </div>
      </div>

      {/* Education Section */}
      <div className="space-y-2">
        <div className="h-3.5 w-28 rounded bg-slate-200" />
        <div className="flex justify-between">
          <div className="h-3 w-52 rounded bg-slate-200/80" />
          <div className="h-3 w-20 rounded bg-slate-200/50" />
        </div>
        <div className="h-2.5 w-36 rounded bg-slate-100" />
      </div>
    </div>
  );
}
