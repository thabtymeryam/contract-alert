"use client";

import { ListTree, Pencil, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Clause } from "@/types";

import { useDeleteItem } from "./api";
import { ConfidenceBadge, REVIEW_THRESHOLD, TypeBadge, useEnumLabel } from "./bits";
import { ClauseSheet } from "./clause-sheet";
import { ConfirmDelete } from "./confirm-delete";

type ClausesTabProps = { contractId: number; clauses: Clause[]; canEdit: boolean };

export function ClausesTab({ contractId, clauses, canEdit }: ClausesTabProps) {
  const t = useTranslations("extraction");
  const label = useEnumLabel();
  const [type, setType] = useState("all");
  const [importantOnly, setImportantOnly] = useState(false);
  const [editing, setEditing] = useState<Clause | null>(null);
  const [deleting, setDeleting] = useState<Clause | null>(null);
  const deleteClause = useDeleteItem("clauses", contractId);

  const types = useMemo(
    () => Array.from(new Set(clauses.map((c) => c.type).filter((ty): ty is NonNullable<typeof ty> => Boolean(ty)))),
    [clauses],
  );
  const visible = clauses
    .filter((c) => type === "all" || c.type === type)
    .filter((c) => !importantOnly || c.is_important);
  const reviewCount = clauses.filter((c) => c.confidence !== null && c.confidence < REVIEW_THRESHOLD).length;

  if (clauses.length === 0) {
    return <EmptyState icon={ListTree} title={t("clauses.emptyTitle")} body={canEdit ? t("emptyBodyExtract") : t("emptyBodyReadOnly")} />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-56" aria-label={t("clauses.typeFilter")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("clauses.allTypes")}</SelectItem>
            {types.map((ty) => (
              <SelectItem key={ty} value={ty}>
                {label("clauseType", ty)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch id="important-only" checked={importantOnly} onCheckedChange={setImportantOnly} />
          <Label htmlFor="important-only">{t("clauses.importantOnly")}</Label>
        </div>
        {reviewCount > 0 && (
          <p className="text-sm text-warning sm:ml-auto">{t("clauses.reviewCount", { count: reviewCount })}</p>
        )}
      </div>

      <ul className="space-y-3">
        {visible.map((clause) => (
          <li key={clause.id} className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  {clause.is_important && (
                    <Star className="h-4 w-4 shrink-0 fill-warning text-warning" aria-label={t("clauses.important")} />
                  )}
                  {clause.clause_number && <span className="tabular-nums text-muted-foreground">{clause.clause_number}</span>}
                  <span className="break-words">{clause.title || t("clauses.untitled")}</span>
                </h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {clause.type && <TypeBadge>{label("clauseType", clause.type)}</TypeBadge>}
                  <ConfidenceBadge confidence={clause.confidence} />
                  {clause.page_start && (
                    <span className="text-xs text-muted-foreground">
                      {clause.page_end && clause.page_end !== clause.page_start
                        ? t("clauses.pages", { start: clause.page_start, end: clause.page_end })
                        : t("clauses.page", { page: clause.page_start })}
                    </span>
                  )}
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(clause)} aria-label={t("edit")}>
                    <Pencil aria-hidden />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(clause)} aria-label={t("delete")}>
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              )}
            </div>
            {clause.summary && <p className="mt-3 text-sm">{clause.summary}</p>}
            {clause.text && (
              <details className="group mt-2">
                <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">{t("clauses.fullText")}</summary>
                <p className="mt-2 whitespace-pre-line rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">{clause.text}</p>
              </details>
            )}
          </li>
        ))}
      </ul>

      {editing && (
        <ClauseSheet contractId={contractId} clause={editing} open onOpenChange={(open) => !open && setEditing(null)} />
      )}
      <ConfirmDelete
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("clauses.deleteTitle")}
        onConfirm={() =>
          deleting &&
          deleteClause.mutate(deleting.id, {
            onSuccess: () => toast.success(t("deleted")),
            onError: (e) => toast.error(e.message),
          })
        }
      />
    </div>
  );
}
