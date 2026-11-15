"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { Severity } from "@/lib/severity";
import type { AlertItem } from "@/types";

export const alertKeys = {
  all: ["alerts"] as const,
  upcoming: (severity?: Severity) => [...alertKeys.all, "upcoming", severity ?? "all"] as const,
};

/** Upcoming key dates and open obligations (next 90 days, plus overdue obligations), scoped by role. */
export function useUpcomingAlerts() {
  return useQuery({
    queryKey: alertKeys.upcoming(),
    queryFn: () => apiFetch<AlertItem[]>("/alerts/upcoming"),
  });
}

/** Admin: run the daily alert job now (emails + notifications). */
export function useRunAlerts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ sent: number; notified: number }>("/alerts/run", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
