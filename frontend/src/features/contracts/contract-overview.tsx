"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useUsers } from "@/features/users/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Contract } from "@/types";

import { ContractStatusBadge } from "./contract-status-badge";
import { Deadline } from "./deadline";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function ContractOverview({ contract }: { contract: Contract }) {
  const t = useTranslations();
  const locale = useLocale();
  const { data: users } = useUsers();
  const owner = users?.find((u) => u.id === contract.user_id);
  const notSet = <span className="text-muted-foreground">{t("common.notSet")}</span>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-lg border bg-card p-5 lg:col-span-2" aria-labelledby="details-heading">
        <h2 id="details-heading" className="text-sm font-semibold">
          {t("contracts.form.details")}
        </h2>
        {contract.description ? (
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{contract.description}</p>
        ) : null}
        <dl className="mt-3 divide-y">
          <Row label={t("contracts.columns.status")}>
            <ContractStatusBadge status={contract.status} />
          </Row>
          <Row label={t("contracts.form.party_a")}>{contract.party_a}</Row>
          <Row label={t("contracts.form.party_b")}>{contract.party_b}</Row>
          <Row label={t("contracts.columns.value")}>
            <span className="tabular-nums">{formatCurrency(contract.value, locale) ?? notSet}</span>
          </Row>
          <Row label={t("contracts.owner")}>
            {!contract.user_id ? notSet : owner ? owner.email : users ? `#${contract.user_id}` : <Skeleton className="h-4 w-40" />}
          </Row>
          <Row label={t("contracts.updated")}>
            <span className="tabular-nums">{formatDate(contract.updated_at, locale)}</span>
          </Row>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-5" aria-labelledby="dates-heading">
        <h2 id="dates-heading" className="text-sm font-semibold">
          {t("contracts.keyDates")}
        </h2>
        <dl className="mt-3 divide-y">
          {(
            [
              ["startDate", contract.start_date],
              ["endDate", contract.end_date],
              ["renewalDate", contract.renewal_date],
            ] as const
          ).map(([key, date]) => (
            <div key={key} className="flex flex-col gap-1 py-2.5 text-sm">
              <dt className="text-muted-foreground">{t(`contracts.columns.${key}`)}</dt>
              <dd>
                <Deadline date={date} showPast={key !== "startDate"} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
