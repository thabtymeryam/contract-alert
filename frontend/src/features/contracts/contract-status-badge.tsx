"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { ContractStatus } from "@/types";

const styles: Record<ContractStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-success-soft text-success",
  expired: "bg-critical-soft text-critical",
  terminated: "bg-warning-soft text-warning",
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const t = useTranslations("contractStatus");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {t(status)}
    </span>
  );
}
