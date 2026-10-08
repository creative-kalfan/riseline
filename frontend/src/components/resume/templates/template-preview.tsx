"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { templateApi } from "@/api/templates";
import { ResumeTemplate, ResumeProfile, ResumeMeta } from "@/types/resume";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Github, Linkedin, Globe } from "lucide-react";

interface TemplatePreviewProps {
  template?: ResumeTemplate;
  templateSlug?: string;
  profile?: ResumeProfile;
  meta?: ResumeMeta;
}

const MOCK_PROFILE: ResumeProfile = {
  personal: {
    fullName: "Alex Johnson",
    email: "alex@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    headline: "Senior Software Engineer",
    website: "https://alexjohnson.dev",
    linkedin: "https://linkedin.com/in/alexjohnson",
    github: "https://github.com/alexjohnson",
  },
  targetRole: "Senior Software Engineer",
  summary:
    "Experienced software engineer with 6+ years of expertise in full-stack development, cloud architecture, and team leadership. Proven track record of delivering scalable solutions and mentoring junior engineers.",
  experience: [
    {
      id: "1",
      company: "TechCorp Inc.",
      role: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "2021-03",
      endDate: "",
      current: true,
      employmentType: "Full-time",
      responsibilities: [
        { id: "b1", text: "Lead a team of 5 engineers building microservices architecture" },
        {
          id: "b2",
          text: "Designed and implemented CI/CD pipelines reducing deployment time by 40%",
        },
        { id: "b3", text: "Migrated legacy monolith to cloud-native architecture on AWS" },
      ],
      achievements: [
        "Promoted to Senior Engineer within 2 years",
        "Received company-wide innovation award for automation framework",
      ],
      tools: ["AWS", "Kubernetes", "TypeScript", "PostgreSQL", "Redis"],
      metrics: "Reduced infrastructure costs by 35%",
    },
  ],
  internships: [],
  education: [
    {
      id: "1",
      institution: "University of California, Berkeley",
      degree: "B.S.",
      field: "Computer Science",
      location: "Berkeley, CA",
      startDate: "2015-08",
      endDate: "2019-05",
      gpa: "3.8",
      coursework: ["Algorithms", "Distributed Systems", "Machine Learning"],
      achievements: ["Dean's List", "Hackathon Winner 2018"],
    },
  ],
  skills: {
    technical: ["TypeScript", "Python", "Go", "React", "Node.js", "GraphQL"],
    tools: ["Docker", "Kubernetes", "AWS", "Terraform", "Git", "Jenkins"],
    languages: ["English (Native)", "Spanish (Professional)"],
    databases: ["PostgreSQL", "Redis", "MongoDB", "Elasticsearch"],
    analytics: ["Prometheus", "Grafana", "ELK Stack", "Datadog"],
    softSkills: ["Leadership", "Mentoring", "Cross-functional Communication"],
    custom: {},
  },
  projects: [
    {
      id: "1",
      name: "Open Source CLI Tool",
      description: "A developer productivity CLI tool with 2K+ GitHub stars",
      problem: "Developers waste time on repetitive deployment tasks",
      contribution: "Built and maintain the core engine and plugin system",
      technologies: ["Go", "Cobra", "Docker"],
      methodology: "Agile",
      results: "2K+ stars, 50+ contributors",
      metrics: "Saves 2+ hours per developer per week",
      url: "https://github.com/alexjohnson/cli-tool",
    },
  ],
  certifications: [
    {
      id: "1",
      name: "AWS Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2022-06",
      credentialUrl: "https://aws.amazon.com/certification/",
    },
  ],
  achievements: ["Company-wide innovation award 2023", "Hackathon winner 2018"],
  leadership: [
    {
      id: "1",
      organization: "TechCorp Engineering",
      role: "Team Lead",
      startDate: "2022-01",
      endDate: "",
      description: "Leading a team of 5 senior and mid-level engineers",
    },
  ],
  languages: [
    { id: "1", language: "English", proficiency: "Native" },
    { id: "2", language: "Spanish", proficiency: "Professional" },
  ],
  links: [
    { id: "1", label: "Portfolio", url: "https://alexjohnson.dev" },
    { id: "2", label: "GitHub", url: "https://github.com/alexjohnson" },
    { id: "3", label: "LinkedIn", url: "https://linkedin.com/in/alexjohnson" },
  ],
  additional: [],
};

