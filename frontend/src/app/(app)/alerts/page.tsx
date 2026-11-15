"use client";

import { AlertOctagon, AlertTriangle, BellRing, CalendarClock, ClipboardCheck, Clock, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRunAlerts, useUpcomingAlerts } from "@/features/alerts/api";
import { usePermissions } from "@/features/auth/api";
import { useEnumLabel } from "@/features/extraction/bits";
import { formatDate, formatRelativeDays } from "@/lib/format";
import { severityStyles, type Severity } from "@/lib/severity";
import { cn } from "@/lib/utils";

const SEVERITIES: Severity[] = ["critical", "warning", "upcoming"];
const severityIcons = { critical: AlertOctagon, warning: AlertTriangle, upcoming: Clock };

export default function AlertsPage() {
  const t = useTranslations("alerts");
  const locale = useLocale();
  const label = useEnumLabel();
  const { can } = usePermissions();
  const [tab, setTab] = useState<Severity | "all">("all");
  const { data, isPending, error, refetch } = useUpcomingAlerts();
  const runAlerts = useRunAlerts();

  const items = data ?? [];
  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, items.filter((i) => i.severity === s).length]));
  const visible = tab === "all" ? items : items.filter((i) => i.severity === tab);

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          can({ action: "alerts:run" }) && (
            <Button
              variant="outline"
              disabled={runAlerts.isPending}
              onClick={() =>
                runAlerts.mutate(undefined, {
                  onSuccess: (r) => toast.success(t("runResult", { sent: r.sent, notified: r.notified })),
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              {runAlerts.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
              {t("runNow")}
            </Button>
          )
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Severity | "all")} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">
            {t("all")}
            {items.length > 0 && <span className="ml-1.5 tabular-nums text-muted-foreground">{items.length}</span>}
          </TabsTrigger>
          {SEVERITIES.map((s) => (
            <TabsTrigger key={s} value={s}>
              {t(`severity.${s}`)}
              {counts[s] > 0 && <span className="ml-1.5 tabular-nums text-muted-foreground">{counts[s]}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <p className="mb-4 text-xs text-muted-foreground">{t("tiers")}</p>

      {isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label={t("loadingLabel")}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState icon={BellRing} title={t("emptyTitle")} body={t("emptyBody")} />
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {visible.map((item) => {
            const severity = item.severity as Severity;
            const SeverityIcon = severityIcons[severity];
            const KindIcon = item.kind === "obligation" ? ClipboardCheck : CalendarClock;
            const what =
              item.kind === "obligation"
                ? t("obligationLabel", { title: item.title ?? "" })
                : label("eventType", item.type) ?? item.type;
            return (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={`/contracts/${item.contract_id}`}
                  className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none sm:flex-row sm:items-center sm:gap-4"
                >
                  <span
                    className={cn(
                      "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium sm:w-28",
                      severityStyles[severity],
                    )}
                  >
                    <SeverityIcon className="h-3.5 w-3.5" aria-hidden />
                    {t(`severity.${severity}`)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <KindIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate">{what}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                      {item.contract_title}
                      {item.description ? ` · ${item.description}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm sm:text-right">
                    <span className="block tabular-nums">{formatDate(item.date, locale)}</span>
                    <span className={cn("block text-xs", item.days_left < 0 ? "font-medium text-critical" : "text-muted-foreground")}>
                      {item.days_left < 0 ? t("overdueBy", { when: formatRelativeDays(item.days_left, locale) }) : formatRelativeDays(item.days_left, locale)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
