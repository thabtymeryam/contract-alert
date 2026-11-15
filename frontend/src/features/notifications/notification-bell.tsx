"use client";

import { Bell, BellOff } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

import { useMarkAllRead, useNotifications, useUnreadCount } from "./api";
import { NotificationItem } from "./notification-item";

export function NotificationBell() {
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useUnreadCount();
  const { data: latest, isPending } = useNotifications(false, 5);
  const markAll = useMarkAllRead();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? t("bellUnread", { count: unread }) : t("bell")}
        >
          <Bell aria-hidden />
          {unread > 0 && (
            <span
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold leading-none text-white"
              aria-hidden
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="text-sm font-semibold">{t("title")}</h2>
          {unread > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              {t("markAllRead")}
            </Button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {isPending ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !latest?.length ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <BellOff className="h-8 w-8 text-muted-foreground" aria-hidden />
              <p className="mt-2 text-sm text-muted-foreground">{t("empty")}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {latest.map((n) => (
                <li key={n.id}>
                  <NotificationItem notification={n} compact onNavigate={() => setOpen(false)} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t px-4 py-2 text-center">
          <Link href="/notifications" className="text-sm font-medium text-primary hover:underline" onClick={() => setOpen(false)}>
            {t("viewAll")}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
