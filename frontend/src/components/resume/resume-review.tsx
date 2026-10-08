"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Save, PenLine, AlertTriangle, Plus, Trash2, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useResumeDetail,
  useResumeCompleteness,
  useUpdateResumeContent,
  useParseResume,
} from "@/hooks/api/useResumes";
import { resumeQueryKeys } from "@/hooks/api/useResumes";
import type {
  ResumeRecord,
  ResumeProfile,
  ExperienceEntry,
  EducationEntry,
  ProjectEntry,
  CertificationEntry,
  LeadershipEntry,
  LanguageEntry,
  LinkEntry,
} from "@/types/resume";
import { CompletenessIndicator } from "./completeness-indicator";

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function emptyProfile(): ResumeProfile {
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

function unwrapContent(record: ResumeRecord | undefined): ResumeProfile {
  if (!record?.content) return emptyProfile();
  try {
    const parsed = JSON.parse(JSON.stringify(record.content));
    if (parsed?.profile) return parsed.profile as ResumeProfile;
    if (parsed?.personal) return parsed as ResumeProfile;
    return emptyProfile();
  } catch {
    return emptyProfile();
  }
}

function isFieldUnclear(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.trim().length === 0;
  return false;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unclear?: boolean;
  placeholder?: string;
  multiline?: boolean;
}

function EditableField({ label, value, onChange, unclear, placeholder, multiline }: FieldProps) {
  const Comp = multiline ? Textarea : Input;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Comp
          value={value}
          onChange={(e) => onChange(multiline ? e.target.value : e.target.value)}
          placeholder={placeholder}
          className={cn("rounded-lg bg-background/50", unclear && "border-warning/60")}
        />
        {unclear && <AlertTriangle className="absolute right-2.5 top-2 h-4 w-4 text-warning" />}
      </div>
    </div>
  );
}

function PersonalSection({
  profile,
  onChange,
}: {
  profile: ResumeProfile;
  onChange: (p: ResumeProfile["personal"]) => void;
}) {
  const update = (field: keyof ResumeProfile["personal"], value: string) => {
    onChange({ ...profile.personal, [field]: value });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <EditableField
        label="Full Name"
        value={profile.personal.fullName}
        onChange={(v) => update("fullName", v)}
        unclear={isFieldUnclear(profile.personal.fullName)}
        placeholder="John Doe"
      />
      <EditableField
        label="Email"
        value={profile.personal.email}
        onChange={(v) => update("email", v)}
        unclear={isFieldUnclear(profile.personal.email)}
        placeholder="john@example.com"
      />
      <EditableField
        label="Phone"
        value={profile.personal.phone}
        onChange={(v) => update("phone", v)}
        unclear={isFieldUnclear(profile.personal.phone)}
        placeholder="+1 555-0123"
      />
      <EditableField
        label="Location"
        value={profile.personal.location}
        onChange={(v) => update("location", v)}
        unclear={isFieldUnclear(profile.personal.location)}
        placeholder="San Francisco, CA"
      />
      <EditableField
        label="Headline"
        value={profile.personal.headline}
        onChange={(v) => update("headline", v)}
        unclear={isFieldUnclear(profile.personal.headline)}
        placeholder="Senior Software Engineer"
      />
      <EditableField
        label="Website"
        value={profile.personal.website}
        onChange={(v) => update("website", v)}
        unclear={isFieldUnclear(profile.personal.website)}
        placeholder="https://johndoe.dev"
      />
      <EditableField
        label="LinkedIn"
        value={profile.personal.linkedin}
        onChange={(v) => update("linkedin", v)}
        unclear={isFieldUnclear(profile.personal.linkedin)}
        placeholder="https://linkedin.com/in/johndoe"
      />
      <EditableField
        label="GitHub"
        value={profile.personal.github}
        onChange={(v) => update("github", v)}
        unclear={isFieldUnclear(profile.personal.github)}
        placeholder="https://github.com/johndoe"
      />
    </div>
  );
}

