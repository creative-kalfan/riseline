import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { ArrowLeft, Save, Sparkles, Layers, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-tooltip";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { LeftPane } from "@/components/resume/left-pane";
import { PreviewPane, A4DocumentSkeleton } from "@/components/resume/preview-pane";
import { useResumeDetail, resumeQueryKeys } from "@/hooks/api/useResumes";
import { useAnalyzeResume } from "@/hooks/api/useATS";
import { getErrorMessage } from "@/utils/api-error";
import { ATSAnalysisDialog } from "@/components/resume/ats-analysis-dialog";
// OptimizationWorkspace removed — generation now happens inline in LeftPane
import { VersionManager } from "@/components/resume/version-manager";
import { FinalReview } from "@/components/resume/final-review";
import {
  useVersions,
  useCreateVersion,
  useApplyVersionOperation,
  useVersion,
  versionQueryKeys,
} from "@/hooks/api/useVersions";
import {
  useGenerateExperienceBulletOptimization,
  useGenerateOptimization,
} from "@/hooks/api/useOptimization";
import { request, requestBlob } from "@/utils/request";
import { LONG_REQUEST_TIMEOUT_MS } from "@/api/config";
import { useOriginalResumeFile } from "@/hooks/useOriginalResumeFile";
import type { DocumentGeometryMap, GeometryBlock } from "@/types/geometry";
import {
  profileToResumeData,
  applyResumeDataToProfile,
  formatResumeDisplayName,
} from "@/lib/resume";
import type { ResumeVersion } from "@/types/version";
import type { AtsAnalysisResult } from "@/api/ats";
import type { EvidenceLocationMap } from "@/lib/evidence-location";
import type { ResumeProfile, ResumeData } from "@/types/resume";
import type { OptimizationSuggestion } from "@/types/optimization";
import { optimizationApi } from "@/api/optimization";
import { versionsApi } from "@/api/versions";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";

import { useQueryClient } from "@tanstack/react-query";

type ResumeStudioSearchParams = {
  template?: string;
  versionId?: string;
  jobTitle?: string;
  company?: string;
  jobDescription?: string;
};

export const Route = createFileRoute("/_app/resumes/$id")({
  validateSearch: (search: Record<string, unknown>): ResumeStudioSearchParams => {
    return {
      template: search.template ? String(search.template) : undefined,
      versionId: search.versionId ? String(search.versionId) : undefined,
      jobTitle: search.jobTitle ? String(search.jobTitle) : undefined,
      company: search.company ? String(search.company) : undefined,
      jobDescription: search.jobDescription ? String(search.jobDescription) : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Resume Studio · CareerOS" },
      {
        name: "description",
        content: "AI-powered resume optimization with targeted suggestions and ATS analysis.",
      },
    ],
  }),
  component: ResumeWorkspace,
});

