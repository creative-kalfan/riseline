import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeApi } from "../../api/resume";
import type {
  ResumeData,
  ResumeListResponse,
  ResumeRecord,
  ParseResumeResponse,
  CompletenessResponseData,
} from "../../types/resume";

export const resumeQueryKeys = {
  all: ["resumes"] as const,
  list: ["resumes", "list"] as const,
  data: (id: string) => ["resumes", "data", id] as const,
  detail: (id: string) => ["resumes", "detail", id] as const,
  completeness: (id: string) => ["resumes", "completeness", id] as const,
};

export function useResumes() {
  return useQuery<ResumeListResponse>({
    queryKey: resumeQueryKeys.list,
    queryFn: () => resumeApi.getAll(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useResume(id: string | null) {
  return useQuery<ResumeData>({
    queryKey: resumeQueryKeys.data(id ?? ""),
    queryFn: () => resumeApi.getById(id as string),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useResumeDetail(id: string | null) {
  return useQuery<ResumeRecord>({
    queryKey: resumeQueryKeys.detail(id ?? ""),
    queryFn: () => resumeApi.getResumeDetail(id as string),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    refetchInterval: (query) => {
      const status = query.state.data?.parse_status;
      return status === "pending" || status === "processing" ? 2000 : false;
    },
  });
}

export function useCreateResume() {
  const queryClient = useQueryClient();
  return useMutation<ResumeData, Error, string>({
    mutationFn: (title: string) => resumeApi.create(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.list });
    },
  });
}

export function useUpdateResume() {
  const queryClient = useQueryClient();
  return useMutation<
    ResumeData,
    Error,
    { id: string; title?: string; content?: Record<string, unknown> }
  >({
    mutationFn: ({ id, ...data }) => resumeApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.list });
      queryClient.setQueryData(resumeQueryKeys.detail(data.id), data);
    },
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, { previous?: ResumeListResponse }>({
    mutationFn: (id: string) => resumeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.all });
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: resumeQueryKeys.list });
      const previous = queryClient.getQueryData<ResumeListResponse>(resumeQueryKeys.list);
      if (previous) {
        queryClient.setQueryData<ResumeListResponse>(resumeQueryKeys.list, {
          ...previous,
          resumes: previous.resumes.filter((r) => r.id !== id),
          total: previous.total - 1,
        });
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(resumeQueryKeys.list, context.previous);
      }
    },
  });
}

export function useParseResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resumeApi.parse(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(id) });
    },
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title, skipParse }: { file: File; title?: string; skipParse?: boolean }) =>
      resumeApi.upload(file, title, skipParse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.list });
    },
  });
}

export function useUpdateResumeContent() {
  const queryClient = useQueryClient();
  return useMutation<
    ResumeRecord,
    Error,
    { id: string; content: Record<string, unknown>; meta?: Record<string, unknown> }
  >({
    mutationFn: ({ id, content, meta }) => resumeApi.updateResumeContent(id, content, meta),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.list });
      queryClient.setQueryData(resumeQueryKeys.detail(data.id), data);
    },
  });
}

export function useResumeCompleteness(id: string | null) {
  return useQuery<CompletenessResponseData>({
    queryKey: resumeQueryKeys.completeness(id ?? ""),
    queryFn: () => resumeApi.getCompleteness(id as string),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}
