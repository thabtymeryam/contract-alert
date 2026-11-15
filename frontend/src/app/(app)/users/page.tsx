"use client";

import { ShieldAlert, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/features/auth/api";
import { useUsers } from "@/features/users/api";
import { CreateUserDialog } from "@/features/users/create-user-dialog";
import { UsersTable } from "@/features/users/users-table";

export default function UsersPage() {
  const t = useTranslations("users");
  const { user, can } = usePermissions();
  const isAllowed = can({ action: "users:manage" });
  const { data: users, isPending, error, refetch } = useUsers();

  if (user && !isAllowed) {
    return <EmptyState icon={ShieldAlert} title={t("forbiddenTitle")} body={t("forbiddenBody")} />;
  }

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} actions={isAllowed && <CreateUserDialog />} />

      {isPending || !user ? (
        <div className="space-y-2" aria-busy="true" aria-label={t("loadingLabel")}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title={t("emptyTitle")} />
      ) : (
        <UsersTable users={users} currentUserId={user.id} />
      )}
    </>
  );
}
