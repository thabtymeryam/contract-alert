"use client";

import { AlertTriangle, CalendarClock, ClipboardCheck, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { useEnumLabel } from "@/features/extraction/bits";
import { formatDate, formatRelativeDays, formatTimeAgo } from "@/lib/format";
import { severityStyles, type Severity } from "@/lib/severity";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

import { useMarkRead } from "./api";

const icons: Record<string, LucideIcon> = {
  deadline: CalendarClock,
  obligation_assigned: ClipboardCheck,
  extraction_done: Sparkles,
  extraction_failed: AlertTriangle,
};

/**
 * Renders a notification from its kind + params, so the text follows the
 * viewer's language instead of whatever language it was created in.
 */
function useNotificationText(n: Notification) {
  const t = useTranslations("notifications.kinds");
  const locale = useLocale();
  const label = useEnumLabel();
  const p = (n.params ?? {}) as Record<string, string | number | null>;
  const contract = n.contract_title ?? "";

  switch (n.kind) {
    case "deadline": {
      const days = Number(p.days_left ?? 0);
      return {
        title: t("deadline.title", { event: label("eventType", String(p.event_type ?? "OTHER")) ?? "", contract }),
        body: t("deadline.body", {
          date: formatDate(String(p.date ?? ""), locale) ?? "",
          when: formatRelativeDays(days, locale),
        }),
      };
    }
    case "obligation_assigned":
      return {
        title: t("obligation_assigned.title", { obligation: String(p.obligation_title ?? "") }),
        body: t("obligation_assigned.body", { contract, by: String(p.assigned_by ?? "") }),
      };
    case "extraction_done":
      return { title: t("extraction_done.title", { contract }), body: t("extraction_done.body") };
    case "extraction_failed":
      return { title: t("extraction_failed.title", { contract }), body: String(p.error ?? "") };
    default:
      return { title: contract, body: "" };
  }
}

type NotificationItemProps = { notification: Notification; onNavigate?: () => void; compact?: boolean };

export function NotificationItem({ notification: n, onNavigate, compact }: NotificationItemProps) {
  const locale = useLocale();
  const tn = useTranslations("notifications");
  const markRead = useMarkRead();
  const { title, body } = useNotificationText(n);
  const Icon = icons[n.kind] ?? CalendarClock;
  const unread = !n.read_at;
  const severity = n.severity as Severity | null;

  const content = (
    <>
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          severity ? severityStyles[severity] : n.kind === "extraction_failed" ? severityStyles.critical : "bg-accent text-accent-foreground",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm", unread ? "font-semibold" : "text-muted-foreground")}>{title}</span>
        {body && <span className={cn("mt-0.5 block text-sm text-muted-foreground", compact && "line-clamp-2")}>{body}</span>}
        <span className="mt-1 block text-xs text-muted-foreground">{formatTimeAgo(n.created_at, locale)}</span>
      </span>
      {unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label={tn("unread")} />}
    </>
  );

  const className = cn(
    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
    unread && "bg-accent/40",
  );

  function onClick() {
    if (unread) markRead.mutate(n.id);
    onNavigate?.();
  }

  return n.link ? (
    <Link href={n.link} className={className} onClick={onClick}>
      {content}
    </Link>
  ) : (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}