export function TemplatePreview({ template, templateSlug, profile, meta }: TemplatePreviewProps) {
  const { data: fetchedTemplate } = useQuery({
    queryKey: ["templates", "detail", templateSlug],
    queryFn: () => templateApi.get(templateSlug as string),
    enabled: Boolean(templateSlug) && !template,
  });

  const activeTemplate =
    template ||
    fetchedTemplate ||
    (templateSlug
      ? {
          id: templateSlug,
          name: templateSlug.charAt(0).toUpperCase() + templateSlug.slice(1),
          slug: templateSlug,
          description: `${templateSlug} resume template`,
          layout: "single-column" as const,
          styles: {},
          is_active: true,
          created_at: "",
          updated_at: "",
        }
      : null);
  const data = useMemo(() => profile || MOCK_PROFILE, [profile]);
  const {
    personal,
    targetRole,
    summary,
    experience = [],
    internships = [],
    education = [],
    skills,
    projects = [],
    certifications = [],
    achievements = [],
    leadership = [],
    languages = [],
    links = [],
    additional = [],
  } = data;

  if (!activeTemplate) {
    return (
      <Card className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border-border/60 bg-white text-gray-900 p-8">
        <div className="text-center text-sm text-gray-500">Loading template...</div>
      </Card>
    );
  }

  const contactItems = [
    personal.email && { icon: null, text: personal.email, href: `mailto:${personal.email}` },
    personal.phone && { icon: null, text: personal.phone, href: `tel:${personal.phone}` },
    personal.location && { icon: null, text: personal.location, href: null },
    personal.website && { icon: Globe, text: personal.website, href: personal.website },
    personal.linkedin && { icon: Linkedin, text: "LinkedIn", href: personal.linkedin },
    personal.github && { icon: Github, text: "GitHub", href: personal.github },
  ].filter(Boolean);

  return (
    <Card className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border-border/60 bg-white text-gray-900 shadow-xl">
      <div className="p-8 sm:p-12">
        <header className="mb-6 border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {personal.fullName || (personal as any).full_name || "Your Name"}
          </h1>
          {personal.headline && <p className="mt-1 text-sm text-gray-600">{personal.headline}</p>}
          {targetRole && <p className="mt-1 text-xs text-gray-500">Target Role: {targetRole}</p>}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
            {contactItems.map((item, i) => {
              if (!item) return null;
              const Icon = item.icon;
              const content = (
                <span key={i} className="inline-flex items-center gap-1">
                  {Icon && <Icon className="h-3 w-3" />}
                  {item.text}
                </span>
              );
              if (item.href) {
                return (
                  <a
                    key={i}
                    href={item.href}
                    className="hover:text-gray-700"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {content}
                  </a>
                );
              }
              return <span key={i}>{content}</span>;
            })}
          </div>
        </header>

        {summary && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Summary
            </h2>
            <p className="text-sm leading-relaxed text-gray-700">{summary}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Experience
            </h2>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{exp.role}</div>
                      <div className="text-sm text-gray-600">{exp.company}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                    </div>
                  </div>
                  {exp.location && (
                    <div className="mt-0.5 text-xs text-gray-500">{exp.location}</div>
                  )}
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-gray-700">
                      {exp.responsibilities.map((bullet, i) => (
                        <li key={bullet.id ?? i}>{bullet.text}</li>
                      ))}
                    </ul>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-gray-700">
                      {exp.achievements.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {exp.sub_engagements && exp.sub_engagements.length > 0 && (
                    <div className="mt-2 space-y-2 pl-3 border-l-2 border-gray-200">
                      <div className="text-xs font-semibold text-gray-800 mb-1">
                        Key Sub-Engagements
                      </div>
                      {exp.sub_engagements.map((sub: any, sIdx: number) => {
                        const subName = sub.name || sub.title || "";
                        const subBullets = Array.isArray(sub.bullets)
                          ? sub.bullets
                          : Array.isArray(sub.responsibilities)
                            ? sub.responsibilities
                            : [];
                        return (
                          <div key={sub.id ?? sIdx} className="space-y-0.5">
                            <div className="flex items-baseline justify-between text-xs">
                              <span className="font-semibold text-gray-800">{subName}</span>
                              {(sub.duration || sub.role) && (
                                <span className="text-gray-500 text-[11px]">
                                  {sub.duration || sub.role}
                                </span>
                              )}
                            </div>
                            {subBullets.length > 0 && (
                              <ul className="list-disc space-y-0.5 pl-4 text-xs text-gray-600">
                                {subBullets.map((b: any, bIdx: number) => (
                                  <li key={b?.id ?? bIdx}>
                                    {typeof b === "string" ? b : b?.text || ""}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {internships.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Internships
            </h2>
            <div className="space-y-4">
              {internships.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{exp.role}</div>
                      <div className="text-sm text-gray-600">{exp.company}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                    </div>
                  </div>
                  {exp.location && (
                    <div className="mt-0.5 text-xs text-gray-500">{exp.location}</div>
                  )}
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-gray-700">
                      {exp.responsibilities.map((bullet, i) => (
                        <li key={bullet.id ?? i}>{bullet.text}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Education
            </h2>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{edu.institution}</div>
                      <div className="text-sm text-gray-600">
                        {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {edu.startDate} – {edu.endDate || "Present"}
                    </div>
                  </div>
                  {edu.gpa && (
                    <div className="mt-0.5 text-xs text-gray-500">
                      {edu.gpa.toLowerCase().includes("gpa") ? edu.gpa : `CGPA: ${edu.gpa}`}
                    </div>
                  )}
                  {edu.coursework && edu.coursework.length > 0 && (
                    <div className="mt-1 text-xs text-gray-600">
                      Coursework: {edu.coursework.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {skills &&
          (Object.values(skills).some((arr) => Array.isArray(arr) && arr.length > 0) ||
            (skills.custom && Object.keys(skills.custom).length > 0)) && (
            <div className="mb-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Skills
              </h2>
              {skills.custom && Object.keys(skills.custom).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(skills.custom).map(([catName, catSkills]) => (
                    <div key={catName} className="text-xs">
                      <span className="font-semibold text-gray-900">{catName}: </span>
                      <span className="text-gray-700">{catSkills.join(", ")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.technical?.map((s, i) => (
                    <Badge key={i} variant="secondary" className="rounded-full text-[10px]">
                      {s}
                    </Badge>
                  ))}
                  {skills.tools?.map((s, i) => (
                    <Badge key={i} variant="outline" className="rounded-full text-[10px]">
                      {s}
                    </Badge>
                  ))}
                  {skills.databases?.map((s, i) => (
                    <Badge key={i} variant="outline" className="rounded-full text-[10px]">
                      {s}
                    </Badge>
                  ))}
                  {skills.analytics?.map((s, i) => (
                    <Badge key={i} variant="outline" className="rounded-full text-[10px]">
                      {s}
                    </Badge>
                  ))}
                  {skills.languages?.map((s, i) => (
                    <Badge key={i} variant="outline" className="rounded-full text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

        {projects.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Live Application Testing Contributions
            </h2>
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div className="text-sm font-semibold text-gray-900">{proj.name}</div>
                  {proj.description && (
                    <p className="mt-1 text-xs text-gray-700">{proj.description}</p>
                  )}
                  {proj.responsibilities && proj.responsibilities.length > 0 && (
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-gray-700">
                      {proj.responsibilities.map((bullet, i) => (
                        <li key={bullet.id ?? i}>{bullet.text}</li>
                      ))}
                    </ul>
                  )}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {proj.technologies.map((tech, i) => (
                        <Badge key={i} variant="secondary" className="rounded-full text-[10px]">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {additional && additional.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Additional Knowledge
            </h2>
            <ul className="list-disc space-y-1 pl-4 text-xs text-gray-700">
              {additional.map((item, i) => (
                <li key={item.id ?? i}>{item.description || item.title}</li>
              ))}
            </ul>
          </div>
        )}

        {certifications.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Certifications
            </h2>
            <div className="space-y-2">
              {certifications.map((cert) => (
                <div key={cert.id} className="text-sm text-gray-700">
                  <span className="font-medium">{cert.name}</span>
                  {cert.issuer && <span className="text-gray-500"> — {cert.issuer}</span>}
                  {cert.date && <span className="text-gray-400"> ({cert.date})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {achievements.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Achievements
            </h2>
            <ul className="list-disc space-y-1 pl-4 text-xs text-gray-700">
              {achievements.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {leadership.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Leadership & Activities
            </h2>
            <div className="space-y-3">
              {leadership.map((lead) => (
                <div key={lead.id} className="text-xs text-gray-700">
                  <div className="font-semibold text-gray-900">
                    {lead.role} — {lead.organization}
                  </div>
                  {lead.description && <p className="mt-0.5 text-gray-600">{lead.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {languages.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Languages
            </h2>
            <div className="text-xs text-gray-700">
              {languages.map((l) => `${l.language} (${l.proficiency})`).join(" · ")}
            </div>
          </div>
        )}

        {links.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Links
            </h2>
            <div className="flex flex-wrap gap-3 text-xs text-blue-600">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {link.label || link.url}
                </a>
              ))}
            </div>
          </div>
        )}

        {additional.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Additional Information
            </h2>
            <div className="space-y-2 text-xs text-gray-700">
              {additional.map((item) => (
                <div key={item.id}>
                  {item.title && <span className="font-semibold">{item.title}: </span>}
                  <span>{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-6" />
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
          <Badge variant="outline" className="rounded-full">
            {activeTemplate.name}
          </Badge>
          {"license" in activeTemplate && Boolean(activeTemplate.license) && (
            <span>License: {String(activeTemplate.license)}</span>
          )}
          {"author" in activeTemplate && Boolean(activeTemplate.author) && (
            <span>By {String(activeTemplate.author)}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
