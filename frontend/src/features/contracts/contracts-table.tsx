"use client";

import { FileText, Paperclip } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { Contract } from "@/types";

import { ContractStatusBadge } from "./contract-status-badge";
import { Deadline } from "./deadline";

export function ContractsTable({ contracts }: { contracts: Contract[] }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>{t("contracts.columns.title")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("contracts.columns.parties")}</TableHead>
            <TableHead>{t("contracts.columns.status")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("contracts.columns.endDate")}</TableHead>
            <TableHead className="hidden text-right lg:table-cell">{t("contracts.columns.value")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.id} className="group relative cursor-pointer">
              <TableCell className="max-w-xs">
                <Link
                  href={`/contracts/${contract.id}`}
                  className="flex items-center gap-2 font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate group-hover:underline">{contract.title}</span>
                  {contract.file_path && (
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label={t("contracts.hasPdf")} />
                  )}
                </Link>
              </TableCell>
              <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                {contract.party_a} · {contract.party_b}
              </TableCell>
              <TableCell>
                <ContractStatusBadge status={contract.status} />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Deadline date={contract.end_date} />
              </TableCell>
              <TableCell className="hidden text-right tabular-nums lg:table-cell">
                {formatCurrency(contract.value, locale) ?? t("common.notSet")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
