/**
 * Mirrors the backend rules in app/core/security.py. The backend is the
 * source of truth; this only decides what the UI shows or disables.
 */
import type { Contract, User } from "@/types";

type ContractRef = Pick<Contract, "user_id">;

export type Permission =
  | { action: "users:manage" }
  | { action: "alerts:run" }
  | { action: "contract:create" }
  | { action: "contract:edit"; contract: ContractRef }
  | { action: "contract:delete"; contract: ContractRef }
  | { action: "contract:extract"; contract: ContractRef };

export function isAdmin(user: User | undefined): boolean {
  return user?.role === "admin";
}

export function can(user: User | undefined, permission: Permission): boolean {
  if (!user || !user.is_active) return false;

  switch (permission.action) {
    case "users:manage":
    case "alerts:run":
      return isAdmin(user);
    case "contract:create":
      return true;
    case "contract:edit":
    case "contract:delete":
    case "contract:extract":
      return isAdmin(user) || permission.contract.user_id === user.id;
  }
}
