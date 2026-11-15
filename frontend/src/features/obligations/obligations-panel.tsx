"use client";

import { ClipboardList, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/api";
import { Deadline } from "@/features/contracts/deadline";
import { SourceText, TypeBadge, useEnumLabel } from "@/features/extraction/bits";
import { ConfirmDelete } from "@/features/extraction/confirm-delete";
import { useUsers } from "@/features/users/api";
import { cn } from "@/lib/utils";
import type { Obligation } from "@/types";

import { useDeleteObligation } from "./api";
import { ObligationDialog } from "./obligation-dialog";
import { CompleteToggle, ObligationStatusBadge } from "./obligation-status";

type ObligationsPanelProps = { contractId: number; obligations: Obligation[]; canEdit: boolean };

/** Open obligations first (overdue, then by due date), completed last. */
function byUrgency(a: Obligation, b: Obligation) {
  const rank = (o: Obligation) => (o.status === "OVERDUE" ? 0 : o.status === "PENDING" ? 1 : 2);
  return rank(a) - rank(b) || (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999");
}

export function ObligationsPanel({ contractId, obligations, canEdit }: ObligationsPanelProps) {
  const t = useTranslations("obligations");
  const te = useTranslations("extraction");
  const label = useEnumLabel();
  const { data: me } = useCurrentUser();
  const { data: users } = useUsers();
  const [editing, setEditing] = useState<Obligation | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Obligation | null>(null);
  const deleteObligation = useDeleteObligation(contractId);

  const emailOf = (id: number | null | undefined) => users?.find((u) => u.id === id)?.email;
  const addButton = canEdit && (
    <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
      <Plus aria-hidden />
      {t("add")}
    </Button>
  );

  return (
    <div>
      {obligations.length === 0 ? (
        <EmptyState icon={ClipboardList} title={te("obligations.emptyTitle")} body={canEdit ? te("emptyBody") : te("emptyBodyReadOnly")} action={addButton} />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{t("hint")}</p>
            {addButton}
          </div>
          <ul className="divide-y rounded-lg border bg-card">
            {[...obligations].sort(byUrgency).map((o) => {
              const canToggle = canEdit || (me && o.responsible_user_id === me.id);
              const assignee = emailOf(o.responsible_user_id);
              return (
                <li key={o.id} className="flex gap-3 p-4">
                  <div className="pt-0.5">
                    <CompleteToggle obligation={o} disabled={!canToggle} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={cn("text-sm font-semibold", o.status === "COMPLETED" && "text-muted-foreground line-through")}>
                        {o.title}
                      </h3>
                      <ObligationStatusBadge status={o.status} />
                      {o.obligation_type && <TypeBadge>{label("obligationType", o.obligation_type)}</TypeBadge>}
                      {o.frequency && <TypeBadge>{label("frequency", o.frequency)}</TypeBadge>}
                    </div>
                    {o.description && <p className="mt-1 text-sm text-muted-foreground">{o.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        <span className="sr-only">{t("assignee")}:</span>
                        {assignee ?? <span className="text-muted-foreground">{t("unassigned")}</span>}
                      </span>
                      {o.due_date && o.status !== "COMPLETED" && (
                        <span>
                          <span className="text-muted-foreground">{t("due")} </span>
                          <Deadline date={o.due_date} />
                        </span>
                      )}
                    </div>
                    <SourceText text={o.source_text} />
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 self-start">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(o)} aria-label={te("edit")}>
                        <Pencil aria-hidden />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(o)} aria-label={te("delete")}>
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {editing !== undefined && (
        <ObligationDialog
          contractId={contractId}
          obligation={editing}
          open
          onOpenChange={(open) => !open && setEditing(undefined)}
        />
      )}
      <ConfirmDelete
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteTitle")}
        onConfirm={() =>
          deleting &&
          deleteObligation.mutate(deleting.id, {
            onSuccess: () => toast.success(te("deleted")),
            onError: (e) => toast.error(e.message),
          })
        }
      />
    </div>
  );
}
