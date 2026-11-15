"use client";

import { AlertTriangle, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center rounded-lg border border-dashed bg-card px-6 py-12 text-center"
    >
      <Icon className="h-10 w-10 text-muted-foreground" aria-hidden />
      <h2 className="mt-3 text-sm font-semibold">{title}</h2>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useTranslations();
  const message =
    error instanceof ApiError && error.status === 502
      ? t("errors.backendUnavailable")
      : error instanceof Error
        ? error.message
        : t("errors.generic");

  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-lg border border-critical/30 bg-critical-soft px-6 py-10 text-center"
    >
      <AlertTriangle className="h-8 w-8 text-critical" aria-hidden />
      <h2 className="mt-3 text-sm font-semibold">{t("errors.loadFailed")}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
