"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { contractKeys } from "@/features/contracts/api";
import { apiFetch } from "@/lib/api-client";
import type { Clause, Contract, ContractDetails, ContractEvent, Party } from "@/types";

export const detailsKeys = {
  detail: (contractId: number) => ["contracts", "details", contractId] as const,
};

/** Contract + everything extracted from it (parties, clauses, events, obligations, payments, penalties). */
export function useContractDetails(contractId: number) {
  return useQuery({
    queryKey: detailsKeys.detail(contractId),
    queryFn: () => apiFetch<ContractDetails>(`/extraction/${contractId}/details`),
  });
}

export function useStartExtraction(contractId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<Contract>(`/extraction/${contractId}/extract`, { method: "POST" }),
    onSuccess: (contract) => queryClient.setQueryData(contractKeys.detail(contractId), contract),
  });
}

/**
 * Polls the contract while extraction runs. When it finishes, refreshes the
 * extracted data and calls onFinish with the final status.
 */
export function useExtractionPolling(
  contract: Contract | undefined,
  onFinish: (status: "done" | "failed", contract: Contract) => void,
) {
  const queryClient = useQueryClient();
  const running = contract?.extraction_status === "running";
  const wasRunning = useRef(running);

  useQuery({
    queryKey: contractKeys.detail(contract?.id ?? 0),
    queryFn: () => apiFetch<Contract>(`/contracts/${contract!.id}`),
    enabled: running,
    refetchInterval: running ? 3000 : false,
  });

  useEffect(() => {
    if (!contract) return;
    if (wasRunning.current && !running) {
      queryClient.invalidateQueries({ queryKey: detailsKeys.detail(contract.id) });
      queryClient.invalidateQueries({ queryKey: contractKeys.list() });
      if (contract.extraction_status === "done" || contract.extraction_status === "failed") {
        onFinish(contract.extraction_status, contract);
      }
    }
    wasRunning.current = running;
  }, [running, contract, queryClient, onFinish]);
}

// --- Editing extracted items (owner or admin) ---

type Resource = "clauses" | "events" | "parties";
type ItemFor<R extends Resource> = R extends "clauses" ? Clause : R extends "events" ? ContractEvent : Party;

export function useSaveItem<R extends Resource>(resource: R, contractId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Record<string, unknown> }) =>
      id
        ? apiFetch<ItemFor<R>>(`/${resource}/${id}`, { method: "PUT", json: data })
        : apiFetch<ItemFor<R>>(`/${resource}/`, { method: "POST", json: { ...data, contract_id: contractId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailsKeys.detail(contractId) });
      // Key dates feed the alerts list
      if (resource === "events") queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useDeleteItem(resource: Resource, contractId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/${resource}/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: detailsKeys.detail(contractId) }),
  });
}
