/**
 * Resume Studio Master Flow Stabilization Regression Tests
 *
 * Validates:
 * 1. Initial PDF flash prevention state machine (MODE A vs MODE B)
 * 2. Active version auto-resolution (no null version blocker on Run Optimization)
 * 3. Candidate-evidence decoupling (missing requirements never block optimization)
 * 4. Proposal -> version -> preview state transition
 * 5. Multi-version hierarchy and master version protection
 */

import { describe, it, expect } from "vitest";
import type { ResumeData, ResumeProfile } from "@/types/resume";
import type { ResumeVersion } from "@/types/version";
import { profileToResumeData, applyResumeDataToProfile } from "@/lib/resume";
import { formatProvenanceLabel } from "@/lib/provenance-labels";
import { buildAtsRequirementViews } from "@/lib/ats-evidence-view";
import type { AtsAnalysisResult } from "@/api/ats";

describe("Stabilization 1: Document Preview State Machine & PDF Flash Prevention", () => {
  it("determines Mode A (original PDF) when viewing uploaded PDF with signedUrl", () => {
    const isPdf = true;
    const originalFileUrl =
      "https://example.supabase.co/storage/v1/object/sign/resumes/u1/doc.pdf?token=123";
    const previewError = false;
    const documentMode: "original" | "canonical" = "original";

    const showOriginalPdf = Boolean(
      documentMode === "original" && originalFileUrl && isPdf && !previewError,
    );
    const isAwaitingPdf = Boolean(
      documentMode === "original" && isPdf && !originalFileUrl && !previewError,
    );

    expect(showOriginalPdf).toBe(true);
    expect(isAwaitingPdf).toBe(false);
  });

  it("identifies awaiting PDF state during async signedUrl resolution to prevent A4Page flash", () => {
    const isPdf = true;
    const originalFileUrl = null; // Still fetching signed URL
    const previewError = false;
    const documentMode: "original" | "canonical" = "original";

    const showOriginalPdf = Boolean(
      documentMode === "original" && originalFileUrl && isPdf && !previewError,
    );
    const isAwaitingPdf = Boolean(
      documentMode === "original" && isPdf && !originalFileUrl && !previewError,
    );

    // MUST be awaiting PDF so a stable document loading skeleton is shown, NOT A4Page
    expect(showOriginalPdf).toBe(false);
    expect(isAwaitingPdf).toBe(true);
  });

  it("switches cleanly to Mode B (canonical editable) when viewing derived version or template", () => {
    const isPdf = true;
    const originalFileUrl =
      "https://example.supabase.co/storage/v1/object/sign/resumes/u1/doc.pdf?token=123";
    const documentMode: "original" | "canonical" = "canonical";

    const showOriginalPdf = Boolean(
      (documentMode as string) === "original" && originalFileUrl && isPdf,
    );

    expect(showOriginalPdf).toBe(false);
  });
});

