"use client";

import { BellOff, CheckCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarkAllRead, useNotifications, useUnreadCount } from "@/features/notifications/api";
import { NotificationItem } from "@/features/notifications/notification-item";

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, isPending, error, refetch } = useNotifications(unreadOnly, 100);
  const { data: unread = 0 } = useUnreadCount();
  const markAll = useMarkAllRead();

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          unread > 0 && (
            <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              <CheckCheck aria-hidden />
              {t("markAllRead")}
            </Button>
          )
        }
      />

      <Tabs value={unreadOnly ? "unread" : "all"} onValueChange={(v) => setUnreadOnly(v === "unread")} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">{t("all")}</TabsTrigger>
          <TabsTrigger value="unread">
            {t("unreadTab")}
            {unread > 0 && <span className="ml-1.5 tabular-nums text-muted-foreground">{unread}</span>}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isPending ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState icon={BellOff} title={unreadOnly ? t("noUnread") : t("empty")} body={t("emptyBody")} />
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {data.map((n) => (
            <li key={n.id}>
              <NotificationItem notification={n} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
