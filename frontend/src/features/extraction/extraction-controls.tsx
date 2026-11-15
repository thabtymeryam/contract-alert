"use client";

import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Contract } from "@/types";

import { useStartExtraction } from "./api";

type ExtractButtonProps = { contract: Contract; variant?: "default" | "outline" };

/** Starts AI extraction. Asks first when it would replace earlier results. */
export function ExtractButton({ contract, variant = "outline" }: ExtractButtonProps) {
  const t = useTranslations("extraction");
  const tc = useTranslations("common");
  const start = useStartExtraction(contract.id);
  const [confirming, setConfirming] = useState(false);

  const running = contract.extraction_status === "running" || start.isPending;
  const hasRun = contract.extraction_status === "done" || contract.extraction_status === "failed";

  function run() {
    start.mutate(undefined, { onError: (e) => toast.error(e.message) });
  }

  const button = (
    <Button
      variant={variant}
      disabled={!contract.file_path || running}
      onClick={() => (contract.extraction_status === "done" ? setConfirming(true) : run())}
    >
      {running ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
      {running ? t("running") : hasRun ? t("rerun") : t("extract")}
    </Button>
  );

  return (
    <>
      {contract.file_path ? (
        button
      ) : (
        <Tooltip>
          {/* Disabled buttons don't fire pointer events; the span carries the tooltip */}
          <TooltipTrigger asChild>
            <span tabIndex={0}>{button}</span>
          </TooltipTrigger>
          <TooltipContent>{t("needsPdf")}</TooltipContent>
        </Tooltip>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("rerunTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("rerunBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={run}>{t("rerun")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type ExtractionBannerProps = { contract: Contract; canExtract: boolean; reviewCount: number };

export function ExtractionBanner({ contract, canExtract, reviewCount }: ExtractionBannerProps) {
  const t = useTranslations("extraction");
  const locale = useLocale();
  const status = contract.extraction_status;

  if (status === "running") {
    return (
      <Banner tone="info" icon={<Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />} live>
        <p className="font-medium">{t("runningTitle")}</p>
        <p className="text-muted-foreground">{t("runningBody")}</p>
      </Banner>
    );
  }

  if (status === "failed") {
    return (
      <Banner tone="critical" icon={<AlertTriangle className="h-5 w-5 text-critical" aria-hidden />} live>
        <p className="font-medium">{t("failedTitle")}</p>
        {contract.extraction_error && <p className="break-words text-muted-foreground">{contract.extraction_error}</p>}
        {canExtract && (
          <div className="mt-2">
            <ExtractButton contract={contract} />
          </div>
        )}
      </Banner>
    );
  }

  if (status === "done") {
    const when = contract.extracted_at
      ? new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
          new Date(contract.extracted_at),
        )
      : null;
    return (
      <Banner tone="success" icon={<CheckCircle2 className="h-5 w-5 text-success" aria-hidden />}>
        <p>
          {when ? t("doneAt", { when }) : t("doneTitle")}{" "}
          {reviewCount > 0 ? (
            <span className="font-medium text-warning">{t("reviewHint", { count: reviewCount })}</span>
          ) : (
            <span className="text-muted-foreground">{t("checkHint")}</span>
          )}
        </p>
      </Banner>
    );
  }

  // Never extracted
  if (!contract.file_path || !canExtract) return null;
  return (
    <Banner tone="info" icon={<Sparkles className="h-5 w-5 text-primary" aria-hidden />}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">{t("promptTitle")}</p>
          <p className="text-muted-foreground">{t("promptBody")}</p>
        </div>
        <ExtractButton contract={contract} variant="default" />
      </div>
    </Banner>
  );
}

function Banner({
  tone,
  icon,
  live,
  children,
}: {
  tone: "info" | "critical" | "success";
  icon: React.ReactNode;
  live?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      role={live ? "status" : undefined}
      className={cn(
        "mb-6 flex gap-3 rounded-lg border px-4 py-3 text-sm",
        tone === "info" && "border-primary/20 bg-upcoming-soft",
        tone === "critical" && "border-critical/30 bg-critical-soft",
        tone === "success" && "border-success/20 bg-success-soft",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
