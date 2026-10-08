export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  RESUME: {
    LIST: "/resume",
    EDITOR: "/resume/:id",
    NEW: "/resume/new",
  },
  ATS: {
    // Deprecated: ATS Studio route now redirects to Resume Studio, which owns
    // all match intelligence in its left pane. Kept for backward-compat links.
    ANALYZER: "/resumes",
    HISTORY: "/ats-history",
  },
  JOBS: {
    SEARCH: "/jobs",
    SAVED: "/jobs/saved",
  },
  APPLICATIONS: {
    LIST: "/applications",
    DETAIL: "/applications/:id",
  },
  COPILOT: "/copilot",
  SETTINGS: "/settings",
  PROFILE: "/profile",
} as const;
