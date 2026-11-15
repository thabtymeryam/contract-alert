"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { DashboardSummary } from "@/types";

export function useDashboardSummary() {
  return useQuery({
    // Under "alerts" so obligation and key-date changes (which invalidate alerts) refresh it too
    queryKey: ["alerts", "dashboard"],
    queryFn: () => apiFetch<DashboardSummary>("/dashboard/summary"),
  });
}
