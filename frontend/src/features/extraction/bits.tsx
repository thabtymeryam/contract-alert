"use client";

import { AlertTriangle, Quote } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Below this the AI wasn't sure; the item is flagged for human review. */
export const REVIEW_THRESHOLD = 0.7;

/** Shows the contract text an item was extracted from, so the user can verify it. */
export function SourceText({ text }: { text: string | null | undefined }) {
  const t = useTranslations("extraction");
  if (!text) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
          <Quote aria-hidden />
          {t("source")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-h-72 w-96 max-w-[90vw] overflow-y-auto text-sm" align="start">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{t("sourceTitle")}</p>
        <blockquote className="whitespace-pre-line border-l-2 pl-3 italic">{text}</blockquote>
      </PopoverContent>
    </Popover>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: number | null | undefined }) {
  const t = useTranslations("extraction");
  if (confidence === null || confidence === undefined) return null;
  const pct = Math.round(confidence * 100);
  const needsReview = confidence < REVIEW_THRESHOLD;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        needsReview ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground",
      )}
      title={t("confidenceTitle", { pct })}
    >
      {needsReview && <AlertTriangle className="h-3 w-3" aria-hidden />}
      {needsReview ? t("review", { pct }) : t("confidence", { pct })}
    </span>
  );
}

export function TypeBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border bg-background px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

/**
 * Translated label for a backend enum value, e.g. enumLabel(t, "clauseType", "FORCE_MAJEURE").
 * Unknown values (AI output can drift) fall back to a readable version of the raw value.
 */
export function useEnumLabel() {
  const t = useTranslations("enums");
  return (group: string, value: string | null | undefined) => {
    if (!value) return null;
    const key = `${group}.${value}`;
    // next-intl's t.has guards against missing keys without logging errors
    return t.has(key as never) ? t(key as never) : value.replace(/_/g, " ").toLowerCase();
  };
}
