"use client";

import { AlertOctagon, ArrowRight, CalendarClock, ClipboardCheck, FileText, Hourglass, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/features/auth/api";
import { Deadline } from "@/features/contracts/deadline";
import { useEnumLabel } from "@/features/extraction/bits";
import { CompleteToggle } from "@/features/obligations/obligation-status";
import { formatDate, formatRelativeDays } from "@/lib/format";
import { severityStyles, type Severity } from "@/lib/severity";
import { cn } from "@/lib/utils";

import { useDashboardSummary } from "./api";

type StatProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number;
  sub?: string;
  /** Highlights the tile when there's something to act on */
  tone?: "critical" | "warning";
};

function Stat({ href, icon: Icon, label, value, sub, tone }: StatProps) {
  const active = tone && value > 0;
  return (
    <Link
      href={href}
      className={cn(
        "group rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && tone === "critical" && "border-critical/30",
        active && tone === "warning" && "border-warning/30",
      )}
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon
          className={cn("h-4 w-4", active && tone === "critical" && "text-critical", active && tone === "warning" && "text-warning")}
          aria-hidden
        />
      </div>
      <p
        className={cn(
          "mt-2 text-3xl font-semibold tabular-nums tracking-tight",
          active && tone === "critical" && "text-critical",
          active && tone === "warning" && "text-warning",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Link>
  );
}

function Panel({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-card" aria-label={title}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      {children}
    </section>
  );
}

/** Proportional bar of alert counts by severity, with a text legend (never color alone). */
function SeverityBar({ counts }: { counts: Record<Severity, number> }) {
  const t = useTranslations("alerts.severity");
  const total = counts.critical + counts.warning + counts.upcoming;
  if (total === 0) return null;
  const order: Severity[] = ["critical", "warning", "upcoming"];
  const fill = { critical: "bg-critical", warning: "bg-warning", upcoming: "bg-upcoming" };
  return (
    <div className="px-4 pt-3">
      <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        {order.map((s) => counts[s] > 0 && <div key={s} className={fill[s]} style={{ width: `${(counts[s] / total) * 100}%` }} />)}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {order.map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", fill[s])} aria-hidden />
            {t(s)} <span className="font-medium tabular-nums text-foreground">{counts[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Dashboard() {
  const t = useTranslations("dashboard");
  const ta = useTranslations("alerts");
  const locale = useLocale();
  const label = useEnumLabel();
  const { data: user } = useCurrentUser();
  const { data, isPending, error, refetch } = useDashboardSummary();

  const header = <PageHeader title={t("title")} description={user ? t("welcome", { email: user.email }) : undefined} />;

  if (isPending) {
    return (
      <>
        {header}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5" aria-busy="true" aria-label={t("loading")}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <Skeleton className="h-80 lg:col-span-3" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </>
    );
  }
  if (error) {
    return (
      <>
        {header}
        <ErrorState error={error} onRetry={() => refetch()} />
      </>
    );
  }

  const { contracts, obligations, alerts, upcoming, my_obligations } = data;

  return (
    <>
      {header}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat
          href="/contracts?status=active"
          icon={FileText}
          label={t("activeContracts")}
          value={contracts.active}
          sub={t("ofTotal", { total: contracts.total })}
        />
        <Stat href="/alerts" icon={Hourglass} label={t("expiringSoon")} value={contracts.expiring_soon} sub={t("within30")} tone="warning" />
        <Stat href="/alerts" icon={AlertOctagon} label={t("criticalAlerts")} value={alerts.critical} sub={t("under7")} tone="critical" />
        <Stat
          href="/obligations"
          icon={ClipboardCheck}
          label={obligations.scope === "all" ? t("overdueObligationsAll") : t("overdueObligations")}
          value={obligations.overdue}
          sub={t("pendingCount", { count: obligations.pending })}
          tone="critical"
        />
        <Stat href="/obligations" icon={CalendarClock} label={t("myOpen")} value={obligations.mine_open} sub={t("assignedToYou")} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel title={t("nextDeadlines")} href="/alerts" linkLabel={t("allAlerts")}>
            <SeverityBar counts={alerts} />
            {upcoming.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("noDeadlines")}</p>
            ) : (
              <ul className="mt-2 divide-y">
                {upcoming.map((item) => {
                  const severity = item.severity as Severity;
                  return (
                    <li key={`${item.kind}-${item.id}`}>
                      <Link
                        href={`/contracts/${item.contract_id}?tab=${item.kind === "obligation" ? "obligations" : "keyDates"}`}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                      >
                        <span className={cn("w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium", severityStyles[severity])}>
                          {item.days_left < 0 ? t("overdue") : formatRelativeDays(item.days_left, locale)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {item.kind === "obligation" ? ta("obligationLabel", { title: item.title ?? "" }) : label("eventType", item.type)}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">{item.contract_title}</span>
                        </span>
                        <span className="hidden shrink-0 text-sm tabular-nums text-muted-foreground sm:block">
                          {formatDate(item.date, locale)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title={t("myObligations")} href="/obligations" linkLabel={t("allObligations")}>
            {my_obligations.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("noObligations")}</p>
            ) : (
              <ul className="divide-y">
                {my_obligations.map((o) => (
                  <li key={o.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="pt-0.5">
                      <CompleteToggle obligation={o} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{o.title}</p>
                      <Link
                        href={`/contracts/${o.contract_id}?tab=obligations`}
                        className="block truncate text-xs text-muted-foreground hover:underline"
                      >
                        {o.contract_title}
                      </Link>
                      {o.due_date && (
                        <div className="mt-1 text-sm">
                          <Deadline date={o.due_date} />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