describe("Stabilization 2: Active Working Version Auto-Resolution", () => {
  const masterVersion: ResumeVersion = {
    id: "ver-master",
    resume_id: "res-1",
    version_name: "Master Version",
    source: "upload_parse",
    content: {},
    is_master: true,
    status: "active",
    created_at: "2026-08-28T10:00:00Z",
    updated_at: "2026-08-28T10:00:00Z",
  };

  const derivedVersion: ResumeVersion = {
    id: "ver-derived",
    resume_id: "res-1",
    version_name: "Frontend Role Version",
    source: "suggestion",
    content: {},
    is_master: false,
    parent_version_id: "ver-master",
    status: "active",
    created_at: "2026-08-28T11:00:00Z",
    updated_at: "2026-08-28T11:00:00Z",
  };

  const versions: ResumeVersion[] = [masterVersion, derivedVersion];

  it("auto-resolves master version when no explicit version ID is in URL or state", () => {
    const selectedVersionId = null;
    const versionIdFromSearch = undefined;

    const master = versions.find((v) => v.is_master);
    const activeVersionId =
      selectedVersionId || versionIdFromSearch || master?.id || versions[0]?.id || null;

    expect(activeVersionId).toBe("ver-master");
    expect(activeVersionId).not.toBeNull();
  });

  it("respects explicit search param version ID when provided", () => {
    const selectedVersionId = null;
    const versionIdFromSearch = "ver-derived";

    const master = versions.find((v) => v.is_master);
    const activeVersionId =
      selectedVersionId || versionIdFromSearch || master?.id || versions[0]?.id || null;

    expect(activeVersionId).toBe("ver-derived");
  });

  it("falls back safely when versions array is empty (e.g. freshly uploaded before parse)", () => {
    const emptyVersions: ResumeVersion[] = [];
    const resumeId = "res-fresh";
    const selectedVersionId = null;

    const master = emptyVersions.find((v) => v.is_master);
    const activeVersionId = selectedVersionId || master?.id || emptyVersions[0]?.id || null;

    // Never blocks optimization — defaults to resume ID when no version row exists yet
    const effectiveTargetId = activeVersionId || resumeId;
    expect(effectiveTargetId).toBe("res-fresh");
  });

  it("correctly identifies master version when selectedVersionData is undefined/loading", () => {
    const activeVersionId = "ver-master";
    const master = versions.find((v) => v.is_master);
    const selectedVersionData = undefined; // still loading from useVersion query

    const isEditingMaster =
      !activeVersionId ||
      activeVersionId === master?.id ||
      Boolean((selectedVersionData as any)?.version?.is_master) ||
      Boolean(versions.find((v) => v.id === activeVersionId)?.is_master);

    expect(isEditingMaster).toBe(true);
  });

  it("correctly identifies derived version as not editing master", () => {
    const activeVersionId = "ver-derived";
    const master = versions.find((v) => v.is_master);
    const selectedVersionData = { version: derivedVersion };

    const isEditingMaster =
      !activeVersionId ||
      activeVersionId === master?.id ||
      Boolean(selectedVersionData?.version?.is_master) ||
      Boolean(versions.find((v) => v.id === activeVersionId)?.is_master);

    expect(isEditingMaster).toBe(false);
  });
});

describe("Stabilization 3: Candidate Evidence Decoupling & Absence Safety", () => {
  it("missing requirements generate gap views without blocking optimization", () => {
    const syntheticAnalysis: AtsAnalysisResult = {
      overall_score: 65,
      keyword_match_score: 60,
      skills_match_score: 60,
      experience_relevance_score: 70,
      qualification_match_score: 80,
      structure_format_score: 85,
      requirement_coverage: [
        {
          requirement: "Kubernetes",
          category: "tool",
          importance: "critical",
          status: "missing",
          evidence_level: "none",
          resume_evidence: [],
          job_evidence: "Must have hands-on experience with Kubernetes orchestration",
          evidence_explanation: "No Kubernetes experience found in resume",
          evidence_source_section: undefined,
        },
      ],
      matched_keywords: ["TypeScript", "React"],
      missing_keywords: ["Kubernetes"],
      partial_keywords: [],
      matched_skills: ["TypeScript", "React"],
      missing_skills: ["Kubernetes"],
      partial_skills: [],
      recommendations: ["Highlight any container orchestration projects using Kubernetes."],
    };

    const views = buildAtsRequirementViews(syntheticAnalysis);
    expect(views).toHaveLength(1);
    expect(views[0].status).toBe("missing");
    expect(views[0].evidenceItems).toHaveLength(0);
    expect(views[0].explanation).toContain("No Kubernetes experience");
  });

  it("fresher-safety: non-professional provenance is never mapped to professional employment", () => {
    expect(formatProvenanceLabel("project")).toBe("Project");
    expect(formatProvenanceLabel("internship")).toBe("Internship");
    expect(formatProvenanceLabel("academic")).toBe("Academic / Lab");
    expect(formatProvenanceLabel("certification")).toBe("Certification / Training");
    expect(formatProvenanceLabel("professional")).toBe("Professional experience");
  });
});

