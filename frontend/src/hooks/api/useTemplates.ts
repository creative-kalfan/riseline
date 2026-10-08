import { useQuery } from "@tanstack/react-query";
import { templateApi } from "../../api/templates";
import type { ResumeTemplate, ResumeTemplateListResponse } from "../../types/resume";

export const templateQueryKeys = {
  all: ["templates"] as const,
  list: ["templates", "list"] as const,
  detail: (id: string) => ["templates", "detail", id] as const,
};

export function useTemplates() {
  return useQuery<ResumeTemplateListResponse>({
    queryKey: templateQueryKeys.list,
    queryFn: () => templateApi.list(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useTemplate(id: string | null) {
  return useQuery<ResumeTemplate>({
    queryKey: templateQueryKeys.detail(id ?? ""),
    queryFn: () => templateApi.get(id as string),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 60,
  });
}