function ResumeWorkspace() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const search = Route.useSearch() as ResumeStudioSearchParams;
  const templateSlug = search?.template;
  const versionIdFromSearch = search?.versionId;
  const searchJobTitle = search?.jobTitle;
  const searchCompany = search?.company;
  const searchJobDescription = search?.jobDescription;

  const { data: record, isLoading, isError, error } = useResumeDetail(id);
  const { data: versionsData } = useVersions(id);
  const queryClient = useQueryClient();
  const analyzeResume = useAnalyzeResume();

  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<OptimizationSuggestion[] | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [lastAppliedSuggestionId, setLastAppliedSuggestionId] = useState<string | null>(null);

  const [showATSDialog, setShowATSDialog] = useState(false);
  const [atsScore, setATSScore] = useState<number | null>(null);
  const [atsAnalysis, setATSAnalysis] = useState<AtsAnalysisResult | null>(null);
  const [atsReportId, setAtsReportId] = useState<string | null>(null);
  // Optimization generation is now handled inline in LeftPane
  const [jobTitle, setJobTitle] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAtsIssue, setSelectedAtsIssue] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ResumeVersion | null>(null);
  const [showVersionManager, setShowVersionManager] = useState(false);
  const [showFinalReview, setShowFinalReview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const versions = useMemo(() => versionsData?.versions ?? [], [versionsData]);
  const masterVersion = versions.find((v) => v.is_master);
  const activeVersionId =
    selectedVersionId || versionIdFromSearch || masterVersion?.id || versions[0]?.id || null;

  // Auto-resolve active working version from versions list
  useEffect(() => {
    if (!selectedVersionId && versions.length > 0) {
      const target =
        (versionIdFromSearch && versions.find((v) => v.id === versionIdFromSearch)) ||
        masterVersion ||
        versions[0];
      if (target) {
        setSelectedVersionId(target.id);
      }
    }
  }, [selectedVersionId, versions, versionIdFromSearch, masterVersion]);

  // Target 4.4 — shared evidence→PDF location map (Target 4.2). Computed once
  // inside PdfCanvasPreview against the PDF text layer, lifted here so the ATS
  // intelligence panel can show location confidence without recomputing.
  // Stays `undefined` until PdfCanvasPreview reports its computation — an
  // explicit `null`/defined value is treated by PdfCanvasPreview as
  // "externally provided" and would skip the internal mapping pass.
  const [evidenceLocations, setEvidenceLocations] = useState<
    EvidenceLocationMap | null | undefined
  >(undefined);
  const handleEvidenceLocationsChange = useCallback((locations: EvidenceLocationMap | null) => {
    setEvidenceLocations(locations);
  }, []);

  const lastAutoAnalyzedRef = useRef<string | null>(null);

  const { data: selectedVersionData } = useVersion(activeVersionId ?? "");
  const createVersionMutation = useCreateVersion(id);
  const applyOperationMutation = useApplyVersionOperation(id);
  const generateBulletMutation = useGenerateExperienceBulletOptimization();
  const generateOptimizationMutation = useGenerateOptimization();
  const { toast } = useToast();

  const {
    signedUrl: originalPdfUrl,
    error: originalPdfError,
    generateSignedUrl,
    clearSignedUrl,
  } = useOriginalResumeFile();

  // Reset working state synchronously when navigating between resumes to eliminate any stale data flash
  useEffect(() => {
    setResumeData(null);
    setProfile(null);
    setSelectedVersionId(null);
    setApplyTailoringError(null);
    lastTailorApplyRef.current = null;
    setSelectedVersion(null);
    setEvidenceLocations(undefined);
    setSelectedAtsIssue(null);
    setSelectedTargetId(null);
    setATSScore(null);
    setATSAnalysis(null);
    setAtsReportId(null);
    clearSignedUrl();
    lastAutoAnalyzedRef.current = null;
  }, [id, clearSignedUrl]);

  useEffect(() => {
    if (!versionIdFromSearch) return;
    // A ?versionId= that the versions list doesn't contain (deleted in
    // another tab, RLS-invisible, or mistyped) previously stuck: the Studio
    // kept sending it as parent_version_id and every apply-tailoring failed
    // server-side while the UI showed no error. Fall back to master, fix the
    // URL, and say so instead of failing silently.
    if (versionsData && !versions.some((v) => v.id === versionIdFromSearch)) {
      const fallback = masterVersion?.id ?? versions[0]?.id ?? null;
      setSelectedVersionId(fallback);
      navigate({
        search: (prev: ResumeStudioSearchParams) => ({ ...prev, versionId: fallback ?? undefined }),
        replace: true,
      });
      toast.info("That version is no longer available — showing the latest instead.");
      return;
    }
    if (!selectedVersionId || selectedVersionId !== versionIdFromSearch) {
      setSelectedVersionId(versionIdFromSearch);
    }
  }, [
    versionIdFromSearch,
    selectedVersionId,
    versionsData,
    versions,
    masterVersion,
    navigate,
    toast,
  ]);

  useEffect(() => {
    if (selectedVersionData?.version) {
      setSelectedVersion(selectedVersionData.version);
    }
  }, [selectedVersionData]);

  const activeStoragePath = useMemo(() => {
    return (
      selectedVersion?.meta?.storage_path ||
      record?.meta?.storage_path ||
      record?.storage_path ||
      null
    );
  }, [selectedVersion, record]);

  useEffect(() => {
    if (activeStoragePath) {
      void generateSignedUrl(activeStoragePath);
    }
  }, [activeStoragePath, generateSignedUrl]);

  const geometryMap = useMemo(() => {
    return selectedVersion?.meta?.geometry || record?.meta?.geometry || null;
  }, [selectedVersion, record]);

  const handleMutateBlock = useCallback(
    async (pageIndex: number, block: GeometryBlock, newText: string) => {
      const vid = activeVersionId || record?.id;
      if (!vid) {
        toast.error("No active version found to edit");
        return;
      }

      try {
        const res = await request<{ data: ResumeVersion; success: boolean }>({
          method: "POST",
          path: `/api/resumes/${id}/versions/${vid}/mutate-pdf`,
          body: {
            page_index: pageIndex,
            block_id: block.id,
            bbox: block.bbox,
            replacement_text: newText,
            section: block.section || undefined,
            item_id: block.item_id || undefined,
          },
        });

        if (res?.data) {
          await queryClient.invalidateQueries({ queryKey: versionQueryKeys.list(id) });
          await queryClient.invalidateQueries({ queryKey: versionQueryKeys.get(res.data.id) });
          await queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(id) });
          setSelectedVersionId(res.data.id);
          toast.success("PDF updated successfully");
        }
      } catch (err) {
        console.error("Failed to mutate PDF:", err);
        toast.error(getErrorMessage(err) || "Failed to update PDF");
        throw err;
      }
    },
    [id, activeVersionId, record?.id, queryClient, toast],
  );

  useEffect(() => {
    const versionRow = selectedVersionData?.version;
    const source = versionRow || record;
    if (!source) return;
    const content = source.content as { profile?: ResumeProfile } | null;
    const fullProfile = content?.profile;
    if (fullProfile) {
      setProfile(fullProfile);
      setResumeData({
        ...profileToResumeData(fullProfile),
        id: source.id,
        name: "title" in source ? source.title : source.version_name || "Untitled Resume",
        updatedAt: new Date(source.updated_at).toLocaleString(),
        atsScore: 0,
      });
    } else {
      setProfile({
        personal: {
          fullName: "",
          email: "",
          phone: "",
          location: "",
          headline: "",
          website: "",
          linkedin: "",
          github: "",
        },
        targetRole: "",
        summary: "",
        experience: [],
        internships: [],
        education: [],
        skills: {
          technical: [],
          tools: [],
          languages: [],
          databases: [],
          analytics: [],
          softSkills: [],
          custom: {},
        },
        projects: [],
        certifications: [],
        achievements: [],
        leadership: [],
        languages: [],
        links: [],
        additional: [],
      });
      setResumeData({
        id: source.id,
        name: "title" in source ? source.title : source.version_name || "Untitled Resume",
        targetRole: "",
        updatedAt: new Date(source.updated_at).toLocaleString(),
        atsScore: 0,
        contact: {
          fullName: "",
          headline: "",
          email: "",
          phone: "",
          location: "",
          website: "",
          linkedin: "",
          github: "",
        },
        summary: "",
        experience: [],
        education: [],
        skills: [],
        projects: [],
        sections: [
          { id: "s-summary", type: "summary", title: "Summary" },
          { id: "s-experience", type: "experience", title: "Experience" },
          { id: "s-skills", type: "skills", title: "Skills" },
          { id: "s-projects", type: "projects", title: "Projects" },
          { id: "s-education", type: "education", title: "Education" },
        ],
        internships: [],
        certifications: [],
        achievements: [],
        leadership: [],
        languages: [],
        links: [],
        additional: [],
      });
    }
  }, [record, selectedVersionData]);

  useEffect(() => {
    const versionRow = selectedVersionData?.version;
    if (versionRow?.job_description && !jobDescription)
      setJobDescription(versionRow.job_description);
    if (versionRow?.target_job_title && !jobTitle) setJobTitle(versionRow.target_job_title);
    if (versionRow?.target_company && !company) setCompany(versionRow.target_company);
  }, [selectedVersionData, jobDescription, jobTitle, company]);

  useEffect(() => {
    if (!jobTitle && searchJobTitle && !jobTitle.trim()) setJobTitle(searchJobTitle);
    if (!company && searchCompany && !company.trim()) setCompany(searchCompany);
    if (!jobDescription && searchJobDescription && !jobDescription.trim())
      setJobDescription(searchJobDescription);
  }, [jobTitle, company, jobDescription, searchJobTitle, searchCompany, searchJobDescription]);

  // Poll while parsing is asynchronous so the Studio renders the parsed
  // resume as soon as the background parsing job completes.
  useEffect(() => {
    const status = record?.parse_status;
    if (!status || (status !== "pending" && status !== "processing")) return;
    const timer = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: versionQueryKeys.list(id) });
      if (activeVersionId) {
        queryClient.invalidateQueries({ queryKey: versionQueryKeys.get(activeVersionId) });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [record?.parse_status, queryClient, id, activeVersionId]);

  useEffect(() => {
    if (analyzeResume.isSuccess && analyzeResume.data) {
      const result = analyzeResume.data.result;
      setATSScore(result.overall_score);
      setATSAnalysis(result);
      if (analyzeResume.data.report?.id) {
        setAtsReportId(analyzeResume.data.report.id);
      }
      setIsAnalyzing(false);
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
        setShowATSDialog(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (analyzeResume.isError) {
      setIsAnalyzing(false);
      const msg = getErrorMessage(analyzeResume.error);
      toast.error(msg === "An unexpected error occurred" ? "ATS analysis failed" : msg);
    }
  }, [analyzeResume, analyzeResume.data, toast]);

  const handleSave = useCallback(async () => {
    if (!id || !resumeData) return;
    setIsSaving(true);
    try {
      const profileToSave =
        profile ??
        (() => {
          const raw = (record?.content as { profile?: ResumeProfile } | null)?.profile;
          if (!raw) return null;
          return applyResumeDataToProfile(raw, resumeData);
        })();
      if (!profileToSave) {
        toast.error("No resume content to save");
        return;
      }
      const content = { profile: profileToSave };
      // Version-safe manual save: master is immutable, so derive first
      // (mirrors handleApplySuggestion). The canonical save-content endpoint
      // recompiles PDF/DOCX and only persists when the artifact exists.
      const isEditingMaster =
        !activeVersionId ||
        activeVersionId === masterVersion?.id ||
        Boolean(selectedVersionData?.version?.is_master) ||
        Boolean(versions.find((v) => v.id === activeVersionId)?.is_master);
      let targetVersionId = activeVersionId;
      if (isEditingMaster) {
        const newVersion = await createVersionMutation.mutateAsync({
          version_name: `Manual Edit ${new Date().toLocaleDateString()}`,
          parent_version_id: activeVersionId || undefined,
          source: "manual",
          content,
        });
        targetVersionId = newVersion.version.id;
      }
      if (!targetVersionId) {
        toast.error("No version available for editing");
        return;
      }
      let savedVersionId = targetVersionId;
      try {
        const saved = await versionsApi.saveContent(targetVersionId, content);
        savedVersionId = saved.version.id;
      } catch (err) {
        // TRUTHFUL FAILURE: keep edits in the editor (still dirty) but never
        // claim success when no document artifact was produced.
        toast.error(
          getErrorMessage(err) || "Failed to save resume - the document was not changed.",
        );
        return;
      }
      await queryClient.invalidateQueries({ queryKey: versionQueryKeys.list(id) });
      await queryClient.invalidateQueries({ queryKey: versionQueryKeys.get(savedVersionId) });
      await queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(id) });
      setSelectedVersionId(savedVersionId);
      navigate({
        search: (prev: ResumeStudioSearchParams) => ({ ...prev, versionId: savedVersionId }),
        replace: true,
      });
      setProfile(profileToSave);
      setIsDirty(false);
      toast.success("Resume saved successfully");
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch {
      toast.error("Failed to save resume - the document was not changed.");
    } finally {
      setIsSaving(false);
    }
  }, [
    id,
    resumeData,
    profile,
    record,
    activeVersionId,
    selectedVersionData,
    createVersionMutation,
    queryClient,
    navigate,
    toast,
  ]);

  useKeyboardShortcut(
    { key: "s", meta: true, ignoreInInputs: false },
    useCallback(
      (e) => {
        e.preventDefault();
        handleSave();
      },
      [handleSave],
    ),
  );

  const handleSelectElement = useCallback((elementId: string, _section?: string) => {
    setSelectedTargetId((prev) => (prev === elementId ? null : elementId));
  }, []);

  const handleAnalyze = useCallback(
    (values: { jobTitle?: string; company?: string; jobDescription: string }) => {
      if (!id) return;
      const contextKey = [
        id,
        selectedVersionId || "",
        values.jobTitle || "",
        values.company || "",
        values.jobDescription,
      ].join("|");
      lastAutoAnalyzedRef.current = contextKey;
      // A new analysis invalidates the previous requirement keys and their
      // evidence locations — clear stale selection state (no recalculation).
      setSelectedAtsIssue(null);
      setEvidenceLocations(undefined);
      analyzeResume.mutate({
        resumeId: id,
        versionId: selectedVersionId ?? undefined,
        jobTitle: values.jobTitle || undefined,
        company: values.company || undefined,
        jobDescription: values.jobDescription,
        persist: true,
      });
      setIsAnalyzing(true);
      setJobTitle(values.jobTitle || "");
      setCompany(values.company || "");
      setJobDescription(values.jobDescription);
    },
    [id, selectedVersionId, analyzeResume],
  );

  // Auto-trigger ATS analysis when a valid job context is available and we
  // haven't already analyzed this exact context. The guard key includes resume
  // ID, version, job title, company, and job description so that a genuine
  // context change produces a new analysis, while the same context never
  // triggers twice.
  useEffect(() => {
    if (!id) return;
    if (!jobDescription.trim()) return;
    if (analyzeResume.isPending) return;

    const contextKey = [
      id,
      selectedVersionId || "",
      jobTitle.trim(),
      company.trim(),
      jobDescription.trim(),
    ].join("|");
    if (lastAutoAnalyzedRef.current === contextKey) return;

    lastAutoAnalyzedRef.current = contextKey;
    analyzeResume.mutate({
      resumeId: id,
      versionId: selectedVersionId ?? undefined,
      jobTitle: jobTitle || undefined,
      company: company || undefined,
      jobDescription,
      persist: true,
    });
  }, [id, selectedVersionId, jobTitle, company, jobDescription, analyzeResume]);

  const handleRunOptimization = useCallback(async () => {
    if (!jobDescription.trim()) {
      toast.error("Job description is required for optimization");
      return;
    }
    if (generateOptimizationMutation.isPending) return;
    try {
      const result = await generateOptimizationMutation.mutateAsync({
        resumeId: id,
        versionId: activeVersionId ?? undefined,
        jobDescription,
        jobTitle: jobTitle || undefined,
        company: company || undefined,
        atsReportId: atsReportId || undefined,
      });
      setActiveSuggestions(result.suggestions || []);
      setActiveSessionId(result.sessionId);
      toast.success(result.message || "Suggestions generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate suggestions");
    }
  }, [
    id,
    activeVersionId,
    jobDescription,
    jobTitle,
    company,
    atsReportId,
    generateOptimizationMutation,
    toast,
  ]);

  const handleUpdateResume = useCallback(
    (updated: ResumeData) => {
      setResumeData(updated);
      const rawProfile =
        profile ?? (record?.content as { profile?: ResumeProfile } | null)?.profile ?? null;
      if (rawProfile) {
        const updatedProfile = applyResumeDataToProfile(rawProfile, updated);
        setProfile(updatedProfile);
      }
      setIsDirty(true);
    },
    [profile, record],
  );

  const handleAddSkill = useCallback(
    (skill: string) => {
      if (!skill.trim() || !resumeData) return;
      const trimmed = skill.trim();
      if (resumeData.skills?.includes(trimmed)) {
        toast.info(`"${trimmed}" is already in skills`);
        return;
      }
      const updatedSkills = [...(resumeData.skills || []), trimmed];
      const updatedResumeData: ResumeData = {
        ...resumeData,
        skills: updatedSkills,
      };
      setResumeData(updatedResumeData);
      const rawProfile =
        profile ?? (record?.content as { profile?: ResumeProfile } | null)?.profile ?? null;
      if (rawProfile) {
        const updatedProfile = applyResumeDataToProfile(rawProfile, updatedResumeData);
        setProfile(updatedProfile);
      }
      setIsDirty(true);
      toast.success(`Added "${trimmed}" to skills`);
    },
    [resumeData, profile, record, toast],
  );

  const _verifyTargetExists = (
    resumeData: ResumeData | null,
    suggestion: OptimizationSuggestion,
  ) => {
    if (!resumeData) return false;
    const section = (suggestion.section || suggestion.type || "").toLowerCase();
    if (section.includes("summary") || suggestion.type === "professional_summary") return true;
    if (
      section.includes("skill") ||
      suggestion.type === "skills_alignment" ||
      suggestion.type === "keyword_placement"
    )
      return true;
    if (section.includes("experience") && suggestion.entryId && resumeData.experience) {
      return resumeData.experience.some((e) => e.id === suggestion.entryId);
    }
    if (section.includes("project") && suggestion.entryId && resumeData.projects) {
      return resumeData.projects.some((p) => p.id === suggestion.entryId);
    }
    return true;
  };

  const handleApplySuggestion = useCallback(
    async (suggestion: OptimizationSuggestion, sessionId?: string) => {
      if (!id || !resumeData) return;
      // DOUBLE APPLY PROTECTION: skip if the same suggestion is already being applied
      if (lastAppliedSuggestionId === suggestion.id) {
        toast.info("Suggestion already applied");
        return;
      }
      const prevResumeData = resumeData;
      const prevProfile = profile;
      const prevDirty = isDirty;
      const isEditingMaster =
        !activeVersionId ||
        activeVersionId === masterVersion?.id ||
        Boolean(selectedVersionData?.version?.is_master) ||
        Boolean(versions.find((v) => v.id === activeVersionId)?.is_master);
      let targetVersionId = activeVersionId;

      if (isEditingMaster) {
        const profileToSave =
          profile ??
          (() => {
            const raw = (record?.content as { profile?: ResumeProfile } | null)?.profile;
            if (!raw) return null;
            return applyResumeDataToProfile(raw, resumeData);
          })();
        if (!profileToSave) {
          toast.error("No master resume content found");
          return;
        }
        const newVersion = await createVersionMutation.mutateAsync({
          version_name: `Optimized Version ${new Date().toLocaleDateString()}`,
          parent_version_id: activeVersionId || undefined,
          target_job_title: jobTitle || undefined,
          target_company: company || undefined,
          job_description: jobDescription || undefined,
          source: "suggestion",
          content: { profile: profileToSave },
        });
        targetVersionId = newVersion.version.id;
        setSelectedVersionId(newVersion.version.id);
        navigate({
          search: (prev: ResumeStudioSearchParams) => ({
            ...prev,
            versionId: newVersion.version.id,
          }),
          replace: true,
        });
        toast.success("Created optimized version for editing");
      }

      if (!targetVersionId) {
        toast.error("No version available for editing");
        return;
      }

      // STALE SUGGESTION PROTECTION: verify target still exists in current resume data
      if (!_verifyTargetExists(resumeData, suggestion)) {
        toast.error(
          "Suggestion is stale — the target could not be found. Please re-generate suggestions.",
        );
        return;
      }

      const sec = (suggestion.section || suggestion.type || "").toLowerCase();
      const suggestedText = suggestion.suggestedText || "";
      let updatedData = { ...resumeData };

      if (sec.includes("summary") || suggestion.type === "professional_summary") {
        updatedData = {
          ...updatedData,
          summary: suggestedText,
        };
      } else if (
        sec.includes("experience") ||
        suggestion.type === "experience_bullet" ||
        sec.includes("internship")
      ) {
        const entryId = suggestion.entryId;
        const childId = suggestion.childId;
        const currentText = suggestion.currentText?.trim();

        const updatedExp = updatedData.experience.map((exp) => {
          if (entryId && exp.id !== entryId) return exp;
          let bulletReplaced = false;
          const newBullets = exp.bullets.map((b) => {
            if (childId && b.id === childId) {
              bulletReplaced = true;
              return { ...b, text: suggestedText };
            }
            if (!childId && currentText && b.text.trim() === currentText) {
              bulletReplaced = true;
              return { ...b, text: suggestedText };
            }
            return b;
          });

          if (
            !bulletReplaced &&
            (entryId === exp.id || (!entryId && exp === updatedData.experience[0]))
          ) {
            newBullets.push({
              id: childId || `b-${Date.now()}`,
              text: suggestedText,
            });
          }

          return { ...exp, bullets: newBullets };
        });

        updatedData = {
          ...updatedData,
          experience: updatedExp,
        };
      } else if (
        sec.includes("skill") ||
        suggestion.type === "skills_alignment" ||
        suggestion.type === "keyword_placement"
      ) {
        const skillToAdd = suggestion.skill || suggestedText;
        if (skillToAdd) {
          const skillsToAdd = skillToAdd
            .split(/[,·|]/)
            .map((s) => s.trim())
            .filter(Boolean);
          const currentSkills = new Set(updatedData.skills || []);
          skillsToAdd.forEach((s) => currentSkills.add(s));
          updatedData = {
            ...updatedData,
            skills: Array.from(currentSkills),
          };
        }
      } else if (sec.includes("project") || suggestion.type === "project_bullet") {
        if (suggestion.entryId) {
          updatedData = {
            ...updatedData,
            projects: updatedData.projects.map((p) =>
              p.id === suggestion.entryId
                ? { ...p, description: suggestedText || p.description }
                : p,
            ),
          };
        }
      }

      setResumeData(updatedData);
      const rawProfile =
        profile ?? (record?.content as { profile?: ResumeProfile } | null)?.profile ?? null;
      if (rawProfile) {
        const updatedProfile = applyResumeDataToProfile(rawProfile, updatedData);
        setProfile(updatedProfile);
      }
      setIsDirty(true);
      setLastAppliedSuggestionId(suggestion.id);

      setActiveSuggestions((prev) => (prev ? prev.filter((s) => s.id !== suggestion.id) : null));

      try {
        await applyOperationMutation.mutateAsync({
          versionId: targetVersionId,
          data: {
            operation: "replace",
            section:
              suggestion.section ||
              (sec.includes("summary")
                ? "summary"
                : sec.includes("skill")
                  ? "skills"
                  : "experience"),
            target_id: suggestion.entryId || undefined,
            child_id: suggestion.childId || undefined,
            child_text: suggestion.childId ? suggestedText : undefined,
            replacement: {
              currentText: suggestion.currentText || undefined,
              suggestedText,
            },
            reason: suggestion.explanation,
            source: "optimization",
          },
        });
        const sid = sessionId || activeSessionId;
        if (sid) {
          try {
            await optimizationApi.accept({
              sessionId: sid,
              suggestionId: suggestion.id,
            });
            queryClient.invalidateQueries({ queryKey: ["optimization", "sessions", id] });
          } catch {
            // Non-blocking
          }
        }
        await queryClient.invalidateQueries({ queryKey: versionQueryKeys.list(id) });
        if (targetVersionId) {
          await queryClient.invalidateQueries({ queryKey: versionQueryKeys.get(targetVersionId) });
        }
        await queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(id) });
        toast.success("Suggestion applied to resume");
      } catch (error) {
        // TRUTHFUL FAILURE: never claim a suggestion was applied when the
        // document operation failed. Revert the optimistic local state so the
        // UI cannot show applied content that produced no real document change.
        setResumeData(prevResumeData);
        setProfile(prevProfile);
        setIsDirty(prevDirty);
        setLastAppliedSuggestionId(null);
        setActiveSuggestions((prev) =>
          prev && !prev.some((s) => s.id === suggestion.id) ? [suggestion, ...prev] : prev,
        );
        const applyMsg = error instanceof Error && error.message ? error.message : "";
        toast.error(
          applyMsg && applyMsg !== "An unexpected error occurred"
            ? applyMsg
            : "Failed to apply suggestion - the document was not changed.",
        );
      }
    },
    [
      id,
      isDirty,
      resumeData,
      profile,
      activeVersionId,
      selectedVersionData,
      record,
      createVersionMutation,
      applyOperationMutation,
      lastAppliedSuggestionId,
      activeSessionId,
      jobTitle,
      company,
      jobDescription,
      queryClient,
      navigate,
      toast,
    ],
  );

  const handleDropSuggestion = useCallback(
    (suggestion: OptimizationSuggestion, section: string, targetId?: string) => {
      const targetSuggestion: OptimizationSuggestion = {
        ...suggestion,
        section: section || suggestion.section,
        entryId: targetId || suggestion.entryId,
      };
      handleApplySuggestion(targetSuggestion, activeSessionId || undefined);
    },
    [handleApplySuggestion, activeSessionId],
  );

  const [isApplyingTailoring, setIsApplyingTailoring] = useState(false);
  // Last failed/succeeded apply-tailoring attempt, rendered INLINE in the
  // LeftPane tailoring panel with a manual Retry. A failed auto-apply
  // previously surfaced only as a transient toast while the panel kept
  // showing the tailor plan (+0%), indistinguishable from "no improvement".
  const [applyTailoringError, setApplyTailoringError] = useState<string | null>(null);
  const lastTailorApplyRef = useRef<{
    tailoredProfile: Record<string, unknown>;
    plan: any[];
    jobTitleVal?: string;
    companyVal?: string;
    jdVal?: string;
  } | null>(null);

  const handleApplyTailoring = useCallback(
    async (
      tailoredProfile: Record<string, unknown>,
      _plan: any[],
      jobTitleVal?: string,
      companyVal?: string,
      jdVal?: string,
    ) => {
      if (!id) return;
      setIsApplyingTailoring(true);
      setApplyTailoringError(null);
      lastTailorApplyRef.current = { tailoredProfile, plan: _plan, jobTitleVal, companyVal, jdVal };
      try {
        const vName = jobTitleVal
          ? `${jobTitleVal} (${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
          : `Tailored Version (${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;

        // Never send a parent the versions list doesn't contain (stale
        // ?versionId=, deleted version). The backend now answers 404, but
        // deriving from master/resume is the better recovery: the tailor
        // output is still compilable without a parent.
        const validParentId =
          activeVersionId && versions.some((v) => v.id === activeVersionId)
            ? activeVersionId
            : undefined;

        const res = await versionsApi.applyTailoring(id, {
          parent_version_id: validParentId,
          version_name: vName,
          tailored_profile: tailoredProfile,
          job_title: jobTitleVal || jobTitle || undefined,
          company: companyVal || company || undefined,
          job_description: jdVal || jobDescription || undefined,
        });

        if (res?.version) {
          await queryClient.invalidateQueries({ queryKey: versionQueryKeys.list(id) });
          await queryClient.invalidateQueries({ queryKey: versionQueryKeys.get(res.version.id) });
          await queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(id) });

          setSelectedVersionId(res.version.id);
          navigate({
            search: (prev: ResumeStudioSearchParams) => ({ ...prev, versionId: res.version.id }),
            replace: true,
          });

          // Sync local state
          if (tailoredProfile) {
            const rawProfile = (tailoredProfile as unknown) as ResumeProfile;
            setProfile(rawProfile);
            setResumeData({
              ...profileToResumeData(rawProfile),
              id: res.version.id,
              name: res.version.version_name,
              updatedAt: new Date(res.version.updated_at).toLocaleString(),
              atsScore: res.version.last_ats_score || atsScore || 0,
            });
          }

          toast.success("Tailored resume compiled and new version created!");
        }
      } catch (err) {
        const msg = getErrorMessage(err) || "Failed to apply tailored resume";
        setApplyTailoringError(msg);
        toast.error(msg);
      } finally {
        setIsApplyingTailoring(false);
      }
    },
    [
      id,
      activeVersionId,
      versions,
      jobTitle,
      company,
      jobDescription,
      queryClient,
      navigate,
      atsScore,
      toast,
    ],
  );

  // Manual retry for a failed apply-tailoring attempt. Deliberately NOT
  // automatic: the LeftPane auto-apply effect latches each context after one
  // attempt, so auto-retrying here would loop forever on persistent failures.
  const handleRetryApplyTailoring = useCallback(() => {
    const last = lastTailorApplyRef.current;
    if (!last || isApplyingTailoring) return;
    void handleApplyTailoring(
      last.tailoredProfile,
      last.plan,
      last.jobTitleVal,
      last.companyVal,
      last.jdVal,
    );
  }, [handleApplyTailoring, isApplyingTailoring]);


  const hasAnalysis = atsScore !== null && atsAnalysis !== null;

  // ATS issues that can be geometrically located on the original PDF: partial
  // keyword/skill matches (the resume contains related evidence). Missing
  // requirements have no resolvable location in the resume, so they remain in
  // the LeftPane only — never faked as PDF coordinates.
  const highlightStrings = useMemo(() => {
    if (!atsAnalysis) return [];
    const set = new Set<string>([
      ...(atsAnalysis.partial_keywords ?? []),
      ...(atsAnalysis.partial_skills ?? []),
    ]);
    return [...set];
  }, [atsAnalysis]);

  // Re-entrancy guard: Typst compilation can take seconds, so a second click
  // during an in-flight export must be ignored instead of spawning a duplicate
  // request/compilation race.
  const isExportingRef = useRef(false);

  const downloadArtifact = useCallback(
    async (format: "pdf" | "docx") => {
      if (isExportingRef.current) return;
      const versionId = activeVersionId || masterVersion?.id;
      if (!versionId) return;
      isExportingRef.current = true;
      try {
        const blob = await requestBlob({
          method: "GET",
          path: `/api/export/resumes/${id}/versions/${versionId}/${format}`,
          // Artifact compilation + download can exceed the 30s default.
          timeoutMs: LONG_REQUEST_TIMEOUT_MS,
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${(selectedVersion?.version_name || record?.title || "resume").replace(/\s+/g, "_")}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
      } catch {
        toast.error(`Unable to download ${format.toUpperCase()}`);
      } finally {
        isExportingRef.current = false;
      }
    },
    [activeVersionId, masterVersion?.id, id, selectedVersion?.version_name, record?.title, toast],
  );

  return (
    <div className="font-sans antialiased flex h-screen flex-col bg-background">
      <header className="border-b-2 border-border bg-surface px-4 py-2.5 flex-shrink-0 z-30 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground border-2 border-border shadow-brutal-xs"
              aria-label="Back to resumes"
            >
              <Link to="/resumes">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_6px_var(--color-success)]" />
              <h1 className="truncate text-sm font-extrabold tracking-tight text-foreground uppercase font-mono">
                {jobTitle || formatResumeDisplayName(record?.original_filename, record?.title)}
              </h1>
              {company && (
                <Badge
                  variant="secondary"
                  className="hidden shrink-0 rounded-sm bg-surface-elevated border-2 border-border text-[10.5px] font-mono font-bold sm:inline-flex"
                >
                  {company}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {showSaved ? (
              <Badge
                variant="outline"
                className="rounded-sm text-[10px] font-mono font-bold text-emerald-400 border-2 border-emerald-500/40 bg-emerald-500/10 animate-fade-in"
              >
                Saved ✓
              </Badge>
            ) : isDirty ? (
              <Badge
                variant="outline"
                className="rounded-sm text-[10px] font-mono font-bold text-amber-400 border-2 border-amber-500/40 bg-amber-500/10"
              >
                Unsaved edits
              </Badge>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-md text-xs font-bold border-2 border-border bg-surface shadow-brutal-xs hover:border-primary"
              onClick={() => setShowATSDialog(true)}
              aria-label="Analyze resume against job description"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">ATS Analysis</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-md text-xs font-bold border-2 border-border bg-surface shadow-brutal-xs hover:border-primary"
              onClick={() => setShowVersionManager(true)}
              aria-label="Manage versions"
            >
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Versions</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-md text-xs font-bold border-2 border-border bg-surface shadow-brutal-xs hover:border-primary hidden sm:inline-flex"
              onClick={() => setShowFinalReview(true)}
            >
              Export
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 rounded-md text-xs font-bold shadow-brutal-primary bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="w-[390px] xl:w-[430px] flex-shrink-0 border-r-2 border-border bg-surface overflow-hidden flex flex-col z-20">
          <ErrorBoundary
            fallbackTitle="Match intelligence hit a hiccup"
            fallbackDescription="The resume preview on the right is unaffected. Retry to reload scores and tailoring."
          >
          <LeftPane
            currentId={id}
            currentVersionId={activeVersionId}
            targetJobTitle={jobTitle}
            targetCompany={company}
            targetJobDescription={jobDescription}
            hasAnalysis={hasAnalysis}
            onApplySuggestion={handleApplySuggestion}
            onRunOptimization={handleRunOptimization}
            onOpenATSDialog={() => setShowATSDialog(true)}
            atsAnalysis={atsAnalysis}
            isAnalyzing={isAnalyzing || analyzeResume.isPending}
            selectedAtsIssue={selectedAtsIssue}
            onSelectIssue={setSelectedAtsIssue}
            evidenceLocations={evidenceLocations}
            reportId={atsReportId || analyzeResume.data?.report?.id || null}
            analyzeError={
              analyzeResume.isError
                ? (() => {
                    const msg = getErrorMessage(analyzeResume.error);
                    return msg === "An unexpected error occurred"
                      ? "Failed to run ATS analysis"
                      : msg;
                  })()
                : null
            }
            isGeneratingOptimization={generateOptimizationMutation.isPending}
            generateOptimizationError={
              generateOptimizationMutation.isError
                ? (() => {
                    const msg = getErrorMessage(generateOptimizationMutation.error);
                    return msg === "An unexpected error occurred"
                      ? "Failed to generate suggestions"
                      : msg;
                  })()
                : null
            }
            onSelectVersion={(vid) => {
              setSelectedVersionId(vid);
              navigate({
                search: (prev: ResumeStudioSearchParams) => ({ ...prev, versionId: vid }),
                replace: true,
              });
            }}
            activeSuggestions={activeSuggestions}
            activeSessionId={activeSessionId}
            onAddSkill={handleAddSkill}
            onApplyTailoring={handleApplyTailoring}
            isApplyingTailoring={isApplyingTailoring}
            applyTailoringError={applyTailoringError}
            onRetryApplyTailoring={handleRetryApplyTailoring}
          />
          </ErrorBoundary>
        </div>
        <div
          className="min-w-0 flex-1 overflow-hidden document-workbench"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 20%, oklch(0.175 0.018 265 / 0.4), transparent 70%)",
          }}
        >
          {isLoading || !record || record.id !== id ? (
            <div className="flex min-h-full items-start justify-center p-6 sm:p-10 overflow-y-auto">
              <A4DocumentSkeleton />
            </div>
          ) : isError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="inline-flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span>{getErrorMessage(error)}</span>
              </div>
              <div className="mt-2">
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link to="/resumes">Back to resumes</Link>
                </Button>
              </div>
            </div>
          ) : resumeData ? (
            <PreviewPane
              resume={resumeData}
              templateSlug={templateSlug}
              isDocumentLoading={isLoading}
              isScanning={isAnalyzing || analyzeResume.isPending}
              atsIssues={highlightStrings}
              onSelectIssue={setSelectedAtsIssue}
              requirementCoverage={atsAnalysis?.requirement_coverage}
              evidenceLocations={evidenceLocations}
              onEvidenceLocationsChange={handleEvidenceLocationsChange}
              selectedRequirementId={selectedAtsIssue}
              selectedTargetId={selectedTargetId}
              onSelectElement={handleSelectElement}
              onExportPdf={() => void downloadArtifact("pdf")}
              onExportDocx={() => void downloadArtifact("docx")}
              onCompareOriginal={() => {
                if (!masterVersion) return;
                setSelectedVersionId(masterVersion.id);
                navigate({
                  search: (prev: ResumeStudioSearchParams) => ({ ...prev, versionId: masterVersion.id }),
                  replace: true,
                });
              }}
              onUpdateResume={handleUpdateResume}
              onDropSuggestion={handleDropSuggestion}
              selectedVersion={selectedVersion}
              activeStoragePath={activeStoragePath}
              originalPdfError={originalPdfError}
              onRetryOriginalPdf={() => void generateSignedUrl(activeStoragePath)}
              originalPdfUrl={originalPdfUrl}
              geometryMap={geometryMap}
              onMutateBlock={handleMutateBlock}
            />
          ) : (
            <div className="flex min-h-full items-start justify-center p-6 sm:p-10 overflow-y-auto">
              <A4DocumentSkeleton />
            </div>
          )}
        </div>
      </div>

      <Dialog open={showVersionManager} onOpenChange={setShowVersionManager}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
          <DialogHeader className="p-4 border-b border-border/60">
            <DialogTitle className="text-base font-semibold">Resume Versions</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Manage master and tailored resume versions.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <VersionManager
              resumeId={id}
              selectedVersionId={selectedVersionId}
              onSelectVersion={(v) => {
                setSelectedVersionId(v?.id || null);
                setShowVersionManager(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFinalReview} onOpenChange={setShowFinalReview}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
          <DialogHeader className="p-4 border-b border-border/60">
            <DialogTitle className="text-base font-semibold">Final Review & Export</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review document readiness and download formatted PDF or DOCX.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <FinalReview
              version={
                selectedVersion ||
                (record
                  ? {
                      id: record.id,
                      resume_id: record.id,
                      version_name: record.title || "Master Resume",
                      source: "manual",
                      content: record.content || {},
                      is_master: true,
                      status: "active",
                      created_at: record.created_at,
                      updated_at: record.updated_at,
                    }
                  : {
                      id: "",
                      resume_id: id,
                      version_name: "Resume",
                      source: "manual",
                      content: {},
                      is_master: true,
                      status: "active",
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    })
              }
              onExportPdf={async () => {
                setIsExporting(true);
                try {
                  const vid = selectedVersionId || activeVersionId || masterVersion?.id;
                  if (!vid) throw new Error("No version selected");
                  const blob = await requestBlob({
                    method: "GET",
                    path: `/api/export/resumes/${id}/versions/${vid}/pdf`,
                    timeoutMs: LONG_REQUEST_TIMEOUT_MS,
                  });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${(selectedVersion?.version_name || record?.title || "resume").replace(/\s+/g, "_")}.pdf`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                } catch {
                  toast.error("Export failed");
                } finally {
                  setIsExporting(false);
                  setShowFinalReview(false);
                }
              }}
              onExportDocx={async () => {
                setIsExporting(true);
                try {
                  const vid = selectedVersionId || activeVersionId || masterVersion?.id;
                  if (!vid) throw new Error("No version selected");
                  const blob = await requestBlob({
                    method: "GET",
                    path: `/api/export/resumes/${id}/versions/${vid}/docx`,
                    timeoutMs: LONG_REQUEST_TIMEOUT_MS,
                  });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${(selectedVersion?.version_name || record?.title || "resume").replace(/\s+/g, "_")}.docx`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                } catch {
                  toast.error("Export failed");
                } finally {
                  setIsExporting(false);
                  setShowFinalReview(false);
                }
              }}
              onReanalyze={() => {
                setShowFinalReview(false);
                setShowATSDialog(true);
              }}
              isExporting={isExporting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {showATSDialog && (
        <ATSAnalysisDialog
          resumeId={id}
          onClose={() => setShowATSDialog(false)}
          onAnalyze={handleAnalyze}
          defaultValues={{ jobTitle, company, jobDescription }}
        />
      )}
    </div>
  );
}