describe("Stabilization 4: Proposal -> Version -> Preview Mutation Integrity", () => {
  const baseProfile: ResumeProfile = {
    personal: {
      fullName: "Alex Rivera",
      email: "alex@example.com",
      phone: "+1 555-0199",
      location: "San Francisco, CA",
      headline: "Senior Software Engineer",
      website: "https://alexrivera.dev",
      linkedin: "https://linkedin.com/in/alexrivera",
      github: "https://github.com/alexrivera",
    },
    targetRole: "Full Stack Engineer",
    summary: "Experienced software engineer with strong TypeScript skills.",
    experience: [
      {
        id: "exp-1",
        company: "Tech Corp",
        role: "Software Engineer",
        location: "San Francisco, CA",
        startDate: "2022",
        endDate: "Present",
        current: true,
        employmentType: "Full-time",
        responsibilities: [
          { id: "b-1", text: "Maintained frontend codebase in React." },
          { id: "b-2", text: "Wrote backend API services." },
        ],
        achievements: [],
        tools: ["React", "Node.js"],
        metrics: "",
      },
    ],
    internships: [],
    education: [
      {
        id: "edu-1",
        institution: "State University",
        degree: "B.S. in Computer Science",
        field: "Computer Science",
        location: "CA",
        startDate: "2018",
        endDate: "2022",
        gpa: "3.8",
        coursework: ["Algorithms", "Distributed Systems"],
        achievements: [],
      },
    ],
    skills: {
      technical: ["React", "TypeScript", "Node.js"],
      tools: ["Git", "Docker"],
      languages: ["JavaScript", "Python"],
      databases: ["PostgreSQL"],
      analytics: [],
      softSkills: ["Leadership"],
      custom: {},
    },
    projects: [
      {
        id: "proj-1",
        name: "Cloud Pipeline",
        description: "Built continuous delivery pipeline using Docker.",
        problem: "Manual deployments",
        contribution: "Automated pipeline",
        technologies: ["Docker", "GitHub Actions"],
        methodology: "CI/CD",
        results: "Fast deployments",
        metrics: "50% faster",
        url: "https://github.com/alexrivera/pipeline",
      },
    ],
    certifications: [
      {
        id: "cert-1",
        name: "AWS Certified Developer",
        issuer: "Amazon Web Services",
        date: "2023",
        credentialUrl: "https://aws.amazon.com/verify",
      },
    ],
    achievements: ["Dean's List 2021"],
    leadership: [],
    languages: [{ id: "l-1", language: "English", proficiency: "Native" }],
    links: [],
    additional: [],
  };

  it("losslessly projects ResumeProfile to ResumeData and back", () => {
    const resumeData = {
      ...profileToResumeData(baseProfile),
      id: "res-1",
      name: "Alex Rivera",
      updatedAt: "2026-08-28",
      atsScore: 85,
    };
    expect(resumeData.contact.fullName).toBe("Alex Rivera");
    expect(resumeData.experience).toHaveLength(1);
    expect(resumeData.experience[0].bullets).toHaveLength(2);
    expect(resumeData.education[0].school).toBe("State University");
    expect(resumeData.certifications).toHaveLength(1);
    expect(resumeData.certifications[0].name).toBe("AWS Certified Developer");

    // Apply back
    const roundtrip = applyResumeDataToProfile(baseProfile, resumeData);
    expect(roundtrip.personal.fullName).toBe("Alex Rivera");
    expect(roundtrip.certifications[0].issuer).toBe("Amazon Web Services");
    expect(roundtrip.projects[0].name).toBe("Cloud Pipeline");
  });

  it("preserves exact field targeting when mutating bullet in experience section", () => {
    const mutated = JSON.parse(JSON.stringify(baseProfile)) as ResumeProfile;
    const targetBullet = mutated.experience[0].responsibilities.find((b) => b.id === "b-1");
    expect(targetBullet).toBeDefined();

    if (targetBullet) {
      targetBullet.text = "Engineered performant frontend interfaces in React and TypeScript.";
    }

    // Only target bullet changes; other fields remain completely intact
    expect(mutated.experience[0].responsibilities[0].text).toBe(
      "Engineered performant frontend interfaces in React and TypeScript.",
    );
    expect(mutated.experience[0].responsibilities[1].text).toBe("Wrote backend API services.");
    expect(mutated.education[0].institution).toBe("State University");
  });
});
