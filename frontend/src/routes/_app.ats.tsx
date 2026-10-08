import { createFileRoute, Navigate } from "@tanstack/react-router";

/**
 * Deprecated ATS Studio route.
 *
 * ATS match intelligence now lives exclusively in the Resume Studio left pane
 * (`src/components/resume/left-pane.tsx`), which renders ATS score rings,
 * keyword badges, and tailoring actions against the selected resume version.
 * Keep the old `/ats` URL working by redirecting to `/resumes` instead of
 * maintaining a second scoring surface.
 */
export const Route = createFileRoute("/_app/ats")({
  head: () => ({
    meta: [{ title: "Resume Studio · CareerOS" }],
  }),
  component: AtsRedirect,
});

function AtsRedirect() {
  return <Navigate to="/resumes" replace />;
}
