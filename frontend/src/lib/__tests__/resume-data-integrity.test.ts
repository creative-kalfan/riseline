import { describe, it, expect } from "vitest";
import { applyResumeDataToProfile, buildResumeData, profileToResumeData } from "../resume";
import type { ResumeProfile, ResumeData, ResumeRecord } from "@/types/resume";

const CANONICAL_TEST_PROFILE: ResumeProfile = {
  personal: {
    fullName: "Aarav Sharma",
    headline: "Senior Distributed Systems Engineer",
    email: "aarav.sharma@example.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, Karnataka, India",
    website: "https://aaravsharma.dev",
    linkedin: "https://linkedin.com/in/aaravsharma",
    github: "https://github.com/aaravsharma",
  },
  targetRole: "Staff Backend Engineer",
  summary:
    "Distinguished backend engineer with 7+ years of experience architecting high-throughput, low-latency microservices.",
  experience: [
    {
      id: "exp-1",
      company: "CloudScale Technologies",
      role: "Lead Platform Engineer",
      location: "Bengaluru, India",
      startDate: "2021-06",
      endDate: "Present",
      current: true,
      employmentType: "Full-time",
      responsibilities: [
        {
          id: "b1",
          text: "Architected distributed event-driven data streaming pipeline processing 2M events/sec",
        },
        {
          id: "b2",
          text: "Reduced p99 API latency by 45% using connection pooling and async pipelines",
        },
      ],
      achievements: [
        "Engineered zero-downtime database migration",
        "Company technical excellence award 2023",
      ],
      tools: ["Python", "FastAPI", "Go", "Redis", "Kafka", "PostgreSQL"],
      metrics: "45% latency reduction, 99.99% service availability",
    },
    {
      id: "exp-2",
      company: "FinTech Solutions Ltd",
      role: "Senior Software Engineer",
      location: "Pune, India",
      startDate: "2018-08",
      endDate: "2021-05",
      current: false,
      employmentType: "Full-time",
      responsibilities: [
        { id: "b3", text: "Developed high-concurrency payment gateway routing service" },
        {
          id: "b4",
          text: "Implemented idempotent webhook dispatch system with automatic retry backoff",
        },
      ],
      achievements: ["Maintained 100% financial transaction reconciliation accuracy"],
      tools: ["Python", "Django", "PostgreSQL", "Docker", "AWS"],
      metrics: "Handled $50M monthly transaction volume",
    },
  ],
  internships: [
    {
      id: "intern-1",
      company: "National Research Labs",
      role: "Research Intern",
      location: "Hyderabad, India",
      startDate: "2017-12",
      endDate: "2018-05",
      current: false,
      employmentType: "Internship",
      responsibilities: [
        { id: "ib1", text: "Analyzed memory management bottlenecks in Linux kernel page tables" },
      ],
      achievements: ["Published research paper in IEEE conference"],
      tools: ["C", "Linux", "GDB", "Perf"],
      metrics: "Optimized page cache hit ratio by 18%",
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "Indian Institute of Technology (IIT) Bombay",
      degree: "B.Tech & M.Tech Dual Degree",
      field: "Computer Science and Engineering",
      location: "Mumbai, India",
      startDate: "2013-07",
      endDate: "2018-05",
      gpa: "9.4 / 10.0",
      coursework: [
        "Advanced Algorithms",
        "Distributed Computing",
        "Database Systems",
        "Operating Systems",
      ],
      achievements: ["Institute Gold Medalist", "ACM ICPC Regional Finalist"],
    },
  ],
  skills: {
    technical: ["Python", "Go", "TypeScript", "FastAPI", "React", "Node.js"],
    tools: ["Docker", "Kubernetes", "Git", "GitHub Actions", "Terraform"],
    languages: ["English (Fluent)", "Hindi (Native)"],
    databases: ["PostgreSQL", "Redis", "Elasticsearch", "MongoDB"],
    analytics: ["Prometheus", "Grafana", "OpenTelemetry"],
    softSkills: ["Technical Leadership", "Mentorship", "System Design"],
    custom: {},
  },
  projects: [
    {
      id: "proj-1",
      name: "Distributed Task Scheduler (Open Source)",
      description: "Fault-tolerant, high-concurrency distributed job scheduler with Raft consensus",
      problem:
        "Existing schedulers suffered from single-point-of-failure split-brain issues under network partitions",
      contribution: "Authored the Raft consensus engine and WAL persistence layer",
      technologies: ["Go", "gRPC", "Protobuf", "Raft"],
      methodology: "TDD & Chaos Engineering",
      results: "1.5K+ GitHub stars, adopted by 12 production engineering teams",
      metrics: "Zero data loss under simulated 50% node partition tests",
      url: "https://github.com/aaravsharma/task-scheduler",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services",
      date: "2023-04",
      credentialUrl: "https://aws.amazon.com/verify/cert-12345",
    },
  ],
  achievements: [
    "Published author in IEEE Transactions on Cloud Computing (2019)",
    "Winner of National Hackathon 2018 out of 500+ teams",
  ],
  leadership: [
    {
      id: "lead-1",
      organization: "Open Source India Community",
      role: "Core Maintainer & Chapter Lead",
      startDate: "2020-01",
      endDate: "Present",
      description:
        "Mentored 50+ junior developers and organized monthly distributed systems meetups",
    },
  ],
  languages: [
    { id: "lang-1", language: "English", proficiency: "Fluent" },
    { id: "lang-2", language: "Hindi", proficiency: "Native" },
  ],
  links: [
    { id: "link-1", label: "Portfolio", url: "https://aaravsharma.dev" },
    { id: "link-2", label: "GitHub", url: "https://github.com/aaravsharma" },
    { id: "link-3", label: "LinkedIn", url: "https://linkedin.com/in/aaravsharma" },
  ],
  additional: [
    {
      id: "add-1",
      title: "Open Source Contributions",
      description: "Contributor to CPython (asyncio module) and Redis core documentation",
    },
  ],
};

