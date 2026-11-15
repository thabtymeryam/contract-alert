"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { detailsKeys } from "@/features/extraction/api";
import { apiFetch } from "@/lib/api-client";
import type { Obligation } from "@/types";

export type ObligationStatus = "PENDING" | "COMPLETED" | "OVERDUE";

export type ObligationFilters = {
  contract_id?: number;
  /** "me" or a user id */
  assigned_to?: "me" | number;
  status?: "pending" | "completed" | "overdue";
};

export const obligationKeys = {
  all: ["obligations"] as const,
  list: (filters: ObligationFilters) => [...obligationKeys.all, "list", filters] as const,
};

export function useObligations(filters: ObligationFilters, enabled = true) {
  return useQuery({
    queryKey: obligationKeys.list(filters),
    queryFn: () => apiFetch<Obligation[]>("/obligations/", { query: filters }),
    enabled,
  });
}

/** Obligations show up on the contract page, the obligations page and the dashboard: refresh all of them. */
function useInvalidateObligations() {
  const queryClient = useQueryClient();
  return (contractId: number) => {
    queryClient.invalidateQueries({ queryKey: obligationKeys.all });
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
    queryClient.invalidateQueries({ queryKey: detailsKeys.detail(contractId) });
  };
}

export type ObligationInput = {
  title: string;
  description: string | null;
  obligation_type: string | null;
  frequency: string | null;
  due_date: string | null;
  responsible_user_id: number | null;
};

export function useSaveObligation(contractId: number) {
  const invalidate = useInvalidateObligations();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: ObligationInput }) =>
      id
        ? apiFetch<Obligation>(`/obligations/${id}`, { method: "PUT", json: data })
        : apiFetch<Obligation>("/obligations/", { method: "POST", json: { ...data, contract_id: contractId } }),
    onSuccess: () => invalidate(contractId),
  });
}

export function useSetObligationStatus() {
  const invalidate = useInvalidateObligations();
  return useMutation({
    mutationFn: ({ obligation, completed }: { obligation: Obligation; completed: boolean }) =>
      apiFetch<Obligation>(`/obligations/${obligation.id}`, {
        method: "PUT",
        json: { status: completed ? "COMPLETED" : "PENDING" },
      }),
    onSuccess: (o) => invalidate(o.contract_id),
  });
}

export function useDeleteObligation(contractId: number) {
  const invalidate = useInvalidateObligations();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/obligations/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(contractId),
  });
}
