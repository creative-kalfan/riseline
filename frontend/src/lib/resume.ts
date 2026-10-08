import type {
  ResumeData,
  ResumeRecord,
  ResumeListRecord,
  ResumeContact,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  ResumeSection,
  ResumeProfile,
  CertificationEntry,
  LeadershipEntry,
  LanguageEntry,
  LinkEntry,
  AdditionalEntry,
  BulletItem,
} from "../types/resume";

// ---------------------------------------------------------------------------
// Sample fallback for resume content when parsing hasn't completed yet.
// The UI components require a ResumeData shape; if the backend hasn't parsed
// the file yet, we show a minimal placeholder.
// ---------------------------------------------------------------------------

const DEFAULT_SECTIONS: ResumeSection[] = [
  { id: "s-summary", type: "summary", title: "Summary" },
  { id: "s-experience", type: "experience", title: "Experience" },
  { id: "s-skills", type: "skills", title: "Skills" },
  { id: "s-projects", type: "projects", title: "Projects" },
  { id: "s-education", type: "education", title: "Education" },
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.[a-z0-9]+)?$/i;

export function formatResumeDisplayName(filename?: string | null, title?: string | null): string {
  const f = filename?.trim();
  if (f && !UUID_PATTERN.test(f)) {
    return f;
  }
  const t = title?.trim();
  if (t && !UUID_PATTERN.test(t)) {
    return t;
  }
  return "Untitled Resume";
}

export function adaptResumeRecord(record: ResumeRecord): ResumeData {
  const now = Date.now();
  return {
    id: record.id,
    name: formatResumeDisplayName(record.original_filename, record.title),
    targetRole: "",
    updatedAt: formatRelativeTime(record.updated_at),
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
    sections: DEFAULT_SECTIONS,
    internships: [],
    certifications: [],
    achievements: [],
    leadership: [],
    languages: [],
    links: [],
    additional: [],
  };
}

/** Map backend SkillCategory object to flat string array */
function flattenSkills(skills: Record<string, unknown> | undefined): string[] {
  if (!skills) return [];
  const result: string[] = [];
  for (const [key, value] of Object.entries(skills)) {
    if (Array.isArray(value)) {
      result.push(...value.filter((v): v is string => typeof v === "string"));
    } else if (key === "custom" && value && typeof value === "object") {
      for (const customList of Object.values(value as Record<string, unknown>)) {
        if (Array.isArray(customList)) {
          result.push(...customList.filter((v): v is string => typeof v === "string"));
        }
      }
    }
  }
  return result;
}

/** Extract categorized skills from backend SkillCategory object */
function extractSkillCategories(
  skills: Record<string, unknown> | undefined,
): Record<string, string[]> {
  if (!skills) return {};
  const categories: Record<string, string[]> = {};
  if (skills.custom && typeof skills.custom === "object") {
    for (const [catName, list] of Object.entries(skills.custom as Record<string, unknown>)) {
      if (Array.isArray(list) && list.length > 0) {
        categories[catName] = list.filter((s): s is string => typeof s === "string");
      }
    }
  }
  for (const [key, list] of Object.entries(skills)) {
    if (key !== "custom" && Array.isArray(list) && list.length > 0) {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      categories[label] = list.filter((s): s is string => typeof s === "string");
    }
  }
  return categories;
}

function _bulletId(text: string): string {
  // Deterministic ID based on bullet text hash (matches backend _bullet_id)
  return (
    (text.length * 31 + text.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) %
    (2 ** 31 - 1)
  ).toString(36);
}

