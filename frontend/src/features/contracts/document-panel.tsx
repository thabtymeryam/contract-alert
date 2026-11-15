"use client";

import { Download, ExternalLink, FileX } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import type { Contract } from "@/types";

import { contractFileUrl, fileDisplayName } from "./api";

type DocumentPanelProps = {
  contract: Contract;
  /** Opens the edit sheet so the user can attach a PDF; omitted when they can't edit */
  onUpload?: () => void;
};

export function DocumentPanel({ contract, onUpload }: DocumentPanelProps) {
  const t = useTranslations("contracts");

  if (!contract.file_path) {
    return (
      <EmptyState
        icon={FileX}
        title={t("noPdfTitle")}
        body={t("noPdfBody")}
        action={onUpload && <Button onClick={onUpload}>{t("attachPdf")}</Button>}
      />
    );
  }

  const url = contractFileUrl(contract.id);
  const name = fileDisplayName(contract.file_path) ?? "contract.pdf";

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
        <p className="min-w-0 truncate text-sm font-medium">{name}</p>
        <div className="flex gap-1">
          <Button asChild variant="ghost" size="sm">
            <a href={url} target="_blank" rel="noopener">
              <ExternalLink aria-hidden />
              {t("openPdf")}
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={`${url}?download=1`} download={name}>
              <Download aria-hidden />
              {t("downloadPdf")}
            </a>
          </Button>
        </div>
      </div>
      <iframe src={url} title={name} className="h-[75vh] w-full bg-muted" />
    </div>
  );
}
