"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { Notification } from "@/types";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (unreadOnly: boolean) => [...notificationKeys.all, "list", unreadOnly] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

// Notifications are polled; there is no push channel in v1
const POLL_MS = 60_000;

export function useNotifications(unreadOnly = false, limit = 50) {
  return useQuery({
    queryKey: [...notificationKeys.list(unreadOnly), limit],
    queryFn: () => apiFetch<Notification[]>("/notifications/", { query: { unread_only: unreadOnly, limit } }),
    refetchInterval: POLL_MS,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => apiFetch<{ count: number }>("/notifications/unread-count"),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    select: (data) => data.count,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<Notification>(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ updated: number }>("/notifications/read-all", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
