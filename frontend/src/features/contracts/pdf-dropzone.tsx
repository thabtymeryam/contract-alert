"use client";

import { FileText, UploadCloud, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const MAX_PDF_BYTES = 20 * 1024 * 1024;

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type PdfDropzoneProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  /** Shown when a PDF is already attached and no new one is selected */
  currentFileName?: string | null;
  disabled?: boolean;
};

export function PdfDropzone({ value, onChange, currentFileName, disabled }: PdfDropzoneProps) {
  const t = useTranslations("contracts.upload");
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function accept(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError(t("notPdf"));
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(t("tooLarge", { max: formatSize(MAX_PDF_BYTES) }));
      return;
    }
    setError(null);
    onChange(file);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) accept(event.dataTransfer.files[0]);
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2.5">
        <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.name}</p>
          <p className="text-xs text-muted-foreground">{formatSize(value.size)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label={t("remove", { name: value.name })}
        >
          <X aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center rounded-md border border-dashed px-4 py-6 text-center transition-colors",
          "focus-within:ring-2 focus-within:ring-ring hover:bg-muted/40",
          dragging && "border-primary bg-accent",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <UploadCloud className="h-6 w-6 text-muted-foreground" aria-hidden />
        <span className="mt-2 text-sm">
          <span className="font-medium text-primary">{t("choose")}</span> {t("orDrag")}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          {currentFileName ? t("replaceHint", { name: currentFileName }) : t("hint", { max: formatSize(MAX_PDF_BYTES) })}
        </span>
        <input
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            accept(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
