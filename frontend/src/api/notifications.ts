import { request } from "../utils/request";
import { API_ENDPOINTS } from "../constants/api";
import type {
  NotificationRecord,
  NotificationPreferenceRecord,
  NotificationListResponse,
  NotificationFilters,
} from "../types/notification";

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

export type NotificationsApi = {
  getAll: (filters?: NotificationFilters) => Promise<NotificationListResponse>;
  getUnread: () => Promise<NotificationListResponse>;
  markAsRead: (id: string) => Promise<{ notification: NotificationRecord }>;
  markAllAsRead: () => Promise<{ notifications: NotificationRecord[] }>;
  getPreferences: () => Promise<{ preferences: NotificationPreferenceRecord }>;
  updatePreferences: (
    updates: Partial<NotificationPreferenceRecord>,
  ) => Promise<{ preferences: NotificationPreferenceRecord }>;
};

// Backend response envelope: { success, data, meta? }
type BackendResponse<T> = {
  success: boolean;
  data: T;
};

export const notificationsApi: NotificationsApi = {
  getAll: async (filters?: NotificationFilters) => {
    const params = new URLSearchParams();
    if (filters?.isRead !== undefined) params.set("isRead", String(filters.isRead));
    if (filters?.channel) params.set("channel", filters.channel);
    if (filters?.type) params.set("type", filters.type);
    if (filters?.limit) params.set("limit", String(filters.limit));
    const qs = params.toString();
    const res = await request<BackendResponse<NotificationListResponse>>({
      method: "GET",
      path: `${API_ENDPOINTS.NOTIFICATIONS.LIST}${qs ? `?${qs}` : ""}`,
    });
    return res.data;
  },

  getUnread: async () => {
    const res = await request<BackendResponse<NotificationListResponse>>({
      method: "GET",
      path: `${API_ENDPOINTS.NOTIFICATIONS.LIST}?isRead=false`,
    });
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await request<BackendResponse<{ notification: NotificationRecord }>>({
      method: "POST",
      path: API_ENDPOINTS.NOTIFICATIONS.MARK_READ,
      body: { notificationId: id },
    });
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await request<BackendResponse<{ notifications: NotificationRecord[] }>>({
      method: "POST",
      path: API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
    });
    return res.data;
  },

  getPreferences: async () => {
    const res = await request<BackendResponse<{ preferences: NotificationPreferenceRecord }>>({
      method: "GET",
      path: API_ENDPOINTS.NOTIFICATIONS.PREFERENCES,
    });
    return res.data;
  },

  updatePreferences: async (updates: Partial<NotificationPreferenceRecord>) => {
    const res = await request<BackendResponse<{ preferences: NotificationPreferenceRecord }>>({
      method: "POST",
      path: API_ENDPOINTS.NOTIFICATIONS.PREFERENCES,
      body: updates,
    });
    return res.data;
  },
};
