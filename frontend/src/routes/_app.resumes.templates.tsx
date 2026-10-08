import { createFileRoute } from "@tanstack/react-router";
import { ResumeTemplatesPage } from "@/components/resume/templates/resume-templates-page";

export const Route = createFileRoute("/_app/resumes/templates")({
  head: () => ({
    meta: [
      { title: "Resume Templates · CareerOS" },
      {
        name: "description",
        content: "Choose a professional resume template to showcase your career.",
      },
    ],
  }),
  component: () => <ResumeTemplatesPage />,
});
