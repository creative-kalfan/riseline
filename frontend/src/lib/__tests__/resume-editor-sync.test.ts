import { describe, it, expect } from "vitest";
import { applyResumeDataToProfile, profileToResumeData } from "../resume";
import type { ResumeProfile, ResumeData } from "@/types/resume";

const FRESHER_PROFILE: ResumeProfile = {
  personal: {
    fullName: "Priya Patel",
    headline: "Computer Science Graduate | Aspiring Cloud Engineer",
    email: "priya.patel@example.com",
    phone: "+91 91234 56789",
    location: "Hyderabad, India",
    website: "https://priyapatel.dev",
    linkedin: "https://linkedin.com/in/priyapatel",
    github: "https://github.com/priyapatel",
  },
  targetRole: "Junior Cloud Engineer",
  summary:
    "Motivated CS graduate with strong foundations in distributed computing, Python, Docker, and AWS.",
  experience: [],
  internships: [
    {
      id: "intern-1",
      company: "InnovateTech Labs",
      role: "Cloud Engineering Intern",
      location: "Hyderabad, India",
      startDate: "2023-01",
      endDate: "2023-06",
      current: false,
      employmentType: "Internship",
      responsibilities: [
        { id: "ib1", text: "Automated container builds using Docker and GitHub Actions CI/CD" },
        { id: "ib2", text: "Assisted in deploying microservices to AWS ECS with Terraform" },
      ],
      achievements: ["Received outstanding intern commendation"],
      tools: ["Docker", "AWS", "Terraform", "GitHub Actions"],
      metrics: "Reduced deployment time by 30%",
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "National Institute of Technology",
      degree: "Bachelor of Technology",
      field: "Computer Science & Engineering",
      location: "Warangal, India",
      startDate: "2019-08",
      endDate: "2023-05",
      gpa: "8.9/10",
      coursework: ["Operating Systems", "Computer Networks", "Database Systems", "Cloud Computing"],
      achievements: ["Dean's Merit List (top 5% of batch)"],
    },
  ],
  skills: {
    technical: ["Python", "JavaScript", "SQL", "Linux", "Docker", "AWS", "Git"],
    tools: ["VS Code", "Postman", "Terraform", "GitHub Actions"],
    languages: ["English", "Hindi", "Telugu"],
    databases: ["PostgreSQL", "MongoDB"],
    analytics: [],
    softSkills: ["Problem Solving", "Collaboration", "Technical Writing"],
    custom: {},
  },
  projects: [
    {
      id: "proj-1",
      name: "Serverless Image Processing Pipeline",
      description: "Automated event-driven image optimization workflow on AWS Lambda and S3.",
      problem: "Heavy image upload latency on mobile web apps",
      contribution: "Designed serverless trigger pipeline and image compression Lambda function",
      technologies: ["Python", "AWS Lambda", "S3", "CloudWatch", "Pillow"],
      methodology: "Event-driven asynchronous architecture",
      results: "Compressed raw image assets by 65% with zero perceivable quality loss",
      metrics: "Handled 10,000 daily uploads",
      url: "https://github.com/priyapatel/serverless-image-pipeline",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      date: "2023-08",
      credentialUrl: "https://aws.amazon.com/verification",
    },
  ],
  achievements: [
    "Winner, Smart India Hackathon 2022 (Cloud & Distributed Systems category)",
    "Published paper on lightweight container orchestration in university research symposium",
  ],
  leadership: [
    {
      id: "lead-1",
      organization: "Google Developer Student Club (GDSC)",
      role: "Cloud Lead",
      startDate: "2022-07",
      endDate: "2023-05",
      description: "Organized 8 hands-on cloud computing workshops for 300+ students.",
    },
  ],
  languages: [
    { id: "lang-1", language: "English", proficiency: "Fluent" },
    { id: "lang-2", language: "Hindi", proficiency: "Native" },
  ],
  links: [
    { id: "link-1", label: "GitHub", url: "https://github.com/priyapatel" },
    { id: "link-2", label: "Portfolio", url: "https://priyapatel.dev" },
  ],
  additional: [
    {
      id: "add-1",
      title: "Open Source",
      description: "Active contributor to open-source developer tooling on GitHub.",
    },
  ],
};

describe("Resume Studio Two-Pane Editor Synchronization", () => {
  it("converts canonical fresher profile to ResumeData without data loss", () => {
    const data = profileToResumeData(FRESHER_PROFILE);
    expect(data.contact.fullName).toBe("Priya Patel");
    expect(data.experience).toHaveLength(0);
    expect(data.internships).toHaveLength(1);
    expect(data.internships[0].role).toBe("Cloud Engineering Intern");
    expect(data.education).toHaveLength(1);
    expect(data.education[0].school).toBe("National Institute of Technology");
    expect(data.education[0].coursework).toHaveLength(4);
    expect(data.projects).toHaveLength(1);
    expect(data.projects[0].technologies).toContain("AWS Lambda");
    expect(data.certifications).toHaveLength(1);
    expect(data.achievements).toHaveLength(2);
    expect(data.leadership).toHaveLength(1);
    expect(data.languages).toHaveLength(2);
    expect(data.links).toHaveLength(2);
    expect(data.additional).toHaveLength(1);
  });

  it("applies targeted bullet mutation without altering unrelated sections", () => {
    const data = profileToResumeData(FRESHER_PROFILE) as ResumeData;

    // Perform a targeted edit on project 1 description
    const updatedProjects = data.projects.map((p) =>
      p.id === "proj-1"
        ? {
            ...p,
            description: "Enhanced serverless image pipeline with automated WebP conversion.",
          }
        : p,
    );

    const patchedData: ResumeData = {
      ...data,
      projects: updatedProjects,
    };

    const updatedProfile = applyResumeDataToProfile(FRESHER_PROFILE, patchedData);

    // Verify targeted element changed
    expect(updatedProfile.projects[0].description).toBe(
      "Enhanced serverless image pipeline with automated WebP conversion.",
    );

    // Verify all other sections remained completely intact
    expect(updatedProfile.personal.fullName).toBe(FRESHER_PROFILE.personal.fullName);
    expect(updatedProfile.internships[0].responsibilities).toEqual(
      FRESHER_PROFILE.internships[0].responsibilities,
    );
    expect(updatedProfile.education[0].coursework).toEqual(FRESHER_PROFILE.education[0].coursework);
    expect(updatedProfile.achievements).toEqual(FRESHER_PROFILE.achievements);
    expect(updatedProfile.leadership[0].role).toBe("Cloud Lead");
    expect(updatedProfile.certifications[0].name).toBe("AWS Certified Cloud Practitioner");
  });

  it("preserves canonical fields during full round trip across template representations", () => {
    const data = profileToResumeData(FRESHER_PROFILE) as ResumeData;
    const roundTripped = applyResumeDataToProfile(FRESHER_PROFILE, data);

    expect(roundTripped.projects[0].problem).toBe(FRESHER_PROFILE.projects[0].problem);
    expect(roundTripped.projects[0].metrics).toBe(FRESHER_PROFILE.projects[0].metrics);
    expect(roundTripped.internships[0].tools).toEqual(FRESHER_PROFILE.internships[0].tools);
    expect(roundTripped.education[0].gpa).toBe(FRESHER_PROFILE.education[0].gpa);
    expect(roundTripped.leadership[0].description).toBe(FRESHER_PROFILE.leadership[0].description);
  });
});
