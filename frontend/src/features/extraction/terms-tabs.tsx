"use client";

import { Gavel, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/states";
import { Deadline } from "@/features/contracts/deadline";
import { formatCurrency } from "@/lib/format";
import type { PaymentTerm, Penalty } from "@/types";

import { SourceText, TypeBadge, useEnumLabel } from "./bits";

function Card({ title, badges, children }: { title: ReactNode; badges?: ReactNode; children?: ReactNode }) {
  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {badges}
      </div>
      {children}
    </li>
  );
}

export function PaymentsTab({ payments, canEdit }: { payments: PaymentTerm[]; canEdit: boolean }) {
  const t = useTranslations("extraction");
  const locale = useLocale();
  const label = useEnumLabel();
  if (payments.length === 0) {
    return <EmptyState icon={Wallet} title={t("payments.emptyTitle")} body={canEdit ? t("emptyBodyExtract") : t("emptyBodyReadOnly")} />;
  }
  return (
    <ul className="space-y-3">
      {payments.map((p) => (
        <Card
          key={p.id}
          title={
            <span className="tabular-nums">
              {formatCurrency(p.amount, locale, p.currency ?? "TND") ?? t("payments.noAmount")}
            </span>
          }
          badges={
            <>
              {p.payment_type && <TypeBadge>{label("paymentType", p.payment_type)}</TypeBadge>}
              {p.frequency && <TypeBadge>{label("frequency", p.frequency)}</TypeBadge>}
            </>
          }
        >
          {p.description && <p className="mt-2 text-sm">{p.description}</p>}
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {p.due_date && (
              <span>
                <span className="text-muted-foreground">{t("payments.dueDate")} </span>
                <Deadline date={p.due_date} />
              </span>
            )}
            {p.due_days != null && (
              <span className="text-muted-foreground">{t("payments.dueDays", { days: p.due_days })}</span>
            )}
          </div>
          <SourceText text={p.source_text} />
        </Card>
      ))}
    </ul>
  );
}

export function PenaltiesTab({ penalties, canEdit }: { penalties: Penalty[]; canEdit: boolean }) {
  const t = useTranslations("extraction");
  const locale = useLocale();
  const label = useEnumLabel();
  if (penalties.length === 0) {
    return <EmptyState icon={Gavel} title={t("penalties.emptyTitle")} body={canEdit ? t("emptyBodyExtract") : t("emptyBodyReadOnly")} />;
  }
  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">{t("penalties.disclaimer")}</p>
      <ul className="space-y-3">
        {penalties.map((p) => {
          const amount =
            p.percentage != null
              ? `${new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB").format(p.percentage)} %`
              : formatCurrency(p.amount, locale, p.currency ?? "TND");
          return (
            <Card
              key={p.id}
              title={amount ?? t("penalties.noAmount")}
              badges={p.type && <TypeBadge>{label("penaltyType", p.type)}</TypeBadge>}
            >
              {p.trigger && (
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">{t("penalties.trigger")} </span>
                  {p.trigger}
                </p>
              )}
              {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
              <SourceText text={p.source_text} />
            </Card>
          );
        })}
      </ul>
    </>
  );
}
