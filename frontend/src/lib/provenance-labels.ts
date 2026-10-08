/**
 * Truthful provenance-label helpers for resume evidence presentation.
 *
 * Fresher-safe: Never maps non-professional origins to professional experience.
 */

export type ProvenanceOption = {
  value: string;
  label: string;
  description: string;
};

export const PROVENANCE_LABELS: Record<string, string> = {
  professional: "Professional experience",
  internship: "Internship",
  project: "Project",
  academic: "Academic / Lab",
  certification: "Certification / Training",
  freelance: "Freelance",
  open_source: "Open Source",
  achievement: "Achievement",
  resume: "Other resume evidence",
};

export const PROVENANCE_OPTIONS: ProvenanceOption[] = [
  {
    value: "project",
    label: "Project",
    description: "Personal, academic, capstone, or side project",
  },
  {
    value: "internship",
    label: "Internship",
    description: "Internship or co-op experience",
  },
  {
    value: "academic",
    label: "Academic / Lab",
    description: "Coursework, research lab, thesis, or classroom",
  },
  {
    value: "professional",
    label: "Professional experience",
    description: "Full-time or part-time employment",
  },
  {
    value: "freelance",
    label: "Freelance",
    description: "Client, contract, or consulting work",
  },
  {
    value: "open_source",
    label: "Open Source",
    description: "Open source contributions or community projects",
  },
  {
    value: "certification",
    label: "Certification / Training",
    description: "Bootcamp, certificate, or specialized course",
  },
  {
    value: "achievement",
    label: "Achievement",
    description: "Hackathon, competition, award, or extracurricular",
  },
  {
    value: "resume",
    label: "Other resume evidence",
    description: "Other relevant background not listed above",
  },
];

/**
 * Format provenance into human-readable text.
 * Fresher-safe: Never maps non-professional origins to professional experience.
 */
export function formatProvenanceLabel(provenance?: string | null): string {
  if (!provenance) return "Resume evidence";
  const clean = provenance.trim().toLowerCase();
  return PROVENANCE_LABELS[clean] ?? provenance;
}
