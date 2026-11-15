"use client";

import { ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState } from "@/components/states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/features/auth/api";
import { Deadline } from "@/features/contracts/deadline";
import { useObligations, type ObligationFilters } from "@/features/obligations/api";
import { CompleteToggle, ObligationStatusBadge } from "@/features/obligations/obligation-status";
import { useUsers } from "@/features/users/api";
import { isAdmin } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type StatusFilter = "open" | NonNullable<ObligationFilters["status"]> | "all";

export default function ObligationsPage() {
  const t = useTranslations("obligations");
  const { user } = usePermissions();
  const admin = isAdmin(user);
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [status, setStatus] = useState<StatusFilter>("open");
  const { data: users } = useUsers();

  const filters: ObligationFilters = {
    assigned_to: scope === "mine" ? "me" : undefined,
    status: status === "open" || status === "all" ? undefined : status,
  };
  const { data, isPending, error, refetch } = useObligations(filters, Boolean(user));
  // "Open" = pending + overdue; filtered here so both show in one list
  const obligations = (data ?? []).filter((o) => status !== "open" || o.status !== "COMPLETED");
  const emailOf = (id: number | null | undefined) => users?.find((u) => u.id === id)?.email;

  return (
    <>
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {admin && (
          <Tabs value={scope} onValueChange={(v) => setScope(v as "mine" | "all")}>
            <TabsList>
              <TabsTrigger value="mine">{t("assignedToMe")}</TabsTrigger>
              <TabsTrigger value="all">{t("everyone")}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="sm:w-48" aria-label={t("statusFilter")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">{t("filterOpen")}</SelectItem>
            <SelectItem value="overdue">{t("filterOverdue")}</SelectItem>
            <SelectItem value="completed">{t("filterCompleted")}</SelectItem>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label={t("loadingLabel")}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : obligations.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={scope === "mine" && status === "open" ? t("allCaughtUp") : t("noneTitle")}
          body={scope === "mine" ? t("noneMineBody") : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-10">
                  <span className="sr-only">{t("done")}</span>
                </TableHead>
                <TableHead>{t("title")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("contract")}</TableHead>
                <TableHead>{t("dueDate")}</TableHead>
                {scope === "all" && <TableHead className="hidden lg:table-cell">{t("assignee")}</TableHead>}
                <TableHead className="hidden sm:table-cell">{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obligations.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <CompleteToggle obligation={o} />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className={cn("truncate font-medium", o.status === "COMPLETED" && "text-muted-foreground line-through")}>
                      {o.title}
                    </p>
                    <Link
                      href={`/contracts/${o.contract_id}`}
                      className="block truncate text-xs text-muted-foreground hover:underline md:hidden"
                    >
                      {o.contract_title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden max-w-xs md:table-cell">
                    <Link href={`/contracts/${o.contract_id}`} className="block truncate hover:underline">
                      {o.contract_title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {o.status === "COMPLETED" ? <span className="text-muted-foreground">—</span> : <Deadline date={o.due_date} />}
                  </TableCell>
                  {scope === "all" && (
                    <TableCell className="hidden max-w-[12rem] truncate text-muted-foreground lg:table-cell">
                      {emailOf(o.responsible_user_id) ?? t("unassigned")}
                    </TableCell>
                  )}
                  <TableCell className="hidden sm:table-cell">
                    <ObligationStatusBadge status={o.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