function ExperienceSection({
  items,
  onChange,
}: {
  items: ExperienceEntry[];
  onChange: (v: ExperienceEntry[]) => void;
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
            <EditableField
              label="Company"
              value={item.company}
              onChange={(v) => update(item.id, { company: v })}
              unclear={isFieldUnclear(item.company)}
              placeholder="Acme Inc."
            />
            <EditableField
              label="Role"
              value={item.role}
              onChange={(v) => update(item.id, { role: v })}
              unclear={isFieldUnclear(item.role)}
              placeholder="Software Engineer"
            />
            <EditableField
              label="Location"
              value={item.location}
              onChange={(v) => update(item.id, { location: v })}
              unclear={isFieldUnclear(item.location)}
              placeholder="Remote"
            />
            <EditableField
              label="Employment Type"
              value={item.employmentType}
              onChange={(v) => update(item.id, { employmentType: v })}
              placeholder="Full-time"
            />
            <EditableField
              label="Start Date"
              value={item.startDate}
              onChange={(v) => update(item.id, { startDate: v })}
              placeholder="2021-01"
            />
            <EditableField
              label="End Date"
              value={item.endDate}
              onChange={(v) => update(item.id, { endDate: v })}
              placeholder="Present"
            />
            <div className="sm:col-span-2">
              <EditableField
                label="Metrics"
                value={item.metrics}
                onChange={(v) => update(item.id, { metrics: v })}
                placeholder="e.g., Increased throughput by 30%"
                multiline
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
              <Trash2 className="mr-1.5 h-4 w-4" /> Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        <Plus className="mr-1.5 h-4 w-4" /> Add Experience
      </Button>
    </div>
  );
}

function EducationSection({
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
            <EditableField
              label="Institution"
              value={item.institution}
              onChange={(v) => update(item.id, { institution: v })}
              unclear={isFieldUnclear(item.institution)}
              placeholder="Stanford University"
            />
            <EditableField
              label="Degree"
              value={item.degree}
              onChange={(v) => update(item.id, { degree: v })}
              unclear={isFieldUnclear(item.degree)}
              placeholder="B.S."
            />
            <EditableField
              label="Field"
              value={item.field}
              onChange={(v) => update(item.id, { field: v })}
              unclear={isFieldUnclear(item.field)}
              placeholder="Computer Science"
            />
            <EditableField
              label="Location"
              value={item.location}
              onChange={(v) => update(item.id, { location: v })}
              placeholder="Stanford, CA"
            />
            <EditableField
              label="Start Date"
              value={item.startDate}
              onChange={(v) => update(item.id, { startDate: v })}
              placeholder="2017"
            />
            <EditableField
              label="End Date"
              value={item.endDate}
              onChange={(v) => update(item.id, { endDate: v })}
              placeholder="2021"
            />
            <EditableField
              label="GPA"
              value={item.gpa}
              onChange={(v) => update(item.id, { gpa: v })}
              placeholder="3.8 / 4.0"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => remove(item.id)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        <Plus className="mr-1.5 h-4 w-4" /> Add Education
      </Button>
    </div>
  );
}

