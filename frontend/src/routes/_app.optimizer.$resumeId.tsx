import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";

/**
 * Legacy optimizer page. It accepted suggestions against the immutable master
 * resume in local state only - it could never produce a real document artifact,
 * so its "success" was fake by construction. All optimization now lives in the
 * Resume Studio (/resumes/:id) which routes every apply through the canonical
 * document-operation pipeline (derived version -> artifact -> new version).
 * Redirect to keep the old URL working without the fake path.
 */
export const Route = createFileRoute("/_app/optimizer/$resumeId")({
  head: () => ({
    meta: [{ title: "Resume Studio · CareerOS" }],
  }),
  component: OptimizerRedirect,
});

function OptimizerRedirect() {
  const { resumeId } = useParams({ from: "/_app/optimizer/$resumeId" });
  return <Navigate to="/resumes/$id" params={{ id: resumeId }} replace />;
}
