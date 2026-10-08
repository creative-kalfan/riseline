import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../useAuth";
import { cn } from "@/lib/utils";

type OAuthProvider = "google" | "github";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.35.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.14c0 .3.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
};

/**
 * Social OAuth buttons for the auth pages. Triggers a Supabase
 * `signInWithOAuth` redirect; on return the AuthProvider's
 * `onAuthStateChange` listener establishes the session automatically.
 * Email/password flows are untouched.
 */
export function SocialAuthButtons({ className }: { className?: string }) {
  const { signInWithOAuth } = useAuth();
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSocialLogin = async (provider: OAuthProvider) => {
    if (pendingProvider) return;
    setPendingProvider(provider);
    setLocalError(null);
    try {
      await signInWithOAuth(provider);
      // On success the browser redirects to the provider — this component
      // unmounts and no further state update is needed.
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ||
            `Failed to sign in with ${provider}. Please try again.`;
      setLocalError(message);
      toast.error(message);
      setPendingProvider(null);
    }
  };

  const isPending = pendingProvider !== null;

  return (
    <div className={cn("space-y-4", className)}>
      {localError && (
        <div
          role="alert"
          className="rounded-xl border border-[#E4573D]/30 bg-[#E4573D]/10 px-3.5 py-2.5 text-xs text-[#E4573D] flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {(Object.keys(PROVIDER_LABEL) as OAuthProvider[]).map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => handleSocialLogin(provider)}
            disabled={isPending}
            aria-label={PROVIDER_LABEL[provider]}
            className="w-full h-11 inline-flex items-center justify-center gap-2.5 rounded-xl border border-[#302E29] bg-[#11110F] px-3.5 text-sm font-medium text-[#F3F0E8] transition-colors hover:border-[#315CFF]/50 hover:bg-[#1A1916] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {pendingProvider === provider ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : provider === "google" ? (
              <GoogleIcon className="w-4 h-4 shrink-0" />
            ) : (
              <GitHubIcon className="w-4 h-4 shrink-0" />
            )}
            <span>
              {pendingProvider === provider ? "Redirecting..." : PROVIDER_LABEL[provider]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-[#302E29]" />
        <span className="text-[11px] font-medium tracking-wider text-[#6E6B63]">
          OR CONTINUE WITH
        </span>
        <span className="h-px flex-1 bg-[#302E29]" />
      </div>
    </div>
  );
}
