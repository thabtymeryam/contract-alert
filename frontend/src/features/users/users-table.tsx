"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { User, UserRole } from "@/types";

import { useUpdateUser } from "./api";

type UsersTableProps = { users: User[]; currentUserId: number };

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const t = useTranslations();
  const locale = useLocale();
  const updateUser = useUpdateUser();
  const [confirmDeactivate, setConfirmDeactivate] = useState<User | null>(null);

  function update(user: User, changes: { role?: UserRole; is_active?: boolean }, successMessage: string) {
    updateUser.mutate(
      { id: user.id, ...changes },
      {
        onSuccess: () => toast.success(successMessage),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>{t("users.columns.email")}</TableHead>
              <TableHead className="w-44">{t("users.columns.role")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("users.columns.status")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("users.columns.created")}</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{t("users.columns.actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const pending = updateUser.isPending && updateUser.variables?.id === user.id;
              return (
                <TableRow key={user.id} className={cn(!user.is_active && "text-muted-foreground")}>
                  <TableCell className="max-w-[14rem] truncate font-medium">
                    {user.email}
                    {isSelf && <span className="ml-2 text-xs font-normal text-muted-foreground">({t("users.you")})</span>}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      disabled={isSelf || pending}
                      onValueChange={(role) => update(user, { role: role as UserRole }, t("users.roleChanged", { email: user.email }))}
                    >
                      <SelectTrigger className="h-8" aria-label={t("users.roleFor", { email: user.email })}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">{t("roles.user")}</SelectItem>
                        <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                        user.is_active ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full", user.is_active ? "bg-success" : "bg-muted-foreground")}
                        aria-hidden
                      />
                      {user.is_active ? t("users.active") : t("users.inactive")}
                    </span>
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">
                    {formatDate(user.created_at, locale) ?? t("common.notSet")}
                  </TableCell>
                  <TableCell className="text-right">
                    {!isSelf &&
                      (user.is_active ? (
                        <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirmDeactivate(user)}>
                          {t("users.deactivate")}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => update(user, { is_active: true }, t("users.activated", { email: user.email }))}
                        >
                          {t("users.activate")}
                        </Button>
                      ))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={confirmDeactivate !== null} onOpenChange={(open) => !open && setConfirmDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("users.deactivateTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("users.deactivateBody", { email: confirmDeactivate?.email ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDeactivate) update(confirmDeactivate, { is_active: false }, t("users.deactivated", { email: confirmDeactivate.email }));
              }}
            >
              {t("users.deactivate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
