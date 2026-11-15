"use client";

import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Deadline } from "@/features/contracts/deadline";
import type { ContractEvent } from "@/types";

import { useDeleteItem } from "./api";
import { SourceText, TypeBadge, useEnumLabel } from "./bits";
import { ConfirmDelete } from "./confirm-delete";
import { EventDialog } from "./event-dialog";

/** Dated events first (soonest first), undated ones last. */
function byDate(a: ContractEvent, b: ContractEvent) {
  if (!a.date) return b.date ? 1 : 0;
  if (!b.date) return -1;
  return a.date.localeCompare(b.date);
}

type EventsTabProps = { contractId: number; events: ContractEvent[]; canEdit: boolean };

export function EventsTab({ contractId, events, canEdit }: EventsTabProps) {
  const t = useTranslations("extraction");
  const label = useEnumLabel();
  // undefined = closed, null = adding, event = editing
  const [editing, setEditing] = useState<ContractEvent | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<ContractEvent | null>(null);
  const deleteEvent = useDeleteItem("events", contractId);

  const addButton = canEdit && (
    <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
      <Plus aria-hidden />
      {t("events.add")}
    </Button>
  );

  return (
    <div>
      {events.length === 0 ? (
        <EmptyState icon={CalendarClock} title={t("events.emptyTitle")} body={canEdit ? t("emptyBody") : t("emptyBodyReadOnly")} action={addButton} />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{t("events.hint")}</p>
            {addButton}
          </div>
          <ol className="divide-y rounded-lg border bg-card">
            {[...events].sort(byDate).map((event) => (
              <li key={event.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start">
                <div className="sm:w-60 sm:shrink-0">
                  <Deadline date={event.date} />
                </div>
                <div className="min-w-0 flex-1">
                  <TypeBadge>{label("eventType", event.type)}</TypeBadge>
                  {event.description && <p className="mt-1.5 text-sm">{event.description}</p>}
                  <SourceText text={event.source_text} />
                </div>
                {canEdit && (
                  <div className="flex gap-1 self-start">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(event)} aria-label={t("edit")}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(event)} aria-label={t("delete")}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      {editing !== undefined && (
        <EventDialog contractId={contractId} event={editing} open onOpenChange={(open) => !open && setEditing(undefined)} />
      )}
      <ConfirmDelete
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("events.deleteTitle")}
        onConfirm={() =>
          deleting &&
          deleteEvent.mutate(deleting.id, {
            onSuccess: () => toast.success(t("deleted")),
            onError: (e) => toast.error(e.message),
          })
        }
      />
    </div>
  );
}
