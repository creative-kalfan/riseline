import { useMutation, useQueryClient } from "@tanstack/react-query";
import { atsApi } from "../../api/ats";

export const atsQueryKeys = {
  all: ["ats"] as const,
  analyze: (resumeId: string, versionId?: string) =>
    ["ats", "analyze", resumeId, versionId] as const,
};

export function useAnalyzeResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      resumeId: string;
      versionId?: string;
      jobDescription: string;
      jobTitle?: string;
      company?: string;
      persist?: boolean;
    }) => atsApi.analyze(data),
    onSuccess: (data, variables) => {
      if (data.report) {
        queryClient.setQueryData(
          atsQueryKeys.analyze(variables.resumeId, variables.versionId),
          data,
        );
      }
    },
  });
}
