"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authKeys } from "@/features/auth/api";
import { apiFetch } from "@/lib/api-client";
import type { User, UserRole } from "@/types";

export const userKeys = {
  all: ["users"] as const,
  list: () => [...userKeys.all, "list"] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => apiFetch<User[]>("/users/"),
  });
}

export type UserCreateInput = { email: string; password: string; role: UserRole };

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreateInput) => apiFetch<User>("/users/", { method: "POST", json: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export type UserUpdateInput = { id: number; role?: UserRole; is_active?: boolean };

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...changes }: UserUpdateInput) =>
      apiFetch<User>(`/users/${id}`, { method: "PATCH", json: changes }),
    onSuccess: (updated) => {
      queryClient.setQueryData<User[]>(userKeys.list(), (users) =>
        users?.map((u) => (u.id === updated.id ? updated : u)),
      );
    },
  });
}

export type PasswordChangeInput = { current_password: string; new_password: string };

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PasswordChangeInput) =>
      apiFetch<void>("/users/me/password", { method: "PUT", json: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me }),
  });
}