function SkillsSection({
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

function ProjectsSection({
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
            <EditableField
              label="Project Name"
              value={item.name}
              onChange={(v) => update(item.id, { name: v })}
              unclear={isFieldUnclear(item.name)}
              placeholder="E-commerce Platform"
            />
            <EditableField
              label="URL"
              value={item.url}
              onChange={(v) => update(item.id, { url: v })}
              placeholder="https://github.com/..."
            />
            <div className="sm:col-span-2">
              <EditableField
                label="Description"
                value={item.description}
                onChange={(v) => update(item.id, { description: v })}
                unclear={isFieldUnclear(item.description)}
                placeholder="Brief project overview"
                multiline
              />
            </div>
            <div className="sm:col-span-2">
              <EditableField
                label="Results"
                value={item.results}
                onChange={(v) => update(item.id, { results: v })}
                placeholder="Key outcomes"
                multiline
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
              <Trash2 className="mr-1.5 h-4 w-4" /> Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        <Plus className="mr-1.5 h-4 w-4" /> Add Project
      </Button>
    </div>
  );
}

function CertificationsSection({
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
            <EditableField
              label="Certification Name"
              value={item.name}
              onChange={(v) => update(item.id, { name: v })}
              unclear={isFieldUnclear(item.name)}
              placeholder="AWS Solutions Architect"
            />
            <EditableField
              label="Issuer"
              value={item.issuer}
              onChange={(v) => update(item.id, { issuer: v })}
              placeholder="Amazon Web Services"
            />
            <EditableField
              label="Date"
              value={item.date}
              onChange={(v) => update(item.id, { date: v })}
              placeholder="2023"
            />
            <EditableField
              label="Credential URL"
              value={item.credentialUrl}
              onChange={(v) => update(item.id, { credentialUrl: v })}
              placeholder="https://..."
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => remove(item.id)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        <Plus className="mr-1.5 h-4 w-4" /> Add Certification
      </Button>
    </div>
  );
}

function AchievementsSection({
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
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadershipSection({
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
            <EditableField
              label="Organization"
              value={item.organization}
              onChange={(v) => update(item.id, { organization: v })}
              unclear={isFieldUnclear(item.organization)}
              placeholder="Student Council"
            />
            <EditableField
              label="Role"
              value={item.role}
              onChange={(v) => update(item.id, { role: v })}
              unclear={isFieldUnclear(item.role)}
              placeholder="President"
            />
            <EditableField
              label="Start Date"
              value={item.startDate}
              onChange={(v) => update(item.id, { startDate: v })}
              placeholder="2022"
            />
            <EditableField
              label="End Date"
              value={item.endDate}
              onChange={(v) => update(item.id, { endDate: v })}
              placeholder="Present"
            />
            <div className="sm:col-span-2">
              <EditableField
                label="Description"
                value={item.description}
                onChange={(v) => update(item.id, { description: v })}
                placeholder="What did you do?"
                multiline
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
              <Trash2 className="mr-1.5 h-4 w-4" /> Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        <Plus className="mr-1.5 h-4 w-4" /> Add Leadership
      </Button>
    </div>
  );
}

function LanguagesSection({
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
            <EditableField
              label="Language"
              value={item.language}
              onChange={(v) => update(item.id, { language: v })}
              unclear={isFieldUnclear(item.language)}
              placeholder="English"
            />
            <EditableField
              label="Proficiency"
              value={item.proficiency}
              onChange={(v) => update(item.id, { proficiency: v })}
              placeholder="Native / Fluent / Intermediate"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => remove(item.id)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        <Plus className="mr-1.5 h-4 w-4" /> Add Language
      </Button>
    </div>
  );
}

function LinksSection({
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
            <EditableField
              label="Label"
              value={item.label}
              onChange={(v) => update(item.id, { label: v })}
              unclear={isFieldUnclear(item.label)}
              placeholder="Portfolio"
            />
            <EditableField
              label="URL"
              value={item.url}
              onChange={(v) => update(item.id, { url: v })}
              unclear={isFieldUnclear(item.url)}
              placeholder="https://..."
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => remove(item.id)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Remove
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add} className="w-full rounded-xl">
        <Plus className="mr-1.5 h-4 w-4" /> Add Link
      </Button>
    </div>
  );
}

export function ResumeReview({ resumeId }: { resumeId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: record, isLoading, isError } = useResumeDetail(resumeId);
  const { data: completeness } = useResumeCompleteness(resumeId);
  const updateMutation = useUpdateResumeContent();
  const parseMutation = useParseResume();
  const [profile, setProfile] = useState<ResumeProfile>(emptyProfile);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setProfile(unwrapContent(record));
    }
  }, [record]);

  useEffect(() => {
    if (!record || record.parse_status === "completed" || record.parse_status === "failed") {
      return;
    }

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId) });
    }, 2000);

    return () => clearInterval(interval);
  }, [record, resumeId, queryClient]);

  const handleSave = useCallback(async () => {
    if (!resumeId) return;
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: resumeId,
        content: { profile },
        meta: { setupCompleted: true, setupStep: 15 },
      });
      toast.success("Resume saved successfully");
      navigate({ to: "/resumes/$id", params: { id: resumeId } });
    } catch {
      toast.error("Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  }, [resumeId, profile, updateMutation, navigate]);

  const handleParseNow = useCallback(async () => {
    if (!resumeId) return;
    try {
      await parseMutation.mutateAsync(resumeId);
      toast.success("Resume parsed");
    } catch {
      toast.error("Parsing failed");
    }
  }, [resumeId, parseMutation]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6 sm:py-12">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <div className="text-sm font-medium">Could not load resume</div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/resumes/setup">Back to setup</Link>
        </Button>
      </div>
    );
  }

  if (record.parse_status === "pending" || record.parse_status === "processing") {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6 sm:py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-sm font-medium">Processing your resume...</div>
        <div className="text-xs text-muted-foreground">This usually takes a few seconds.</div>
      </div>
    );
  }

  if (record.parse_status === "failed") {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6 sm:py-12">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <div className="text-sm font-medium">Resume parsing failed</div>
        <div className="text-xs text-muted-foreground">
          {record.meta?.parse_error
            ? String(record.meta.parse_error)
            : "Please try again or build manually."}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleParseNow} className="rounded-xl">
            Retry Parsing
          </Button>
          <Button
            onClick={() => navigate({ to: "/resumes/setup", search: { mode: "build" } })}
            className="rounded-xl"
          >
            Build Manually
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Review Parsed Resume
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verify and edit the information we extracted from your resume. Fields marked with a
            warning icon may need attention.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleParseNow}
            disabled={parseMutation.isPending}
            className="rounded-xl"
          >
            {parseMutation.isPending ? "Parsing..." : "Re-parse"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/resumes/setup", search: { mode: "build" } })}
            className="rounded-xl"
          >
            <PenLine className="mr-1.5 h-4 w-4" /> Build Manually Instead
          </Button>
        </div>
      </div>

      {completeness && (
        <CompletenessIndicator
          score={completeness.score}
          sections={completeness.sections}
          recommendations={completeness.recommendations}
        />
      )}

      <Accordion
        type="multiple"
        defaultValue={["personal", "experience", "education"]}
        className="space-y-3"
      >
        <AccordionItem value="personal" className="glass rounded-2xl border-border/60 px-5">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">
              Personal Information <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <PersonalSection
              profile={profile}
              onChange={(p) => setProfile({ ...profile, personal: p })}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="experience" className="glass rounded-2xl border-border/60 px-5">
          <AccordionTrigger className="text-sm font-semibold">Work Experience</AccordionTrigger>
          <AccordionContent>
            <ExperienceSection
              items={profile.experience}
              onChange={(v) => setProfile({ ...profile, experience: v })}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="education" className="glass rounded-2xl border-border/60 px-5">
          <AccordionTrigger className="text-sm font-semibold">Education</AccordionTrigger>
          <AccordionContent>
            <EducationSection
              items={profile.education}
              onChange={(v) => setProfile({ ...profile, education: v })}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="skills" className="glass rounded-2xl border-border/60 px-5">
          <AccordionTrigger className="text-sm font-semibold">Skills</AccordionTrigger>
          <AccordionContent>
            <SkillsSection
              skills={profile.skills}
              onChange={(v) => setProfile({ ...profile, skills: v })}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="projects" className="glass rounded-2xl border-border/60 px-5">
          <AccordionTrigger className="text-sm font-semibold">Projects</AccordionTrigger>
          <AccordionContent>
            <ProjectsSection
              items={profile.projects}
              onChange={(v) => setProfile({ ...profile, projects: v })}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="certifications" className="glass rounded-2xl border-border/60 px-5">
          <AccordionTrigger className="text-sm font-semibold">Certifications</AccordionTrigger>
          <AccordionContent>
            <CertificationsSection
              items={profile.certifications}
              onChange={(v) => setProfile({ ...profile, certifications: v })}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="achievements" className="glass rounded-2xl border-border/60 px-5">
          <AccordionTrigger className="text-sm font-semibold">Achievements</AccordionTrigger>
          <AccordionContent>
            <AchievementsSection
              items={profile.achievements}
              onChange={(v) => setProfile({ ...profile, achievements: v })}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="languages" className="glass rounded-2xl border-border/60 px-5">
          <AccordionTrigger className="text-sm font-semibold">Languages</AccordionTrigger>
          <AccordionContent>
            <LanguagesSection
              items={profile.languages}
              onChange={(v) => setProfile({ ...profile, languages: v })}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="links" className="glass rounded-2xl border-border/60 px-5">
          <AccordionTrigger className="text-sm font-semibold">Links</AccordionTrigger>
          <AccordionContent>
            <LinksSection
              items={profile.links}
              onChange={(v) => setProfile({ ...profile, links: v })}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" asChild className="rounded-xl">
          <Link to="/resumes/setup">Back</Link>
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl shadow-[var(--shadow-glow)]"
        >
          <Save className="mr-1.5 h-4 w-4" /> {isSaving ? "Saving..." : "Confirm & Save"}
        </Button>
      </div>
    </div>
  );
}
