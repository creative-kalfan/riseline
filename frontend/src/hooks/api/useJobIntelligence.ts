import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnalyzeJobIntelligence, useGetJobIntelligence } from "@/api/job-intelligence";

export function useAnalyzeJobIntelligenceMutation() {
  const api = useAnalyzeJobIntelligence();
  return useMutation({
    mutationFn: api,
  });
}

export function useJobIntelligenceQuery(jobId: string | undefined) {
  const api = useGetJobIntelligence();
  return useQuery({
    queryKey: ["job-intelligence", jobId],
    queryFn: () => api(jobId!),
    enabled: !!jobId,
  });
}
