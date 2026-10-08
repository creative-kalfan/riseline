import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

export function useOriginalResumeFile() {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSignedUrl = useCallback(async (storagePath: string | null | undefined) => {
    if (!storagePath) {
      setSignedUrl(null);
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setSignedUrl(null);

    try {
      const { data, error: signedUrlError } = await supabase.storage
        .from("resumes")
        .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

      if (signedUrlError) {
        throw signedUrlError;
      }

      setSignedUrl(data.signedUrl);
      return data.signedUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate signed URL";
      setError(message);
      setSignedUrl(null);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearSignedUrl = useCallback(() => {
    setSignedUrl(null);
    setError(null);
  }, []);

  return {
    signedUrl,
    isGenerating,
    error,
    generateSignedUrl,
    clearSignedUrl,
  };
}
