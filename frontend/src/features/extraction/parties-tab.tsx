"use client";

import { Building2, Mail, MapPin, Pencil, Phone, Plus, Trash2, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import type { Party } from "@/types";

import { useDeleteItem } from "./api";
import { TypeBadge, useEnumLabel } from "./bits";
import { ConfirmDelete } from "./confirm-delete";
import { PartyDialog } from "./party-dialog";

type PartiesTabProps = { contractId: number; parties: Party[]; canEdit: boolean };

export function PartiesTab({ contractId, parties, canEdit }: PartiesTabProps) {
  const t = useTranslations("extraction");
  const label = useEnumLabel();
  const [editing, setEditing] = useState<Party | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Party | null>(null);
  const deleteParty = useDeleteItem("parties", contractId);

  const addButton = canEdit && (
    <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
      <Plus aria-hidden />
      {t("parties.add")}
    </Button>
  );

  return (
    <div>
      {parties.length === 0 ? (
        <EmptyState icon={Building2} title={t("parties.emptyTitle")} body={canEdit ? t("emptyBody") : t("emptyBodyReadOnly")} action={addButton} />
      ) : (
        <>
          {addButton && <div className="mb-4 flex justify-end">{addButton}</div>}
          <ul className="grid gap-4 md:grid-cols-2">
            {parties.map((party) => {
              const Icon = party.type === "INDIVIDUAL" ? User : Building2;
              return (
                <li key={party.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-semibold">{party.name}</h3>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {party.role && <TypeBadge>{label("partyRole", party.role)}</TypeBadge>}
                          {party.type && <TypeBadge>{label("partyType", party.type)}</TypeBadge>}
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(party)} aria-label={t("edit")}>
                          <Pencil aria-hidden />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(party)} aria-label={t("delete")}>
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    )}
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {party.registration_number && (
                      <div>
                        <dt className="sr-only">{t("parties.registration_number")}</dt>
                        <dd>
                          {t("parties.registrationShort")} {party.registration_number}
                        </dd>
                      </div>
                    )}
                    {party.address && (
                      <div className="flex gap-2">
                        <dt>
                          <MapPin className="mt-0.5 h-3.5 w-3.5" aria-label={t("parties.address")} />
                        </dt>
                        <dd className="break-words">{party.address}</dd>
                      </div>
                    )}
                    {party.contact_email && (
                      <div className="flex gap-2">
                        <dt>
                          <Mail className="mt-0.5 h-3.5 w-3.5" aria-label={t("parties.contact_email")} />
                        </dt>
                        <dd className="min-w-0 truncate">
                          <a href={`mailto:${party.contact_email}`} className="hover:underline">
                            {party.contact_email}
                          </a>
                        </dd>
                      </div>
                    )}
                    {party.contact_phone && (
                      <div className="flex gap-2">
                        <dt>
                          <Phone className="mt-0.5 h-3.5 w-3.5" aria-label={t("parties.contact_phone")} />
                        </dt>
                        <dd>{party.contact_phone}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {editing !== undefined && (
        <PartyDialog contractId={contractId} party={editing} open onOpenChange={(open) => !open && setEditing(undefined)} />
      )}
      <ConfirmDelete
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("parties.deleteTitle")}
        onConfirm={() =>
          deleting &&
          deleteParty.mutate(deleting.id, {
            onSuccess: () => toast.success(t("deleted")),
            onError: (e) => toast.error(e.message),
          })
        }
      />
    </div>
  );
}
