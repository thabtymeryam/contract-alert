"use client";

import { CheckCircle2, CircleDashed, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Obligation } from "@/types";

import { useSetObligationStatus, type ObligationStatus } from "./api";

export const OBLIGATION_TYPES = ["REPORTING", "DELIVERY", "PAYMENT", "COMPLIANCE", "NOTIFICATION", "OTHER"] as const;
export const FREQUENCIES = ["ONE_TIME", "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as const;

const styles: Record<ObligationStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  OVERDUE: "bg-critical-soft text-critical",
  COMPLETED: "bg-success-soft text-success",
};
const icons = { PENDING: CircleDashed, OVERDUE: AlertCircle, COMPLETED: CheckCircle2 };

export function ObligationStatusBadge({ status }: { status: string }) {
  const t = useTranslations("enums.obligationStatus");
  const key = (status in styles ? status : "PENDING") as ObligationStatus;
  const Icon = icons[key];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", styles[key])}>
      <Icon className="h-3 w-3" aria-hidden />
      {t(key)}
    </span>
  );
}

/** Checkbox that marks an obligation done (or reopens it). */
export function CompleteToggle({ obligation, disabled }: { obligation: Obligation; disabled?: boolean }) {
  const t = useTranslations("obligations");
  const setStatus = useSetObligationStatus();
  const done = obligation.status === "COMPLETED";
  return (
    <Checkbox
      checked={done}
      disabled={disabled || setStatus.isPending}
      onCheckedChange={(checked) => setStatus.mutate({ obligation, completed: checked === true })}
      aria-label={done ? t("reopen", { title: obligation.title }) : t("markDone", { title: obligation.title })}
      className="h-5 w-5"
    />
  );
}
