import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { AuthLoadingSpinner } from "../auth/components/AuthLoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding · CareerOS" },
      { name: "description", content: "Complete your profile setup" },
    ],
  }),
  component: OnboardingPage,
});

const ONBOARDING_STEPS = [
  { id: 1, title: "Welcome", description: "Let's get started with your profile" },
  { id: 2, title: "Current Role", description: "Tell us about your current position" },
  { id: 3, title: "Target Role", description: "What role are you looking for?" },
  { id: 4, title: "Skills", description: "List your key skills" },
  { id: 5, title: "Experience", description: "Your work experience" },
  { id: 6, title: "Education", description: "Your educational background" },
  { id: 7, title: "Preferred Companies", description: "Companies you'd like to work for" },
  { id: 8, title: "Salary Expectations", description: "Your salary expectations" },
  { id: 9, title: "Notice Period", description: "When can you start?" },
  { id: 10, title: "Complete", description: "You're all set!" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, isProfileLoading, updateOnboardingStep, updateProfile, completeOnboarding } =
    useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for all onboarding fields
  const [formData, setFormData] = useState({
    currentRole: "",
    targetRole: "",
    skills: "",
    companies: "",
    salaryMin: "",
    noticePeriod: "",
  });

  // Clamp step to valid range 1-10, handle NaN/null/undefined
  const clampStep = (step: number) => {
    const n = Number(step);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(10, n));
  };

  // Load profile and set current step
  useEffect(() => {
    if (profile && !isProfileLoading) {
      const rawStep = profile.onboardingStep + 1;
      const clamped = clampStep(rawStep);
      setCurrentStep(clamped);
    }
  }, [profile, isProfileLoading]);

  const handleNext = async () => {
    // Save form data for the current step before advancing
    setIsSubmitting(true);
    try {
      const profileData: Record<string, unknown> = {};
      if (currentStep === 2 && formData.currentRole)
        profileData.current_role = formData.currentRole;
      if (currentStep === 3 && formData.targetRole) profileData.desired_role = formData.targetRole;
      if (currentStep === 4 && formData.skills)
        profileData.skills = formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      if (currentStep === 7 && formData.companies)
        profileData.preferred_companies = formData.companies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      if (currentStep === 8 && formData.salaryMin)
        profileData.salary_expectation_min = Number(formData.salaryMin);

      if (Object.keys(profileData).length > 0) {
        await updateProfile(profileData as any);
      }

      const nextStep = clampStep(currentStep + 1);
      if (nextStep !== currentStep) {
        await updateOnboardingStep(nextStep);
        setCurrentStep(nextStep);
      } else if (currentStep === 10) {
        await completeOnboarding();
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      console.error("Failed to save step:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding();
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProfileLoading) {
    return <AuthLoadingSpinner />;
  }

  // Guard against invalid currentStep - fallback to step 1
  const safeStep = clampStep(currentStep);
  const step = ONBOARDING_STEPS[safeStep - 1] ?? ONBOARDING_STEPS[0];
  const progress = (safeStep / 10) * 100;

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            Step {currentStep} of 10: {step.title}
          </CardTitle>
          <CardDescription>{step.description}</CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent>
          <OnboardingStep step={currentStep} formData={formData} setFormData={setFormData} />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
            Skip for now
          </Button>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {currentStep === 10 ? "Complete" : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function OnboardingStep({
  step,
  formData,
  setFormData,
}: {
  step: number;
  formData: {
    currentRole: string;
    targetRole: string;
    skills: string;
    companies: string;
    salaryMin: string;
    noticePeriod: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      currentRole: string;
      targetRole: string;
      skills: string;
      companies: string;
      salaryMin: string;
      noticePeriod: string;
    }>
  >;
}) {
  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  switch (step) {
    case 1:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Welcome to CareerOS! We'll help you set up your profile in just a few steps. This will
            help us provide personalized job recommendations and optimize your resume.
          </p>
        </div>
      );
    case 2:
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-role">Current Role</Label>
            <Input
              id="current-role"
              value={formData.currentRole}
              onChange={(e) => update("currentRole", e.target.value)}
              placeholder="e.g., Software Engineer"
            />
          </div>
        </div>
      );
    case 3:
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-role">Target Role</Label>
            <Input
              id="target-role"
              value={formData.targetRole}
              onChange={(e) => update("targetRole", e.target.value)}
              placeholder="e.g., Senior Product Manager"
            />
          </div>
        </div>
      );
    case 4:
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma separated)</Label>
            <Input
              id="skills"
              value={formData.skills}
              onChange={(e) => update("skills", e.target.value)}
              placeholder="e.g., React, TypeScript, Node.js"
            />
          </div>
        </div>
      );
    case 5:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You can add your work experience in the profile section after onboarding.
          </p>
        </div>
      );
    case 6:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You can add your education in the profile section after onboarding.
          </p>
        </div>
      );
    case 7:
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companies">Preferred Companies (comma separated)</Label>
            <Input
              id="companies"
              value={formData.companies}
              onChange={(e) => update("companies", e.target.value)}
              placeholder="e.g., Google, Microsoft, Apple"
            />
          </div>
        </div>
      );
    case 8:
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salary-min">Minimum Salary</Label>
            <Input
              id="salary-min"
              type="number"
              value={formData.salaryMin}
              onChange={(e) => update("salaryMin", e.target.value)}
              placeholder="e.g., 80000"
            />
          </div>
        </div>
      );
    case 9:
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notice-period">Notice Period (days)</Label>
            <Input
              id="notice-period"
              type="number"
              value={formData.noticePeriod}
              onChange={(e) => update("noticePeriod", e.target.value)}
              placeholder="e.g., 30"
            />
          </div>
        </div>
      );
    case 10:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You're all set! Click "Complete" to start using CareerOS.
          </p>
        </div>
      );
    default:
      return null;
  }
}
