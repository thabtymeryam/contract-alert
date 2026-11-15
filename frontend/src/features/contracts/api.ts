"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { Contract } from "@/types";

import type { toContractPayload } from "./contract-form";

export type ContractPayload = ReturnType<typeof toContractPayload>;

export const contractKeys = {
  all: ["contracts"] as const,
  list: () => [...contractKeys.all, "list"] as const,
  detail: (id: number) => [...contractKeys.all, "detail", id] as const,
};

/** Published path of the PDF, streamed through the authenticated proxy. */
export const contractFileUrl = (id: number) => `/api/contracts/${id}/file`;

/** "uploads/contracts/3f2a…_Lease.pdf" -> "Lease.pdf" */
export function fileDisplayName(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  const base = filePath.split("/").pop() ?? filePath;
  return base.replace(/^[0-9a-f]{32}_/, "");
}

export function useContracts() {
  return useQuery({
    queryKey: contractKeys.list(),
    queryFn: () => apiFetch<Contract[]>("/contracts/"),
  });
}

export function useContract(id: number) {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => apiFetch<Contract>(`/contracts/${id}`),
  });
}

function toFormData(payload: ContractPayload, file: File | null) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    // Omitted fields take the backend default (null); "" would fail date/number validation
    if (value !== null && value !== undefined) formData.append(key, String(value));
  }
  if (file) formData.append("pdf", file);
  return formData;
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, file }: { payload: ContractPayload; file: File | null }) =>
      apiFetch<Contract>("/contracts/file", { method: "POST", formData: toFormData(payload, file) }),
    onSuccess: (contract) => {
      queryClient.setQueryData(contractKeys.detail(contract.id), contract);
      queryClient.invalidateQueries({ queryKey: contractKeys.list() });
    },
  });
}

export function useUpdateContract(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payload, file }: { payload: ContractPayload; file: File | null }) => {
      const updated = await apiFetch<Contract>(`/contracts/${id}`, { method: "PUT", json: payload });
      if (!file) return updated;
      const formData = new FormData();
      formData.append("pdf", file);
      return apiFetch<Contract>(`/contracts/${id}/file`, { method: "PUT", formData });
    },
    onSuccess: (contract) => {
      queryClient.setQueryData(contractKeys.detail(id), contract);
      queryClient.invalidateQueries({ queryKey: contractKeys.list() });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/contracts/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: contractKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: contractKeys.list() });
    },
  });
}
