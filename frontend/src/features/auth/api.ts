"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, apiFetch } from "@/lib/api-client";
import { can, type Permission } from "@/lib/permissions";
import type { User } from "@/types";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => apiFetch<User>("/users/me"),
    staleTime: 5 * 60_000,
  });
}

/** `const { can } = usePermissions(); can({ action: "contract:edit", contract })` */
export function usePermissions() {
  const { data: user } = useCurrentUser();
  return { user, can: (permission: Permission) => can(user, permission) };
}

type Credentials = { email: string; password: string };

/** Calls the Next.js login route, which stores the JWT in an httpOnly cookie. */
async function login(credentials: Credentials): Promise<void> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, typeof body?.detail === "string" ? body.detail : "Login failed");
  }
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: () => queryClient.clear(),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetch("/api/auth/logout", { method: "POST" }),
    onSettled: () => {
      queryClient.clear();
      window.location.assign("/login");
    },
  });
}
