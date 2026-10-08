"use client";

import { useState, useCallback, useEffect, type DragEvent, type ChangeEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, UploadCloud, Loader2, AlertTriangle, RefreshCw, PenLine } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  useUploadResume,
  useParseResume,
  useResumeDetail,
  resumeQueryKeys,
} from "@/hooks/api/useResumes";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];

function getFileError(file: File): string | null {
  if (
    !ACCEPTED_TYPES.includes(file.type) &&
    !ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
  ) {
    return "Invalid file type. Please upload PDF or DOCX.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
  }
  return null;
}

type UploadState = "idle" | "uploading" | "parsing" | "success" | "error";

type ResumeUploadCompleted = (resumeId: string) => void;
type ResumeUploadFailed = () => void;

type ResumeUploadProps = {
  onResumeUploaded?: ResumeUploadCompleted;
  /**
   * Called when the upload/register flow fails. Lets the parent keep the
   * Start Optimization CTA disabled while there is an active upload failure.
   */
  onUploadError?: ResumeUploadFailed;
  /**
   * When embedded, render only a self-contained panel card (suitable for a
   * shared two-column grid) instead of a full standalone page with its own
   * page header and back navigation.
   */
  embedded?: boolean;
};

export function ResumeUpload({
  onResumeUploaded,
  onUploadError,
  embedded = false,
}: ResumeUploadProps) {
  const navigate = useNavigate();
  const uploadMutation = useUploadResume();
  const parseMutation = useParseResume();
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { data: record } = useResumeDetail(resumeId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (uploadState !== "parsing") return;
    const status = record?.parse_status;
    if (status === "completed" || status === "failed") {
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId as string) });
      setUploadState(status === "completed" ? "success" : "error");
      if (status === "failed") {
        setError(record?.meta?.parse_error ? String(record.meta.parse_error) : "Parsing failed.");
      }
    }
  }, [record, uploadState, queryClient, resumeId]);

  const startUpload = useCallback(
    async (selectedFile: File) => {
      setUploadState("uploading");
      setError(null);
      setProgress(10);

      try {
        const uploadResult = await uploadMutation.mutateAsync({
          file: selectedFile,
          title: selectedFile.name.replace(/\.[^/.]+$/, ""),
        });
        const newResumeId = uploadResult.resume.id;
        setResumeId(newResumeId);
        setProgress(50);

        // Phase 3: Backend parsing happens silently in background.
        // We don't wait for parse status here; instead we immediately
        // transition to the processing state and let the backend handle it.
        setUploadState("parsing");

        // Notify parent that resume upload is complete. When a parent handler
        // is provided, it owns navigation so it can carry job metadata on the
        // URL. Otherwise fall back to navigating to the Studio ourselves after
        // a small delay to let the backend start the parsing job.
        if (onResumeUploaded) {
          onResumeUploaded(newResumeId);
        } else {
          setTimeout(() => {
            navigate({ to: "/resumes/$id", params: { id: newResumeId } });
          }, 500);
        }
      } catch (error) {
        const err = error as { code?: string };
        const errorCode = err?.code;
        setProgress(100);
        setUploadState("error");
        if (errorCode === "STORAGE_UPLOAD_FAILED") {
          setError("Couldn't upload your resume to secure storage.");
        } else if (errorCode === "REGISTER_FAILED") {
          setError("Your file was uploaded, but we couldn't process the resume. Please try again.");
        } else {
          setError("Upload failed. Please try again.");
        }
        onUploadError?.();
      }
    },
    [uploadMutation, navigate, onResumeUploaded, onUploadError],
  );

  // Single shared selection path used by both browse and drag/drop. Selecting
  // or dropping a file IS the attachment action: validate, stage the file, and
  // start the existing upload/register flow immediately. There is no separate
  // "Upload Resume" confirmation step.
  const handleFileSelected = useCallback(
    (selected: File | null) => {
      if (!selected) return;
      const fileError = getFileError(selected);
      if (fileError) {
        setError(fileError);
        setFile(null);
        setResumeId(null);
        setProgress(0);
        setUploadState("idle");
        return;
      }
      setError(null);
      setFile(selected);
      setResumeId(null);
      setProgress(0);
      void startUpload(selected);
    },
    [startUpload],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      handleFileSelected(e.dataTransfer.files[0] || null);
    },
    [handleFileSelected],
  );

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      handleFileSelected(e.target.files?.[0] || null);
    },
    [handleFileSelected],
  );

  const clearFile = useCallback(() => {
    setFile(null);
    setError(null);
    setProgress(0);
    setResumeId(null);
    setUploadState("idle");
  }, []);

  const retryParse = useCallback(async () => {
    if (!resumeId) return;
    setUploadState("parsing");
    setError(null);
    setProgress(10);
    try {
      await parseMutation.mutateAsync(resumeId);
      setProgress(100);
      setUploadState("success");
      toast.success("Resume parsed successfully");
      setTimeout(() => {
        navigate({ to: "/resumes/$id", params: { id: resumeId } });
      }, 800);
    } catch {
      setUploadState("error");
      setError("Parsing failed again. Please try a different file.");
    }
  }, [resumeId, navigate, parseMutation]);

  useEffect(() => {
    if (uploadState !== "parsing") return;
    const status = record?.parse_status;
    if (!status || (status !== "pending" && status !== "processing")) return;
    const timer = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId as string) });
    }, 4000);
    return () => clearInterval(timer);
  }, [record?.parse_status, uploadState, queryClient, resumeId]);

  const isProcessing = uploadState === "uploading" || uploadState === "parsing";

  const cardBody = (
    <>
      {uploadState === "idle" && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={() => document.getElementById("resume-file-input")?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/60 bg-surface-elevated/20 p-10 text-center transition hover:border-primary/40 hover:bg-surface-elevated/40",
            error && "border-destructive/60",
          )}
        >
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/25 to-accent/25 text-primary">
            <UploadCloud className="h-7 w-7" />
          </div>
          <div>
            <div className="text-sm font-medium">Drag & drop your resume here</div>
            <div className="mt-1 text-xs text-muted-foreground">
              or click to browse from your device
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">PDF or DOCX, max 10MB</div>
          <input
            id="resume-file-input"
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={onInputChange}
          />
        </div>
      )}

      {file && (uploadState === "uploading" || uploadState === "parsing") && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-elevated/30 p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{file.name}</div>
              <div className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {uploadState === "uploading" ? "Uploading your resume..." : "Parsing your resume..."}
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {uploadState === "success" && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success">
            <FileText className="h-6 w-6" />
          </div>
          <div className="text-sm font-medium">Upload successful! Redirecting...</div>
        </div>
      )}

      {uploadState === "error" && (
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <div className="text-sm font-medium text-destructive">Upload failed</div>
              <div className="mt-1 text-xs text-muted-foreground">{error}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {resumeId && (
              <Button variant="outline" onClick={retryParse} className="flex-1 rounded-xl">
                <RefreshCw className="mr-1.5 h-4 w-4" /> Retry Parsing
              </Button>
            )}
            <Button variant="outline" onClick={clearFile} className="flex-1 rounded-xl">
              Upload Another
            </Button>
            <Button
              onClick={() => navigate({ to: "/resumes/setup", search: { mode: "build" } })}
              className="flex-1 rounded-xl shadow-[var(--shadow-glow)]"
            >
              <PenLine className="mr-1.5 h-4 w-4" /> Build Manually
            </Button>
          </div>
        </div>
      )}

      {error && uploadState === "idle" && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="text-xs text-destructive">{error}</div>
        </div>
      )}
    </>
  );

  const pageHeader = (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Upload Your Resume</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload your existing resume and we&apos;ll extract your information automatically.
      </p>
    </>
  );

  return embedded ? (
    <div className="h-full">
      <Card className="glass flex h-full flex-col rounded-2xl border-border/60 p-6">
        <div className="mb-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <UploadCloud className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold tracking-tight">Upload Your Resume</h2>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Upload your existing resume and we&apos;ll extract your information automatically.
          </p>
        </div>
        {cardBody}
      </Card>
    </div>
  ) : (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <div>{pageHeader}</div>
      <Card className="glass rounded-2xl border-border/60 p-6">{cardBody}</Card>
      <Button variant="ghost" onClick={() => navigate({ to: "/resumes/setup" })} className="w-full">
        Back to options
      </Button>
    </div>
  );
}
