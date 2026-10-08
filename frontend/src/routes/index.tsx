import { createFileRoute } from "@tanstack/react-router";
import { LandingNav } from "../components/landing/LandingNav";
import { CinematicSceneController } from "../components/landing/CinematicSceneController";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareerOS — Career Intelligence & Safe Resume Optimization" },
      {
        name: "description",
        content:
          "Stop guessing what jobs want. CareerOS deconstructs target job requirements, diagnoses resume gaps, and creates truth-preserving optimized versions.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground selection:bg-primary/30 selection:text-foreground overflow-hidden">
      <LandingNav />
      <main className="flex-1 w-full h-full">
        <CinematicSceneController />
      </main>
    </div>
  );
}