/** Map backend experience to frontend ExperienceItem */
function mapExperience(exp: Record<string, unknown>): ExperienceItem {
  // Handle both legacy string[] and new BulletItem[] from backend
  const rawBullets = Array.isArray(exp.responsibilities) ? exp.responsibilities : [];
  const bullets: BulletItem[] = rawBullets
    .map((v: unknown) => {
      if (typeof v === "string") return { id: _bulletId(v), text: v };
      if (v && typeof v === "object" && "text" in v) {
        const item = v as BulletItem;
        return { id: item.id || _bulletId(item.text), text: item.text };
      }
      return null;
    })
    .filter((b): b is BulletItem => b !== null && b.text !== "");

  const rawSubs = Array.isArray(exp.sub_engagements) ? exp.sub_engagements : [];
  const sub_engagements = rawSubs
    .map((s: any) => {
      if (!s || typeof s !== "object") return null;
      const sRawBullets = Array.isArray(s.responsibilities)
        ? s.responsibilities
        : Array.isArray(s.bullets)
          ? s.bullets
          : [];
      const sBullets: BulletItem[] = sRawBullets
        .map((b: any) => {
          if (typeof b === "string") return { id: _bulletId(b), text: b };
          if (b && typeof b === "object" && "text" in b)
            return { id: b.id || _bulletId(b.text), text: b.text };
          return null;
        })
        .filter((b: any): b is BulletItem => b !== null && b.text !== "");
      return {
        id: s.id || _bulletId(s.name || ""),
        name: s.name || "",
        description: s.description || "",
        responsibilities: sBullets,
        bullets: sBullets,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null && s.name !== "");

  return {
    id: (exp.id as string) || crypto.randomUUID(),
    role: (exp.role as string) || "",
    company: (exp.company as string) || "",
    location: (exp.location as string) || "",
    start: (exp.start_date as string) || "",
    end: (exp.end_date as string) || "",
    bullets,
    sub_engagements,
  };
}

/** Map backend education to frontend EducationItem */
function mapEducation(edu: Record<string, unknown>): EducationItem {
  return {
    id: (edu.id as string) || crypto.randomUUID(),
    school: (edu.institution as string) || "",
    degree: (edu.degree as string) || "",
    field: (edu.field as string) || "",
    location: (edu.location as string) || "",
    start: (edu.start_date as string) || "",
    end: (edu.end_date as string) || "",
    gpa: (edu.gpa as string) || "",
    coursework: Array.isArray(edu.coursework) ? (edu.coursework as string[]) : [],
    achievements: Array.isArray(edu.achievements) ? (edu.achievements as string[]) : [],
  };
}

/** Map backend project to frontend ProjectItem */
function mapProject(proj: Record<string, unknown>): ProjectItem {
  const rawBullets = Array.isArray(proj.responsibilities)
    ? proj.responsibilities
    : Array.isArray(proj.bullets)
      ? proj.bullets
      : [];
  const responsibilities: BulletItem[] = rawBullets
    .map((v: unknown) => {
      if (typeof v === "string") return { id: _bulletId(v), text: v };
      if (v && typeof v === "object" && "text" in v) {
        const item = v as BulletItem;
        return { id: item.id || _bulletId(item.text), text: item.text };
      }
      return null;
    })
    .filter((b): b is BulletItem => b !== null && b.text !== "");

  return {
    id: (proj.id as string) || crypto.randomUUID(),
    name: (proj.name as string) || "",
    description: (proj.description as string) || "",
    problem: (proj.problem as string) || "",
    contribution: (proj.contribution as string) || "",
    technologies: Array.isArray(proj.technologies) ? (proj.technologies as string[]) : [],
    methodology: (proj.methodology as string) || "",
    results: (proj.results as string) || "",
    metrics: (proj.metrics as string) || "",
    url: (proj.url as string) || "",
    responsibilities,
  };
}

/** Build a ResumeData from parsed content if available, else from the record */
export function buildResumeData(
  record: ResumeRecord,
  parsedContent?: Record<string, unknown> | null,
): ResumeData {
  const base = adaptResumeRecord(record);
  if (!parsedContent) return base;

  const p = parsedContent as Record<string, unknown>;
  const profile = (p.profile as Record<string, unknown>) ?? {};
  const personal = (profile.personal as Record<string, unknown>) ?? {};

  // Map experience array
  const experience = Array.isArray(profile.experience) ? profile.experience.map(mapExperience) : [];

  // Map education array
  const education = Array.isArray(profile.education) ? profile.education.map(mapEducation) : [];

  // Flatten skills from SkillCategory object
  const skills = flattenSkills(profile.skills as unknown as Record<string, unknown>);

  // Map projects array
  const projects = Array.isArray(profile.projects) ? profile.projects.map(mapProject) : [];

  // Map additional arrays
  const internships = Array.isArray(profile.internships)
    ? profile.internships.map(mapExperience)
    : [];

  const certifications = Array.isArray(profile.certifications)
    ? profile.certifications.map((c: Record<string, unknown>) => ({
        id: (c.id as string) || crypto.randomUUID(),
        name: (c.name as string) || "",
        issuer: (c.issuer as string) || "",
        date: (c.date as string) || "",
        credentialUrl: (c.credential_url as string) || "",
      }))
    : [];

  const achievements = Array.isArray(profile.achievements)
    ? profile.achievements.filter((v): v is string => typeof v === "string")
    : [];

  const leadership = Array.isArray(profile.leadership)
    ? profile.leadership.map((l: Record<string, unknown>) => ({
        id: (l.id as string) || crypto.randomUUID(),
        organization: (l.organization as string) || "",
        role: (l.role as string) || "",
        startDate: (l.start_date as string) || "",
        endDate: (l.end_date as string) || "",
        description: (l.description as string) || "",
      }))
    : [];

  const languages = Array.isArray(profile.languages)
    ? profile.languages.map((l: Record<string, unknown>) => ({
        id: (l.id as string) || crypto.randomUUID(),
        language: (l.language as string) || "",
        proficiency: (l.proficiency as string) || "",
      }))
    : [];

  const links = Array.isArray(profile.links)
    ? profile.links.map((l: Record<string, unknown>) => ({
        id: (l.id as string) || crypto.randomUUID(),
        label: (l.label as string) || "",
        url: (l.url as string) || "",
      }))
    : [];

  const additional = Array.isArray(profile.additional)
    ? profile.additional.map((a: Record<string, unknown>) => ({
        id: (a.id as string) || crypto.randomUUID(),
        title: (a.title as string) || "",
        description: (a.description as string) || "",
      }))
    : [];

  return {
    ...base,
    targetRole: (profile.target_role as string) ?? "",
    contact: {
      fullName: (personal.full_name as string) ?? "",
      headline: (personal.headline as string) ?? "",
      email: (personal.email as string) ?? "",
      phone: (personal.phone as string) ?? "",
      location: (personal.location as string) ?? "",
      website: (personal.website as string) ?? "",
      linkedin: (personal.linkedin as string) ?? "",
      github: (personal.github as string) ?? "",
    },
    summary: (profile.summary as string) ?? "",
    experience,
    education,
    skills: flattenSkills(profile.skills as Record<string, unknown>),
    skillCategories: extractSkillCategories(profile.skills as Record<string, unknown>),
    projects,
    sections: DEFAULT_SECTIONS,
    internships,
    certifications,
    achievements,
    leadership,
    languages,
    links,
    additional,
  };
}

/** Convert a ResumeProfile to the UI-facing ResumeData shape. */
export function profileToResumeData(profile: ResumeProfile): Omit<
  ResumeData,
  "id" | "name" | "updatedAt" | "atsScore" | "sections"
> & {
  sections: ResumeSection[];
} {
  const p = profile || ({} as ResumeProfile);
  const personal = p.personal || ({} as typeof p.personal);
  return {
    targetRole: p.targetRole || "",
    contact: {
      fullName: personal.fullName || (personal as any).full_name || "",
      headline: personal.headline || "",
      email: personal.email || "",
      phone: personal.phone || "",
      location: personal.location || "",
      website: personal.website || "",
      linkedin: personal.linkedin || "",
      github: personal.github || "",
    },
    summary: p.summary || "",
    experience: (p.experience || []).map((e) => ({
      id: e.id,
      role: e.role || "",
      company: e.company || "",
      location: e.location || "",
      start: e.startDate || "",
      end: e.endDate || "",
      bullets: (e.responsibilities || []).map((b) =>
        typeof b === "string"
          ? { id: _bulletId(b), text: b }
          : { id: b?.id || _bulletId(b?.text || ""), text: b?.text || "" },
      ),
      sub_engagements: ((e as any).sub_engagements || []).map((sub: any) => {
        const sRawBullets = Array.isArray(sub.responsibilities)
          ? sub.responsibilities
          : Array.isArray(sub.bullets)
            ? sub.bullets
            : [];
        const sBullets = sRawBullets.map((b: any) =>
          typeof b === "string"
            ? { id: _bulletId(b), text: b }
            : { id: b?.id || _bulletId(b?.text || ""), text: b?.text || "" },
        );
        return {
          id: sub.id || _bulletId(sub.name || ""),
          name: sub.name || "",
          description: sub.description || "",
          responsibilities: sBullets,
          bullets: sBullets,
        };
      }),
    })),
    education: (p.education || []).map((e) => ({
      id: e.id,
      school: e.institution || "",
      degree: e.degree || "",
      field: e.field || "",
      location: e.location || "",
      start: e.startDate || "",
      end: e.endDate || "",
      gpa: e.gpa || "",
      coursework: e.coursework || [],
      achievements: e.achievements || [],
    })),
    skills: flattenSkills((p.skills || {}) as unknown as Record<string, unknown>),
    skillCategories: extractSkillCategories((p.skills || {}) as unknown as Record<string, unknown>),
    projects: (p.projects || []).map((proj) => ({
      id: proj.id,
      name: proj.name || "",
      description: proj.description || "",
      problem: proj.problem || "",
      contribution: proj.contribution || "",
      technologies: proj.technologies || [],
      methodology: proj.methodology || "",
      results: proj.results || "",
      metrics: proj.metrics || "",
      url: proj.url || "",
      responsibilities: (proj.responsibilities || []).map((b) =>
        typeof b === "string"
          ? { id: _bulletId(b), text: b }
          : { id: b?.id || _bulletId(b?.text || ""), text: b?.text || "" },
      ),
    })),
    sections: DEFAULT_SECTIONS,
    internships: (p.internships || []).map((e) => ({
      id: e.id,
      role: e.role || "",
      company: e.company || "",
      location: e.location || "",
      start: e.startDate || "",
      end: e.endDate || "",
      bullets: (e.responsibilities || []).map((b) =>
        typeof b === "string"
          ? { id: _bulletId(b), text: b }
          : { id: b?.id || _bulletId(b?.text || ""), text: b?.text || "" },
      ),
    })),
    certifications: (p.certifications || []).map((c) => ({
      id: c.id,
      name: c.name || "",
      issuer: c.issuer || "",
      date: c.date || "",
      credentialUrl: c.credentialUrl || "",
    })),
    achievements: p.achievements || [],
    leadership: (p.leadership || []).map((l) => ({
      id: l.id,
      organization: l.organization || "",
      role: l.role || "",
      startDate: l.startDate || "",
      endDate: l.endDate || "",
      description: l.description || "",
    })),
    languages: (p.languages || []).map((l: any) => ({
      id: l.id,
      language: l.language || l.name || "",
      proficiency: l.proficiency || "",
    })),
    links: (p.links || []).map((l) => ({
      id: l.id,
      label: l.label || "",
      url: l.url || "",
    })),
    additional: (p.additional || []).map((a) => ({
      id: a.id,
      title: a.title || "",
      description: a.description || "",
    })),
  };
}

/** Apply a ResumeData patch onto an existing ResumeProfile, preserving fields
 *  and mapping all supported sections losslessly. */
export function applyResumeDataToProfile(profile: ResumeProfile, data: ResumeData): ResumeProfile {
  const experienceById = new Map(data.experience.map((e) => [e.id, e]));
  const educationById = new Map(data.education.map((e) => [e.id, e]));
  const projectsById = new Map(data.projects.map((p) => [p.id, p]));
  const internshipsById = new Map((data.internships || []).map((e) => [e.id, e]));
  const certsById = new Map((data.certifications || []).map((c) => [c.id, c]));
  const leadershipById = new Map((data.leadership || []).map((l) => [l.id, l]));
  const languagesById = new Map((data.languages || []).map((l) => [l.id, l]));
  const linksById = new Map((data.links || []).map((l) => [l.id, l]));
  const additionalById = new Map((data.additional || []).map((a) => [a.id, a]));

  const updatedExperience = (profile.experience || [])
    .map((e) => {
      const patch = experienceById.get(e.id);
      if (!patch) return e;
      return {
        ...e,
        company: patch.company,
        role: patch.role,
        location: patch.location,
        startDate: patch.start,
        endDate: patch.end,
        responsibilities: patch.bullets.map((b) => ({ id: b.id, text: b.text })),
      };
    })
    .concat(
      data.experience
        .filter((e) => !(profile.experience || []).some((pe) => pe.id === e.id))
        .map((e) => ({
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
        })),
    );

  const updatedInternships = (profile.internships || [])
    .map((e) => {
      const patch = internshipsById.get(e.id);
      if (!patch) return e;
      return {
        ...e,
        company: patch.company,
        role: patch.role,
        location: patch.location,
        startDate: patch.start,
        endDate: patch.end,
        responsibilities: patch.bullets.map((b) => ({ id: b.id, text: b.text })),
      };
    })
    .concat(
      (data.internships || [])
        .filter((e) => !(profile.internships || []).some((pe) => pe.id === e.id))
        .map((e) => ({
          id: e.id,
          company: e.company,
          role: e.role,
          location: e.location,
          startDate: e.start,
          endDate: e.end,
          current: e.end === "" || e.end === "Present",
          employmentType: "Internship",
          responsibilities: e.bullets.map((b) => ({ id: b.id, text: b.text })),
          achievements: [],
          tools: [],
          metrics: "",
        })),
    );

  const updatedEducation = (profile.education || [])
    .map((e) => {
      const patch = educationById.get(e.id);
      if (!patch) return e;
      return {
        ...e,
        institution: patch.school,
        degree: patch.degree,
        field: patch.field,
        location: patch.location,
        startDate: patch.start,
        endDate: patch.end,
        gpa: patch.gpa,
        coursework: patch.coursework,
        achievements: patch.achievements,
      };
    })
    .concat(
      data.education
        .filter((e) => !(profile.education || []).some((pe) => pe.id === e.id))
        .map((e) => ({
          id: e.id,
          institution: e.school,
          degree: e.degree,
          field: e.field,
          location: e.location,
          startDate: e.start,
          endDate: e.end,
          gpa: e.gpa,
          coursework: e.coursework,
          achievements: e.achievements,
        })),
    );

  const updatedProjects = (profile.projects || [])
    .map((p) => {
      const patch = projectsById.get(p.id);
      if (!patch) return p;
      return {
        ...p,
        name: patch.name,
        description: patch.description,
        problem: patch.problem,
        contribution: patch.contribution,
        technologies: patch.technologies,
        methodology: patch.methodology,
        results: patch.results,
        metrics: patch.metrics,
        url: patch.url,
      };
    })
    .concat(
      data.projects
        .filter((p) => !(profile.projects || []).some((pp) => pp.id === p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          problem: p.problem,
          contribution: p.contribution,
          technologies: p.technologies,
          methodology: p.methodology,
          results: p.results,
          metrics: p.metrics,
          url: p.url,
        })),
    );

  const updatedCertifications = (profile.certifications || [])
    .map((c) => {
      const patch = certsById.get(c.id);
      if (!patch) return c;
      return { ...c, ...patch };
    })
    .concat(
      (data.certifications || []).filter(
        (c) => !(profile.certifications || []).some((pc) => pc.id === c.id),
      ),
    );

  const updatedLeadership = (profile.leadership || [])
    .map((l) => {
      const patch = leadershipById.get(l.id);
      if (!patch) return l;
      return { ...l, ...patch };
    })
    .concat(
      (data.leadership || []).filter(
        (l) => !(profile.leadership || []).some((pl) => pl.id === l.id),
      ),
    );

  const updatedLanguages = (profile.languages || [])
    .map((l) => {
      const patch = languagesById.get(l.id);
      if (!patch) return l;
      return { ...l, ...patch };
    })
    .concat(
      (data.languages || []).filter((l) => !(profile.languages || []).some((pl) => pl.id === l.id)),
    );

  const updatedLinks = (profile.links || [])
    .map((l) => {
      const patch = linksById.get(l.id);
      if (!patch) return l;
      return { ...l, ...patch };
    })
    .concat((data.links || []).filter((l) => !(profile.links || []).some((pl) => pl.id === l.id)));

  const updatedAdditional = (profile.additional || [])
    .map((a) => {
      const patch = additionalById.get(a.id);
      if (!patch) return a;
      return { ...a, ...patch };
    })
    .concat(
      (data.additional || []).filter(
        (a) => !(profile.additional || []).some((pa) => pa.id === a.id),
      ),
    );

  const allExistingSkills = new Set(
    flattenSkills(profile.skills as unknown as Record<string, unknown>),
  );
  const newSkillsToAdd = (data.skills || []).filter((s) => !allExistingSkills.has(s));
  const updatedSkills: ResumeProfile["skills"] = {
    technical: [...(profile.skills?.technical || []), ...newSkillsToAdd],
    tools: profile.skills?.tools || [],
    languages: profile.skills?.languages || [],
    databases: profile.skills?.databases || [],
    analytics: profile.skills?.analytics || [],
    softSkills: profile.skills?.softSkills || [],
    custom: profile.skills?.custom || {},
  };

  const updatedAchievements =
    data.achievements && data.achievements.length > 0
      ? data.achievements
      : profile.achievements || [];

  return {
    ...profile,
    personal: {
      ...profile.personal,
      fullName: data.contact.fullName,
      headline: data.contact.headline,
      email: data.contact.email,
      phone: data.contact.phone,
      location: data.contact.location,
      website: data.contact.website,
      linkedin: data.contact.linkedin,
      github: data.contact.github,
    },
    targetRole: data.targetRole,
    summary: data.summary,
    experience: updatedExperience,
    internships: updatedInternships,
    education: updatedEducation,
    skills: updatedSkills,
    projects: updatedProjects,
    certifications: updatedCertifications,
    achievements: updatedAchievements,
    leadership: updatedLeadership,
    languages: updatedLanguages,
    links: updatedLinks,
    additional: updatedAdditional,
  };
}

/** Adapt a ResumeRecord to the lightweight ResumeListRecord shape. */
export function adaptResumeListRecord(record: ResumeRecord): ResumeListRecord {
  const displayName = formatResumeDisplayName(record.original_filename, record.title);
  return {
    id: record.id,
    name: displayName,
    role: "",
    updatedAt: formatRelativeTime(record.updated_at),
    atsScore: 0,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
