import { describe, expect, it } from "vitest";
import {
  stripHtml,
  sanitizeDescription,
  resolveSourceProvenance,
  getMatchTier,
  adaptJob,
  formatSalary,
} from "../jobs";

describe("Job Intelligence Redesign - Sanitization & Helpers", () => {
  describe("stripHtml and sanitizeDescription", () => {
    it("strips raw HTML tags into clean plain text", () => {
      const raw = "<h2><strong>Who we are</strong></h2><p>We build cool stuff &amp; more.</p>";
      const clean = stripHtml(raw);
      expect(clean).toBe("Who we are We build cool stuff & more.");
    });

    it("handles double-escaped entities like &nbsp; and &lt;div&gt;", () => {
      const raw = "<div>Hello&nbsp;World! &lt;script&gt;alert(1)&lt;/script&gt;</div>";
      const clean = stripHtml(raw);
      expect(clean).not.toContain("&nbsp;");
      expect(clean).toContain("Hello World!");
    });

    it("sanitizeDescription keeps safe markup while stripping dangerous scripts", () => {
      const raw = `<p>Welcome to <strong>Acme Inc</strong>.</p><script>alert('xss')</script><a href="https://example.com" onclick="steal()">Link</a>`;
      const sanitized = sanitizeDescription(raw);
      expect(sanitized).toContain("<p>Welcome to <strong>Acme Inc</strong>.</p>");
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("alert('xss')");
      expect(sanitized).not.toContain('onclick="steal()"');
    });
  });

  describe("resolveSourceProvenance", () => {
    it("identifies official career site from platform name or url", () => {
      const res1 = resolveSourceProvenance("ashby_crawler", "https://jobs.ashbyhq.com/stripe");
      expect(res1.verified).toBe(true);
      expect(res1.label).toBe("Official Career Site");

      const res2 = resolveSourceProvenance(null, "https://stripe.com/careers/jobs/123");
      expect(res2.verified).toBe(true);
      expect(res2.label).toBe("Official Career Site");
    });

    it("identifies YC startup opportunities", () => {
      const res = resolveSourceProvenance(
        "yc_ingest",
        "https://ycombinator.com/companies/stripe/jobs",
      );
      expect(res.verified).toBe(true);
      expect(res.label).toBe("YC Opportunity");
    });

    it("identifies direct company postings", () => {
      const res = resolveSourceProvenance("direct_company", null);
      expect(res.verified).toBe(true);
      expect(res.label).toBe("Direct Posting");
    });

    it("identifies aggregated sources gracefully", () => {
      const res = resolveSourceProvenance("adzuna", "https://adzuna.com/job/123");
      expect(res.verified).toBe(false);
      expect(res.label).toBe("Aggregated Source");
    });
  });

  describe("getMatchTier", () => {
    it("assigns strong tier to score >= 85", () => {
      const tier = getMatchTier(90);
      expect(tier.tier).toBe("strong");
      expect(tier.label).toBe("Strong match");
      expect(tier.badgeClass).toContain("success");
    });

    it("assigns good tier to score 70-84", () => {
      const tier = getMatchTier(78);
      expect(tier.tier).toBe("good");
      expect(tier.label).toBe("Good match");
      expect(tier.badgeClass).toContain("primary");
    });

    it("assigns moderate tier to score 50-69", () => {
      const tier = getMatchTier(60);
      expect(tier.tier).toBe("moderate");
      expect(tier.label).toBe("Moderate fit");
      expect(tier.badgeClass).toContain("warning");
    });

    it("assigns growth tier to score < 50", () => {
      const tier = getMatchTier(35);
      expect(tier.tier).toBe("growth");
      expect(tier.label).toBe("Growth role");
    });
  });

  describe("adaptJob", () => {
    it("properly adapts normalized job with real logo, provenance, and sanitized description", () => {
      const rawJob = {
        title: "Senior Backend Engineer",
        company_name: "Stripe",
        location: "San Francisco, CA",
        description: "<p>Lead engineering teams building global payments infrastructure.</p>",
        skills: ["TypeScript", "Go", "Postgres"],
        apply_url: "https://stripe.com/careers/jobs/456",
        source_platform: "firecrawl_crawler",
        salary: "$180k - $240k",
        match: {
          overall: 92,
          skill_match: 95,
          experience_match: 90,
          location_match: 100,
          salary_match: 85,
          missing_skills: ["Rust"],
        },
      };

      const job = adaptJob(rawJob as never);

      expect(job.role).toBe("Senior Backend Engineer");
      expect(job.company).toBe("Stripe");
      expect(job.companyLogoUrl).toBeDefined();
      expect(job.sourceProvenance?.label).toBe("Official Career Site");
      expect(job.sourceProvenance?.verified).toBe(true);
      expect(job.overview).toContain("<p>Lead engineering teams");
      expect(job.aiMatch).toBe(92);
      expect(job.matchedSkills).toContain("TypeScript");
      expect(job.missingSkills).toContain("Rust");
      expect(formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)).toBe("$180k – $240k");
    });

    it("prioritizes posted_at over posted_date and formats valid dates", () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const job = adaptJob({
        title: "Staff Engineer",
        company: "Stripe",
        posted_at: yesterday,
        posted_date: "2020-01-01T00:00:00Z",
      } as never);

      expect(job.postedAt).toBe("1d ago");
      expect(job.postedDaysAgo).toBe(1);
    });

    it("displays Date unavailable only when genuine null, empty, or unparseable", () => {
      const jobWithNull = adaptJob({
        title: "Staff Engineer",
        company: "Stripe",
        posted_at: null,
        posted_date: null,
      } as never);
      expect(jobWithNull.postedAt).toBe("Date unavailable");
      expect(jobWithNull.postedDaysAgo).toBe(-1);

      const jobWithEmpty = adaptJob({
        title: "Staff Engineer",
        company: "Stripe",
        posted_at: "   ",
      } as never);
      expect(jobWithEmpty.postedAt).toBe("Date unavailable");

      const jobWithInvalid = adaptJob({
        title: "Staff Engineer",
        company: "Stripe",
        posted_at: "not-a-date",
      } as never);
      expect(jobWithInvalid.postedAt).toBe("Date unavailable");
    });
  });
});
