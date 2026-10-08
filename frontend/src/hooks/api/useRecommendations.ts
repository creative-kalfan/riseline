import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recommendationsApi } from "@/api/recommendations";
import type { Recommendation, RecommendationListParams } from "@/api/recommendations";

export function useRecommendations(params?: RecommendationListParams) {
  return useQuery({
    queryKey: ["recommendations", params],
    queryFn: () => recommendationsApi.getRecommendations(params),
  });
}

export function useTopRecommendations(limit = 5) {
  return useQuery({
    queryKey: ["recommendations", "top", limit],
    queryFn: () => recommendationsApi.getTopRecommendations(limit),
  });
}

export function useRefreshRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recommendationsApi.refreshRecommendations(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}

export function useSaveRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recommendationsApi.saveRecommendation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}

export function useDismissRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recommendationsApi.dismissRecommendation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}
