"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useCreateResume, useUpdateResumeContent } from "@/hooks/api/useResumes";
import { QUESTIONNAIRE_STEPS, type QuestionnaireStep } from "@/types/resume";
import type {
  ResumeProfile,
  ExperienceEntry,
  EducationEntry,
  ProjectEntry,
  CertificationEntry,
  LeadershipEntry,
  LanguageEntry,
  LinkEntry,
} from "@/types/resume";

const STORAGE_KEY_PREFIX = "careeros-resume-draft-";
const FRESHER_STEPS: QuestionnaireStep[] = [
  "basic",
  "professional",
  "target-role",
  "education",
  "skills",
  "projects",
  "internships",
  "certifications",
  "achievements",
  "languages",
  "links",
  "additional",
  "review",
];
const EXPERIENCED_STEPS: QuestionnaireStep[] = [
  "basic",
  "professional",
  "target-role",
  "experience",
  "achievements",
  "education",
  "skills",
  "projects",
  "internships",
  "certifications",
  "leadership",
  "languages",
  "links",
  "additional",
  "review",
];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function emptyProfile(isFresher: boolean): ResumeProfile {
  return {
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
  };
}

interface DraftData {
  profile: ResumeProfile;
  isFresher: boolean;
  currentStep: number;
  savedResumeId?: string;
}

