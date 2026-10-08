import { describe, it, expect } from "vitest";
import {
  transformApplication,
  transformApplications,
  computeStats,
  getCalendarEvents,
  groupByStage,
  searchApplications,
  filterApplications,
} from "../applications";
import type { Application } from "../../types/application";

const mockRawApplication: Application = {
  id: "app-1",
  user_id: "user-1",
  job_id: "job-1",
  job_title: "Senior Backend Engineer",
  company_name: "Stripe",
  status: "interview",
  application_date: "2026-09-01T10:00:00Z",
  notes: "Referred by Alice",
  location: "Remote - US",
  salary: "$180,000 - $220,000",
  match_score: 92,
  favorite: true,
  archived: false,
  source_url: "https://stripe.com/jobs/123",
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-02T14:00:00Z",
  interviews: [
    {
      id: "iv-1",
      application_id: "app-1",
      name: "System Design",
      scheduled_at: "2026-09-10T15:00:00Z",
      status: "scheduled",
      interviewer: "Staff Engineer",
      notes: "Focus on distributed queues",
    },
  ],
  assessments: [
    {
      id: "as-1",
      application_id: "app-1",
      name: "Architecture Challenge",
      due_at: "2026-09-08T18:00:00Z",
      status: "pending",
      notes: "Submit repo link",
      result: null,
    },
  ],
  contacts: [
    {
      id: "ct-1",
      application_id: "app-1",
      name: "Alice Recruiter",
      role: "Lead Tech Recruiter",
      email: "alice@stripe.com",
      phone: "+1-555-0199",
      notes: null,
    },
  ],
  follow_ups: [
    {
      id: "fu-1",
      application_id: "app-1",
      title: "Send updated portfolio",
      due_at: "2026-09-06T12:00:00Z",
      status: "pending",
      notes: "Include latest system design diagrams",
    },
  ],
  events: [
    {
      id: "ev-1",
      application_id: "app-1",
      event_type: "application_created",
      title: "Application started",
      detail: "Tracking Senior Backend Engineer at Stripe",
      created_at: "2026-09-01T10:00:00Z",
    },
    {
      id: "ev-2",
      application_id: "app-1",
      event_type: "status_changed",
      title: "Stage changed to interview",
      detail: "Moved from screening to interview",
      created_at: "2026-09-02T14:00:00Z",
    },
  ],
  attachments: [
    {
      id: "att-1",
      name: "Resume_v2.pdf",
      kind: "resume",
      storage_path: "resumes/user-1/v2.pdf",
    },
  ],
  next_action: {
    label: "Prepare for interview",
    urgency: "soon",
  },
  progress: 60,
};

describe("Application Tracking Data Layer", () => {
  it("transforms raw backend application into ApplicationUI cleanly", () => {
    const ui = transformApplication(mockRawApplication);

    expect(ui.id).toBe("app-1");
    expect(ui.company).toBe("Stripe");
    expect(ui.role).toBe("Senior Backend Engineer");
    expect(ui.stage).toBe("interview");
    expect(ui.progress).toBe(60);
    expect(ui.match).toBe(92);
    expect(ui.favorite).toBe(true);
    expect(ui.location).toBe("Remote - US");
    expect(ui.salary).toBe("$180,000 - $220,000");

    // Children transformations
    expect(ui.interviews).toHaveLength(1);
    expect(ui.interviews[0].name).toBe("System Design");
    expect(ui.interviews[0].scheduledAt).toBe("2026-09-10T15:00:00Z");

    expect(ui.assessments).toHaveLength(1);
    expect(ui.assessments[0].label).toBe("Architecture Challenge");
    expect(ui.assessments[0].dueAt).toBe("2026-09-08T18:00:00Z");

    expect(ui.followUps).toHaveLength(1);
    expect(ui.followUps[0].title).toBe("Send updated portfolio");
    expect(ui.followUps[0].dueAt).toBe("2026-09-06T12:00:00Z");

    expect(ui.contacts).toHaveLength(1);
    expect(ui.recruiter?.name).toBe("Alice Recruiter");
    expect(ui.recruiter?.role).toBe("Lead Tech Recruiter");

    // History
    expect(ui.history).toHaveLength(2);
    expect(ui.history[1].title).toBe("Stage changed to interview");

    // Attachments
    expect(ui.attachments).toHaveLength(1);
    expect(ui.attachments[0].name).toBe("Resume_v2.pdf");
  });

  it("handles archived application mapping", () => {
    const archivedApp: Application = {
      ...mockRawApplication,
      id: "app-archived",
      archived: true,
    };
    const ui = transformApplication(archivedApp);
    expect(ui.stage).toBe("archived");
  });

  it("derives calendar events from scheduled interviews, assessments, and follow-ups", () => {
    const apps = transformApplications([mockRawApplication]);
    const events = getCalendarEvents(apps);

    expect(events.length).toBeGreaterThanOrEqual(3);

    const ivEvent = events.find((e) => e.kind === "interview");
    expect(ivEvent).toBeDefined();
    expect(ivEvent?.company).toBe("Stripe");
    expect(ivEvent?.title).toBe("System Design");

    const asEvent = events.find((e) => e.kind === "assessment");
    expect(asEvent).toBeDefined();
    expect(asEvent?.company).toBe("Stripe");
    expect(asEvent?.title).toBe("Architecture Challenge");

    const fuEvent = events.find((e) => e.kind === "followup");
    expect(fuEvent).toBeDefined();
    expect(fuEvent?.company).toBe("Stripe");
    expect(fuEvent?.title).toBe("Send updated portfolio");
  });

  it("calculates statistics accurately without false 100% on zero samples", () => {
    // Zero sample test
    const zeroStats = computeStats([]);
    expect(zeroStats.applications).toBe(0);
    expect(zeroStats.interviewRate).toBe(0);
    expect(zeroStats.offerRate).toBe(0);
    expect(zeroStats.acceptanceRate).toBe(0);

    // Single active application in interview stage
    const ui = transformApplication(mockRawApplication);
    const stats = computeStats([ui]);

    expect(stats.applications).toBe(1);
    expect(stats.interviewRate).toBe(100);
    expect(stats.offerRate).toBe(0); // 0 offers / 1 interview = 0%
    expect(stats.acceptanceRate).toBe(0); // 0 accepted / 0 offers = 0%
  });

  it("groups applications by stage correctly", () => {
    const app1 = transformApplication(mockRawApplication);
    const app2 = transformApplication({
      ...mockRawApplication,
      id: "app-2",
      status: "applied",
    });
    const groups = groupByStage([app1, app2]);

    expect(groups.interview).toHaveLength(1);
    expect(groups.interview[0].id).toBe("app-1");
    expect(groups.applied).toHaveLength(1);
    expect(groups.applied[0].id).toBe("app-2");
    expect(groups.offer).toHaveLength(0);
  });

  it("filters and searches applications accurately", () => {
    const app1 = transformApplication(mockRawApplication);
    const app2 = transformApplication({
      ...mockRawApplication,
      id: "app-2",
      company_name: "Google",
      job_title: "Staff Frontend Architect",
      status: "applied",
      favorite: false,
    });
    const list = [app1, app2];

    // Search
    expect(searchApplications(list, "stripe")).toHaveLength(1);
    expect(searchApplications(list, "Google")).toHaveLength(1);
    expect(searchApplications(list, "frontend")).toHaveLength(1);
    expect(searchApplications(list, "nonexistent")).toHaveLength(0);

    // Filter by favorites
    const favs = filterApplications(list, "bookmarks", true, []);
    expect(favs).toHaveLength(1);
    expect(favs[0].company).toBe("Stripe");
  });
});