describe("R6.11 — Complete 14-Section ResumeData ↔ ResumeProfile Round-Trip Audit", () => {
  it("losslessly converts ResumeProfile -> ResumeData -> ResumeProfile", () => {
    // 1. Convert canonical ResumeProfile to ResumeData
    const intermediateData: ResumeData = {
      ...profileToResumeData(CANONICAL_TEST_PROFILE),
      id: "test-resume-1",
      name: "Aarav Sharma - Master",
      updatedAt: "Just now",
      atsScore: 85,
    };

    // Verify intermediate ResumeData preserves every section
    expect(intermediateData.contact.fullName).toBe("Aarav Sharma");
    expect(intermediateData.experience).toHaveLength(2);
    expect(intermediateData.internships).toHaveLength(1);
    expect(intermediateData.education).toHaveLength(1);
    expect(intermediateData.projects).toHaveLength(1);
    expect(intermediateData.certifications).toHaveLength(1);
    expect(intermediateData.achievements).toHaveLength(2);
    expect(intermediateData.leadership).toHaveLength(1);
    expect(intermediateData.languages).toHaveLength(2);
    expect(intermediateData.links).toHaveLength(3);
    expect(intermediateData.additional).toHaveLength(1);

    // 2. Round-trip back to ResumeProfile using applyResumeDataToProfile
    const emptyBaseProfile: ResumeProfile = {
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

    const roundTripped = applyResumeDataToProfile(emptyBaseProfile, intermediateData);

    // Verify all 14 sections survive the full cycle without data loss
    expect(roundTripped.personal.fullName).toBe(CANONICAL_TEST_PROFILE.personal.fullName);
    expect(roundTripped.personal.email).toBe(CANONICAL_TEST_PROFILE.personal.email);
    expect(roundTripped.personal.phone).toBe(CANONICAL_TEST_PROFILE.personal.phone);
    expect(roundTripped.personal.location).toBe(CANONICAL_TEST_PROFILE.personal.location);
    expect(roundTripped.targetRole).toBe(CANONICAL_TEST_PROFILE.targetRole);
    expect(roundTripped.summary).toBe(CANONICAL_TEST_PROFILE.summary);

    // Experience
    expect(roundTripped.experience).toHaveLength(2);
    expect(roundTripped.experience[0].company).toBe("CloudScale Technologies");
    expect(roundTripped.experience[0].responsibilities).toHaveLength(2);

    // Internships
    expect(roundTripped.internships).toHaveLength(1);
    expect(roundTripped.internships[0].company).toBe("National Research Labs");
    expect(roundTripped.internships[0].role).toBe("Research Intern");

    // Education
    expect(roundTripped.education).toHaveLength(1);
    expect(roundTripped.education[0].institution).toBe(
      "Indian Institute of Technology (IIT) Bombay",
    );
    expect(roundTripped.education[0].gpa).toBe("9.4 / 10.0");
    expect(roundTripped.education[0].coursework).toEqual(
      CANONICAL_TEST_PROFILE.education[0].coursework,
    );

    // Projects
    expect(roundTripped.projects).toHaveLength(1);
    expect(roundTripped.projects[0].name).toBe("Distributed Task Scheduler (Open Source)");
    expect(roundTripped.projects[0].technologies).toEqual(["Go", "gRPC", "Protobuf", "Raft"]);

    // Certifications
    expect(roundTripped.certifications).toHaveLength(1);
    expect(roundTripped.certifications[0].name).toBe(
      "AWS Certified Solutions Architect – Professional",
    );

    // Achievements
    expect(roundTripped.achievements).toEqual(CANONICAL_TEST_PROFILE.achievements);

    // Leadership
    expect(roundTripped.leadership).toHaveLength(1);
    expect(roundTripped.leadership[0].organization).toBe("Open Source India Community");

    // Languages
    expect(roundTripped.languages).toHaveLength(2);
    expect(roundTripped.languages[0].language).toBe("English");

    // Links
    expect(roundTripped.links).toHaveLength(3);
    expect(roundTripped.links[0].url).toBe("https://aaravsharma.dev");

    // Additional
    expect(roundTripped.additional).toHaveLength(1);
    expect(roundTripped.additional[0].title).toBe("Open Source Contributions");
  });

  it("buildResumeData correctly handles full parsed content record", () => {
    const record: ResumeRecord = {
      id: "res-123",
      user_id: "user-456",
      title: "My Uploaded Resume.pdf",
      original_filename: "My Uploaded Resume.pdf",
      parse_status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const parsedContent = {
      profile: {
        ...CANONICAL_TEST_PROFILE,
        target_role: CANONICAL_TEST_PROFILE.targetRole,
        personal: {
          full_name: CANONICAL_TEST_PROFILE.personal.fullName,
          headline: CANONICAL_TEST_PROFILE.personal.headline,
          email: CANONICAL_TEST_PROFILE.personal.email,
          phone: CANONICAL_TEST_PROFILE.personal.phone,
          location: CANONICAL_TEST_PROFILE.personal.location,
          website: CANONICAL_TEST_PROFILE.personal.website,
          linkedin: CANONICAL_TEST_PROFILE.personal.linkedin,
          github: CANONICAL_TEST_PROFILE.personal.github,
        },
      },
    };

    const built = buildResumeData(record, parsedContent);
    expect(built.name).toBe("My Uploaded Resume.pdf");
    expect(built.contact.fullName).toBe("Aarav Sharma");
    expect(built.experience).toHaveLength(2);
    expect(built.internships).toHaveLength(1);
    expect(built.education).toHaveLength(1);
    expect(built.projects).toHaveLength(1);
    expect(built.certifications).toHaveLength(1);
    expect(built.achievements).toHaveLength(2);
    expect(built.leadership).toHaveLength(1);
    expect(built.languages).toHaveLength(2);
    expect(built.links).toHaveLength(3);
    expect(built.additional).toHaveLength(1);
  });

  it("Fresher safety: produces valid fresher resume data with zero professional employment", () => {
    const fresherProfile: ResumeProfile = {
      personal: {
        fullName: "Sneha Patel",
        email: "sneha.patel@example.com",
        phone: "+91 99887 76655",
        location: "Ahmedabad, India",
        headline: "Graduate Software Engineer | Open Source Enthusiast",
        website: "https://snehapatel.dev",
        linkedin: "https://linkedin.com/in/snehapatel",
        github: "https://github.com/snehapatel",
      },
      targetRole: "Junior Backend Developer",
      summary:
        "Recent Computer Science graduate with strong foundation in data structures, algorithms, and web APIs.",
      experience: [], // ZERO professional experience
      internships: [
        {
          id: "fresher-intern-1",
          company: "Startup Lab",
          role: "Software Engineering Intern",
          location: "Remote",
          startDate: "2023-01",
          endDate: "2023-06",
          current: false,
          employmentType: "Internship",
          responsibilities: [{ id: "fib-1", text: "Built automated testing scripts in Python" }],
          achievements: [],
          tools: ["Python", "Pytest"],
          metrics: "",
        },
      ],
      education: [
        {
          id: "fresher-edu-1",
          institution: "Gujarat Technological University",
          degree: "B.E.",
          field: "Computer Engineering",
          location: "Ahmedabad, India",
          startDate: "2019-08",
          endDate: "2023-05",
          gpa: "8.9 / 10.0",
          coursework: ["Data Structures", "Web Development", "Database Management"],
          achievements: ["Top 5% of graduating class"],
        },
      ],
      skills: {
        technical: ["Python", "JavaScript", "SQL", "HTML/CSS"],
        tools: ["Git", "VS Code", "Postman"],
        languages: ["English", "Gujarati", "Hindi"],
        databases: ["PostgreSQL", "SQLite"],
        analytics: [],
        softSkills: ["Fast Learner", "Collaboration"],
        custom: {},
      },
      projects: [
        {
          id: "fresher-proj-1",
          name: "Campus Event Manager",
          description:
            "Full-stack web application for college event ticketing and schedule tracking",
          problem: "Paper ticketing was inefficient and caused long entry queues",
          contribution: "Developed backend REST API with authentication",
          technologies: ["Python", "FastAPI", "SQLite"],
          methodology: "Agile",
          results: "Used by 1,200+ students during annual tech festival",
          metrics: "Reduced queue wait times by 80%",
          url: "https://github.com/snehapatel/campus-events",
        },
      ],
      certifications: [
        {
          id: "fresher-cert-1",
          name: "Python for Everybody Specialization",
          issuer: "Coursera",
          date: "2022-11",
          credentialUrl: "https://coursera.org/verify/12345",
        },
      ],
      achievements: ["Winner - Inter-College Coding Contest 2022"],
      leadership: [],
      languages: [{ id: "l1", language: "English", proficiency: "Fluent" }],
      links: [{ id: "link-1", label: "GitHub", url: "https://github.com/snehapatel" }],
      additional: [],
    };

    const uiData = profileToResumeData(fresherProfile);
    expect(uiData.experience).toHaveLength(0); // MUST be empty, not forced
    expect(uiData.internships).toHaveLength(1);
    expect(uiData.projects).toHaveLength(1);
    expect(uiData.education).toHaveLength(1);

    const reApplied = applyResumeDataToProfile(fresherProfile, {
      ...uiData,
      id: "fresher-1",
      name: "Sneha Patel - Fresher Resume",
      updatedAt: "Just now",
      atsScore: 78,
    });

    expect(reApplied.experience).toHaveLength(0); // Remains empty
    expect(reApplied.internships).toHaveLength(1);
    expect(reApplied.projects).toHaveLength(1);
    expect(reApplied.projects[0].name).toBe("Campus Event Manager");
  });
});
