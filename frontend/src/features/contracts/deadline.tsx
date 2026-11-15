"use client";

import { useLocale, useTranslations } from "next-intl";

import { daysUntil, formatDate, formatRelativeDays } from "@/lib/format";
import { severityFor, severityStyles } from "@/lib/severity";
import { cn } from "@/lib/utils";

/**
 * A date plus how far away it is, colored by the spec's deadline tiers.
 * `showPast={false}` hides "x days ago" for dates where the past isn't news (e.g. a start date).
 */
export function Deadline({ date, showPast = true }: { date: string | null | undefined; showPast?: boolean }) {
  const t = useTranslations("common");
  const locale = useLocale();
  if (!date) return <span className="text-muted-foreground">{t("notSet")}</span>;

  const days = daysUntil(date);
  const severity = severityFor(days);

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="tabular-nums">{formatDate(date, locale)}</span>
      {severity ? (
        <span className={cn("rounded-full px-1.5 py-0.5 text-xs font-medium", severityStyles[severity])}>
          {formatRelativeDays(days, locale)}
        </span>
      ) : days < 0 && showPast ? (
        <span className="text-xs text-muted-foreground">{formatRelativeDays(days, locale)}</span>
      ) : null}
    </span>
  );
}
