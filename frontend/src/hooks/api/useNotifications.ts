import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../../api/notifications";
import type {
  NotificationRecord,
  NotificationPreferenceRecord,
  NotificationFilters,
} from "../../types/notification";

// Query keys
export const NOTIFICATIONS_QUERY_KEY = "notifications";
export const NOTIFICATIONS_UNREAD_KEY = "notifications-unread";
export const NOTIFICATIONS_PREFERENCES_KEY = "notification-preferences";

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, filters],
    queryFn: () => notificationsApi.getAll(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    select: (data) => data.notifications,
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: [NOTIFICATIONS_UNREAD_KEY],
    queryFn: () => notificationsApi.getUnread(),
    staleTime: 1000 * 60 * 1, // 1 minute
    select: (data) => data.notifications,
  });
}

export function useUnreadCount() {
  const { data: unread } = useUnreadNotifications();
  return unread?.length ?? 0;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onMutate: async (id: string) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      await queryClient.cancelQueries({ queryKey: [NOTIFICATIONS_UNREAD_KEY] });

      const previousAll = queryClient.getQueryData<NotificationRecord[]>([NOTIFICATIONS_QUERY_KEY]);
      const previousUnread = queryClient.getQueryData<NotificationRecord[]>([
        NOTIFICATIONS_UNREAD_KEY,
      ]);

      // Update all notifications
      queryClient.setQueryData<NotificationRecord[]>([NOTIFICATIONS_QUERY_KEY], (old) =>
        old?.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );

      // Remove from unread
      queryClient.setQueryData<NotificationRecord[]>([NOTIFICATIONS_UNREAD_KEY], (old) =>
        old?.filter((n) => n.id !== id),
      );

      return { previousAll, previousUnread };
    },
    onError: (_err, _id, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData([NOTIFICATIONS_QUERY_KEY], context.previousAll);
      }
      if (context?.previousUnread) {
        queryClient.setQueryData([NOTIFICATIONS_UNREAD_KEY], context.previousUnread);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_UNREAD_KEY] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      await queryClient.cancelQueries({ queryKey: [NOTIFICATIONS_UNREAD_KEY] });

      const previousAll = queryClient.getQueryData<NotificationRecord[]>([NOTIFICATIONS_QUERY_KEY]);

      // Mark all as read
      queryClient.setQueryData<NotificationRecord[]>([NOTIFICATIONS_QUERY_KEY], (old) =>
        old?.map((n) => ({ ...n, is_read: true })),
      );

      // Clear unread
      queryClient.setQueryData([NOTIFICATIONS_UNREAD_KEY], []);

      return { previousAll };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousAll) {
        queryClient.setQueryData([NOTIFICATIONS_QUERY_KEY], context.previousAll);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_UNREAD_KEY] });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: [NOTIFICATIONS_PREFERENCES_KEY],
    queryFn: () => notificationsApi.getPreferences(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data.preferences,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<NotificationPreferenceRecord>) =>
      notificationsApi.updatePreferences(updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: [NOTIFICATIONS_PREFERENCES_KEY] });

      const previous = queryClient.getQueryData<NotificationPreferenceRecord>([
        NOTIFICATIONS_PREFERENCES_KEY,
      ]);

      queryClient.setQueryData<NotificationPreferenceRecord>(
        [NOTIFICATIONS_PREFERENCES_KEY],
        (old) => ({ ...old, ...updates }) as NotificationPreferenceRecord,
      );

      return { previous };
    },
    onError: (_err, _updates, context) => {
      if (context?.previous) {
        queryClient.setQueryData([NOTIFICATIONS_PREFERENCES_KEY], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_PREFERENCES_KEY] });
    },
  });
}