export function ResumeQuestionnaire({ resumeId }: { resumeId?: string } = {}) {
  const navigate = useNavigate();
  const createMutation = useCreateResume();
  const updateMutation = useUpdateResumeContent();
  const [isFresher, setIsFresher] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [profile, setProfile] = useState<ResumeProfile>(() => emptyProfile(false));
  const [savedResumeId, setSavedResumeId] = useState<string | null>(resumeId || null);
  const [isSaving, setIsSaving] = useState(false);

  const activeSteps = isFresher ? FRESHER_STEPS : EXPERIENCED_STEPS;
  const currentStep = activeSteps[currentStepIndex] ?? "basic";
  const progress = ((currentStepIndex + 1) / activeSteps.length) * 100;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + (resumeId || "new"));
    if (stored) {
      try {
        const draft = JSON.parse(stored) as DraftData;
        if (draft.profile) {
          setProfile(draft.profile);
          setIsFresher(draft.isFresher);
          setCurrentStepIndex(draft.currentStep);
          setSavedResumeId(draft.savedResumeId || resumeId || null);
        }
      } catch {
        // ignore
      }
    }
  }, [resumeId]);

  useEffect(() => {
    const draft: DraftData = {
      profile,
      isFresher,
      currentStep: currentStepIndex,
      savedResumeId: savedResumeId ?? undefined,
    };
    localStorage.setItem(STORAGE_KEY_PREFIX + (resumeId || "new"), JSON.stringify(draft));
  }, [profile, isFresher, currentStepIndex, savedResumeId, resumeId]);

  const goNext = useCallback(() => {
    if (currentStepIndex < activeSteps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  }, [currentStepIndex, activeSteps.length]);

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  }, [currentStepIndex]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const payload = {
        profile,
        meta: { isFresher, setupCompleted: true, setupStep: activeSteps.length } as Record<
          string,
          unknown
        >,
      };
      if (savedResumeId) {
        await updateMutation.mutateAsync({ id: savedResumeId, content: payload });
      } else {
        const created = await createMutation.mutateAsync(
          profile.personal.fullName || "Untitled Resume",
        );
        setSavedResumeId(created.id);
        await updateMutation.mutateAsync({ id: created.id, content: payload });
      }
      toast.success("Resume saved successfully");
      localStorage.removeItem(STORAGE_KEY_PREFIX + (resumeId || "new"));
      navigate({ to: "/resumes" });
    } catch {
      toast.error("Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  }, [
    savedResumeId,
    profile,
    isFresher,
    activeSteps.length,
    updateMutation,
    createMutation,
    navigate,
    resumeId,
  ]);

  const updatePersonal = (patch: Partial<ResumeProfile["personal"]>) => {
    setProfile((p) => ({ ...p, personal: { ...p.personal, ...patch } }));
  };

  const updateList = <T,>(key: keyof ResumeProfile, updater: (prev: T[]) => T[]) => {
    setProfile((p) => ({ ...p, [key]: updater(p[key] as T[]) }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case "basic":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Full Name</Label>
              <Input
                value={profile.personal.fullName}
                onChange={(e) => updatePersonal({ fullName: e.target.value })}
                placeholder="John Doe"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={profile.personal.email}
                onChange={(e) => updatePersonal({ email: e.target.value })}
                placeholder="john@example.com"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={profile.personal.phone}
                onChange={(e) => updatePersonal({ phone: e.target.value })}
                placeholder="+1 555-0123"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Location</Label>
              <Input
                value={profile.personal.location}
                onChange={(e) => updatePersonal({ location: e.target.value })}
                placeholder="San Francisco, CA"
                className="rounded-lg bg-background/50"
              />
            </div>
          </div>
        );
      case "professional":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Professional Headline</Label>
              <Input
                value={profile.personal.headline}
                onChange={(e) => updatePersonal({ headline: e.target.value })}
                placeholder="Senior Software Engineer"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Professional Summary</Label>
              <Textarea
                value={profile.summary}
                onChange={(e) => setProfile((p) => ({ ...p, summary: e.target.value }))}
                placeholder="Brief summary of your background and goals"
                rows={5}
                className="rounded-lg bg-background/50"
              />
            </div>
          </div>
        );
      case "target-role":
        return (
          <div className="space-y-1.5">
            <Label>Target Role</Label>
            <Input
              value={profile.targetRole}
              onChange={(e) => setProfile((p) => ({ ...p, targetRole: e.target.value }))}
              placeholder="e.g., Product Manager at a SaaS company"
              className="rounded-lg bg-background/50"
            />
          </div>
        );
      case "experience":
        return (
          <ExperienceEditor
            items={profile.experience}
            onChange={(v) => updateList("experience", () => v)}
            isFresher={false}
          />
        );
      case "internships":
        return (
          <ExperienceEditor
            items={profile.internships}
            onChange={(v) => updateList("internships", () => v)}
            isFresher={true}
          />
        );
      case "education":
        return (
          <EducationEditor
            items={profile.education}
            onChange={(v) => updateList("education", () => v)}
          />
        );
      case "skills":
        return (
          <SkillsEditor
            skills={profile.skills}
            onChange={(v) => setProfile((p) => ({ ...p, skills: v }))}
          />
        );
      case "projects":
        return (
          <ProjectsEditor
            items={profile.projects}
            onChange={(v) => updateList("projects", () => v)}
          />
        );
      case "certifications":
        return (
          <CertificationsEditor
            items={profile.certifications}
            onChange={(v) => updateList("certifications", () => v)}
          />
        );
      case "achievements":
        return (
          <AchievementsEditor
            items={profile.achievements}
            onChange={(v) => setProfile((p) => ({ ...p, achievements: v }))}
          />
        );
      case "leadership":
        return (
          <LeadershipEditor
            items={profile.leadership}
            onChange={(v) => updateList("leadership", () => v)}
          />
        );
      case "languages":
        return (
          <LanguagesEditor
            items={profile.languages}
            onChange={(v) => updateList("languages", () => v)}
          />
        );
      case "links":
        return <LinksEditor items={profile.links} onChange={(v) => updateList("links", () => v)} />;
      case "additional":
        return (
          <div className="space-y-1.5">
            <Label>Additional Information</Label>
            <Textarea
              value={profile.additional.map((a) => a.title + ": " + a.description).join("\n")}
              onChange={(e) => {
                const lines = e.target.value
                  .split("\n")
                  .filter(Boolean)
                  .map((l) => {
                    const idx = l.indexOf(":");
                    return idx > 0
                      ? {
                          id: generateId(),
                          title: l.slice(0, idx).trim(),
                          description: l.slice(idx + 1).trim(),
                        }
                      : { id: generateId(), title: l, description: "" };
                  });
                setProfile((p) => ({ ...p, additional: lines }));
              }}
              placeholder="Any other relevant information"
              rows={6}
              className="rounded-lg bg-background/50"
            />
          </div>
        );
      case "review":
        return <ReviewSummary profile={profile} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Build Your Resume</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in your information step by step. Your progress is saved automatically.
        </p>
      </div>

      <Card className="glass rounded-2xl border-border/60 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="rounded-full text-[11px]">
              {isFresher ? "Fresher" : "Experienced"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Step {currentStepIndex + 1} of {activeSteps.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFresher((v) => !v)}
            className="rounded-lg text-xs"
          >
            Switch to {isFresher ? "Experienced" : "Fresher"} mode
          </Button>
        </div>
        <Progress value={progress} className="mt-3" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {activeSteps.map((step, i) => (
            <button
              key={step}
              onClick={() => setCurrentStepIndex(i)}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= currentStepIndex ? "bg-primary" : "bg-muted",
              )}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      </Card>

      <Card className="glass rounded-2xl border-border/60 p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold">
            {QUESTIONNAIRE_STEPS.find((s) => s.id === currentStep)?.title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {QUESTIONNAIRE_STEPS.find((s) => s.id === currentStep)?.description}
          </p>
        </div>
        <Separator className="mb-4" />
        {renderStep()}
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStepIndex === 0}
            className="rounded-xl"
          >
            Back
          </Button>
          {currentStepIndex < activeSteps.length - 1 ? (
            <Button onClick={goNext} className="rounded-xl shadow-[var(--shadow-glow)]">
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl shadow-[var(--shadow-glow)]"
            >
              {isSaving ? "Saving..." : "Save & Continue"}
            </Button>
          )}
        </div>
        <Button variant="ghost" asChild className="rounded-xl">
          <Link to="/resumes/setup">Save as draft & exit</Link>
        </Button>
      </div>
    </div>
  );
}

function ExperienceEditor({
  items,
  onChange,
  isFresher,
}: {
  items: ExperienceEntry[];
  onChange: (v: ExperienceEntry[]) => void;
  isFresher: boolean;
}) {
  const add = () => {
    onChange([
      ...items,
      {
        id: generateId(),
        company: "",
        role: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        employmentType: "",
        responsibilities: [],
        achievements: [],
        tools: [],
        metrics: "",
      },
    ]);
  };
  const update = (id: string, patch: Partial<ExperienceEntry>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="glass rounded-xl border-border/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input
                value={item.company}
                onChange={(e) => update(item.id, { company: e.target.value })}
                placeholder="Acme Inc."
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input
                value={item.role}
                onChange={(e) => update(item.id, { role: e.target.value })}
                placeholder="Software Engineer"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                value={item.startDate}
                onChange={(e) => update(item.id, { startDate: e.target.value })}
                placeholder="2021-01"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input
                value={item.endDate}
                onChange={(e) => update(item.id, { endDate: e.target.value })}
                placeholder="Present"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Key Responsibilities (one per line)</Label>
              <Textarea
                value={item.responsibilities.map((b) => b.text).join("\n")}
                onChange={(e) => {
                  const newLines = e.target.value.split("\n").filter(Boolean);
                  const existing = item.responsibilities;
                  // Position-based identity preservation:
                  // Lines at existing positions keep their IDs (even if text changed).
                  // New lines beyond existing count get new IDs.
                  const responsibilities = newLines.map((text, i) => {
                    if (i < existing.length) {
                      return { id: existing[i].id, text };
                    }
                    return { id: crypto.randomUUID(), text };
                  });
                  update(item.id, { responsibilities });
                }}
                placeholder="Led a team of 5 engineers"
                rows={3}
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Achievements</Label>
              <Textarea
                value={item.achievements.join("\n")}
                onChange={(e) =>
                  update(item.id, { achievements: e.target.value.split("\n").filter(Boolean) })
                }
                placeholder="Increased revenue by 20%"
                rows={2}
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Tools & Technologies</Label>
              <Input
                value={item.tools.join(", ")}
                onChange={(e) =>
                  update(item.id, {
                    tools: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="React, Node.js, PostgreSQL"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Metrics</Label>
              <Input
                value={item.metrics}
                onChange={(e) => update(item.id, { metrics: e.target.value })}
                placeholder="e.g., 30% faster load time"
                className="rounded-lg bg-background/50"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => remove(item.id)}
            >
              Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        Add {isFresher ? "Internship" : "Experience"}
      </Button>
    </div>
  );
}

function EducationEditor({
  items,
  onChange,
}: {
  items: EducationEntry[];
  onChange: (v: EducationEntry[]) => void;
}) {
  const add = () => {
    onChange([
      ...items,
      {
        id: generateId(),
        institution: "",
        degree: "",
        field: "",
        location: "",
        startDate: "",
        endDate: "",
        gpa: "",
        coursework: [],
        achievements: [],
      },
    ]);
  };
  const update = (id: string, patch: Partial<EducationEntry>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="glass rounded-xl border-border/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Institution</Label>
              <Input
                value={item.institution}
                onChange={(e) => update(item.id, { institution: e.target.value })}
                placeholder="Stanford University"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Degree</Label>
              <Input
                value={item.degree}
                onChange={(e) => update(item.id, { degree: e.target.value })}
                placeholder="B.S."
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Field</Label>
              <Input
                value={item.field}
                onChange={(e) => update(item.id, { field: e.target.value })}
                placeholder="Computer Science"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                value={item.location}
                onChange={(e) => update(item.id, { location: e.target.value })}
                placeholder="Stanford, CA"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                value={item.startDate}
                onChange={(e) => update(item.id, { startDate: e.target.value })}
                placeholder="2017"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input
                value={item.endDate}
                onChange={(e) => update(item.id, { endDate: e.target.value })}
                placeholder="2021"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>GPA</Label>
              <Input
                value={item.gpa}
                onChange={(e) => update(item.id, { gpa: e.target.value })}
                placeholder="3.8 / 4.0"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Coursework (comma-separated)</Label>
              <Input
                value={item.coursework.join(", ")}
                onChange={(e) =>
                  update(item.id, {
                    coursework: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Data Structures, Algorithms"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Achievements</Label>
              <Textarea
                value={item.achievements.join("\n")}
                onChange={(e) =>
                  update(item.id, { achievements: e.target.value.split("\n").filter(Boolean) })
                }
                placeholder="Dean's List, Hackathon winner"
                rows={2}
                className="rounded-lg bg-background/50"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => remove(item.id)}
            >
              Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        Add Education
      </Button>
    </div>
  );
}

function SkillsEditor({
  skills,
  onChange,
}: {
  skills: ResumeProfile["skills"];
  onChange: (v: ResumeProfile["skills"]) => void;
}) {
  const updateCategory = (category: keyof ResumeProfile["skills"], values: string[]) => {
    onChange({ ...skills, [category]: values });
  };

  const TagInput = ({
    label,
    value,
    onChange: onCatChange,
  }: {
    label: string;
    value: string[];
    onChange: (v: string[]) => void;
  }) => {
    const [input, setInput] = useState("");
    const add = () => {
      const trimmed = input.trim();
      if (!trimmed) return;
      if (value.includes(trimmed)) return;
      onCatChange([...value, trimmed]);
      setInput("");
    };
    const remove = (tag: string) => {
      onCatChange(value.filter((t) => t !== tag));
    };

    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border/60 bg-background/50 p-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full text-[11px]">
              {tag}
              <button
                onClick={() => remove(tag)}
                className="ml-1.5 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          ))}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            className="min-w-[80px] flex-1 bg-transparent text-xs outline-none"
            placeholder="Add..."
          />
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TagInput
        label="Technical Skills"
        value={skills.technical}
        onChange={(v) => updateCategory("technical", v)}
      />
      <TagInput label="Tools" value={skills.tools} onChange={(v) => updateCategory("tools", v)} />
      <TagInput
        label="Languages"
        value={skills.languages}
        onChange={(v) => updateCategory("languages", v)}
      />
      <TagInput
        label="Databases"
        value={skills.databases}
        onChange={(v) => updateCategory("databases", v)}
      />
      <TagInput
        label="Analytics"
        value={skills.analytics}
        onChange={(v) => updateCategory("analytics", v)}
      />
      <TagInput
        label="Soft Skills"
        value={skills.softSkills}
        onChange={(v) => updateCategory("softSkills", v)}
      />
    </div>
  );
}

function ProjectsEditor({
  items,
  onChange,
}: {
  items: ProjectEntry[];
  onChange: (v: ProjectEntry[]) => void;
}) {
  const add = () => {
    onChange([
      ...items,
      {
        id: generateId(),
        name: "",
        description: "",
        problem: "",
        contribution: "",
        technologies: [],
        methodology: "",
        results: "",
        metrics: "",
        url: "",
      },
    ]);
  };
  const update = (id: string, patch: Partial<ProjectEntry>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="glass rounded-xl border-border/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Project Name</Label>
              <Input
                value={item.name}
                onChange={(e) => update(item.id, { name: e.target.value })}
                placeholder="E-commerce Platform"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input
                value={item.url}
                onChange={(e) => update(item.id, { url: e.target.value })}
                placeholder="https://..."
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={item.description}
                onChange={(e) => update(item.id, { description: e.target.value })}
                placeholder="Brief project overview"
                rows={3}
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Technologies</Label>
              <Input
                value={item.technologies.join(", ")}
                onChange={(e) =>
                  update(item.id, {
                    technologies: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="React, Node.js, PostgreSQL"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Results</Label>
              <Textarea
                value={item.results}
                onChange={(e) => update(item.id, { results: e.target.value })}
                placeholder="Key outcomes"
                rows={2}
                className="rounded-lg bg-background/50"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => remove(item.id)}
            >
              Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        Add Project
      </Button>
    </div>
  );
}

function CertificationsEditor({
  items,
  onChange,
}: {
  items: CertificationEntry[];
  onChange: (v: CertificationEntry[]) => void;
}) {
  const add = () => {
    onChange([...items, { id: generateId(), name: "", issuer: "", date: "", credentialUrl: "" }]);
  };
  const update = (id: string, patch: Partial<CertificationEntry>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="glass rounded-xl border-border/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Certification Name</Label>
              <Input
                value={item.name}
                onChange={(e) => update(item.id, { name: e.target.value })}
                placeholder="AWS Solutions Architect"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Issuer</Label>
              <Input
                value={item.issuer}
                onChange={(e) => update(item.id, { issuer: e.target.value })}
                placeholder="Amazon Web Services"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                value={item.date}
                onChange={(e) => update(item.id, { date: e.target.value })}
                placeholder="2023"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Credential URL</Label>
              <Input
                value={item.credentialUrl}
                onChange={(e) => update(item.id, { credentialUrl: e.target.value })}
                placeholder="https://..."
                className="rounded-lg bg-background/50"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => remove(item.id)}
            >
              Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        Add Certification
      </Button>
    </div>
  );
}

function AchievementsEditor({
  items,
  onChange,
}: {
  items: string[];
  onChange: (v: string[]) => void;
}) {
  const [text, setText] = useState("");
  const add = () => {
    if (!text.trim()) return;
    onChange([...items, text.trim()]);
    setText("");
  };
  const remove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an achievement..."
          className="rounded-lg bg-background/50"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button onClick={add} className="rounded-lg">
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm"
          >
            <span className="truncate">{item}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-md text-destructive"
              onClick={() => remove(i)}
            >
              <TrashIcon />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadershipEditor({
  items,
  onChange,
}: {
  items: LeadershipEntry[];
  onChange: (v: LeadershipEntry[]) => void;
}) {
  const add = () => {
    onChange([
      ...items,
      { id: generateId(), organization: "", role: "", startDate: "", endDate: "", description: "" },
    ]);
  };
  const update = (id: string, patch: Partial<LeadershipEntry>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="glass rounded-xl border-border/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Organization</Label>
              <Input
                value={item.organization}
                onChange={(e) => update(item.id, { organization: e.target.value })}
                placeholder="Student Council"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input
                value={item.role}
                onChange={(e) => update(item.id, { role: e.target.value })}
                placeholder="President"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                value={item.startDate}
                onChange={(e) => update(item.id, { startDate: e.target.value })}
                placeholder="2022"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input
                value={item.endDate}
                onChange={(e) => update(item.id, { endDate: e.target.value })}
                placeholder="Present"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={item.description}
                onChange={(e) => update(item.id, { description: e.target.value })}
                placeholder="What did you do?"
                rows={3}
                className="rounded-lg bg-background/50"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => remove(item.id)}
            >
              Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        Add Leadership
      </Button>
    </div>
  );
}

function LanguagesEditor({
  items,
  onChange,
}: {
  items: LanguageEntry[];
  onChange: (v: LanguageEntry[]) => void;
}) {
  const add = () => {
    onChange([...items, { id: generateId(), language: "", proficiency: "" }]);
  };
  const update = (id: string, patch: Partial<LanguageEntry>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="glass rounded-xl border-border/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Language</Label>
              <Input
                value={item.language}
                onChange={(e) => update(item.id, { language: e.target.value })}
                placeholder="English"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Proficiency</Label>
              <Input
                value={item.proficiency}
                onChange={(e) => update(item.id, { proficiency: e.target.value })}
                placeholder="Native / Fluent / Intermediate"
                className="rounded-lg bg-background/50"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => remove(item.id)}
            >
              Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        Add Language
      </Button>
    </div>
  );
}

function LinksEditor({
  items,
  onChange,
}: {
  items: LinkEntry[];
  onChange: (v: LinkEntry[]) => void;
}) {
  const add = () => {
    onChange([...items, { id: generateId(), label: "", url: "" }]);
  };
  const update = (id: string, patch: Partial<LinkEntry>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="glass rounded-xl border-border/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input
                value={item.label}
                onChange={(e) => update(item.id, { label: e.target.value })}
                placeholder="Portfolio"
                className="rounded-lg bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input
                value={item.url}
                onChange={(e) => update(item.id, { url: e.target.value })}
                placeholder="https://..."
                className="rounded-lg bg-background/50"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => remove(item.id)}
            >
              Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        Add Link
      </Button>
    </div>
  );
}

function ReviewSummary({ profile }: { profile: ResumeProfile }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryItem label="Full Name" value={profile.personal.fullName} />
        <SummaryItem label="Email" value={profile.personal.email} />
        <SummaryItem label="Phone" value={profile.personal.phone} />
        <SummaryItem label="Location" value={profile.personal.location} />
        <SummaryItem label="Headline" value={profile.personal.headline} />
        <SummaryItem label="Target Role" value={profile.targetRole} />
      </div>
      <Separator />
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Summary
        </div>
        <div className="mt-1 text-sm">{profile.summary || "—"}</div>
      </div>
      <Separator />
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Experience ({profile.experience.length})
        </div>
        <div className="mt-1 text-sm">
          {profile.experience.map((e) => `${e.role} at ${e.company}`).join(", ") || "—"}
        </div>
      </div>
      <Separator />
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Education ({profile.education.length})
        </div>
        <div className="mt-1 text-sm">
          {profile.education.map((e) => `${e.degree} at ${e.institution}`).join(", ") || "—"}
        </div>
      </div>
      <Separator />
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Skills
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {Object.values(profile.skills)
            .flat()
            .map((s) => (
              <Badge key={s} variant="secondary" className="rounded-full text-[11px]">
                {s}
              </Badge>
            ))}
          {Object.values(profile.skills).every((arr) => arr.length === 0) && (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value || "—"}</div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-trash-2"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}
