"use client";

import { ArrowLeft, FileQuestion, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/states";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/features/auth/api";
import { useContract, useDeleteContract } from "@/features/contracts/api";
import { ContractOverview } from "@/features/contracts/contract-overview";
import { ContractStatusBadge } from "@/features/contracts/contract-status-badge";
import { DocumentPanel } from "@/features/contracts/document-panel";
import { EditContractSheet } from "@/features/contracts/edit-contract-sheet";
import { useContractDetails, useExtractionPolling } from "@/features/extraction/api";
import { REVIEW_THRESHOLD } from "@/features/extraction/bits";
import { ClausesTab } from "@/features/extraction/clauses-tab";
import { EventsTab } from "@/features/extraction/events-tab";
import { ExtractButton, ExtractionBanner } from "@/features/extraction/extraction-controls";
import { PartiesTab } from "@/features/extraction/parties-tab";
import { PaymentsTab, PenaltiesTab } from "@/features/extraction/terms-tabs";
import { ObligationsPanel } from "@/features/obligations/obligations-panel";
import { ApiError } from "@/lib/api-client";

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The open tab lives in the URL (?tab=clauses): it survives reloads and re-renders, and links can open a tab
  const tab = searchParams.get("tab") ?? "overview";
  const setTab = (value: string) => {
    const next = new URLSearchParams(window.location.search);
    if (value === "overview") next.delete("tab");
    else next.set("tab", value);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const id = Number(params.id);
  const { data: contract, isPending, error, refetch } = useContract(id);
  const { can } = usePermissions();
  const deleteContract = useDeleteContract();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: details } = useContractDetails(id);

  const onExtractionFinished = useCallback(
    (status: "done" | "failed") =>
      status === "done" ? toast.success(t("extraction.doneToast")) : toast.error(t("extraction.failedToast")),
    [t],
  );
  useExtractionPolling(contract, onExtractionFinished);

  const backLink = (
    <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
      <Link href="/contracts">
        <ArrowLeft aria-hidden />
        {t("contracts.backToList")}
      </Link>
    </Button>
  );

  if (isPending) {
    return (
      <div aria-busy="true" aria-label={t("common.loading")}>
        {backLink}
        <Skeleton className="h-8 w-80" />
        <Skeleton className="mt-2 h-4 w-60" />
        <Skeleton className="mt-8 h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        {backLink}
        {error instanceof ApiError && (error.status === 404 || error.status === 422) ? (
          <EmptyState icon={FileQuestion} title={t("contracts.notFoundTitle")} body={t("contracts.notFoundBody")} />
        ) : (
          <ErrorState error={error} onRetry={() => refetch()} />
        )}
      </>
    );
  }

  const canEdit = can({ action: "contract:edit", contract });
  const canDelete = can({ action: "contract:delete", contract });
  const canExtract = can({ action: "contract:extract", contract });
  const reviewCount = (details?.clauses ?? []).filter(
    (c) => c.confidence !== null && c.confidence < REVIEW_THRESHOLD,
  ).length;

  return (
    <>
      {backLink}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{contract.title}</h1>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {contract.party_a} · {contract.party_b}
          </p>
        </div>
        {(canEdit || canDelete || canExtract) && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {canExtract && <ExtractButton contract={contract} />}
            {canEdit && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil aria-hidden />
                {t("contracts.edit")}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 aria-hidden />
                {t("contracts.delete")}
              </Button>
            )}
          </div>
        )}
      </div>

      <ExtractionBanner contract={contract} canExtract={canExtract} reviewCount={reviewCount} />

      <Tabs value={tab} onValueChange={setTab}>
        {/* Scrolls sideways on small screens instead of wrapping */}
        <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList>
            <TabsTrigger value="overview">{t("contracts.tabs.overview")}</TabsTrigger>
            {(
              [
                ["parties", "parties", details?.parties.length],
                ["clauses", "clauses", details?.clauses.length],
                ["keyDates", "keyDates", details?.events.length],
                ["obligations", "obligations", details?.obligations.length],
                ["payments", "payments", details?.payment_terms.length],
                ["penalties", "penalties", details?.penalties.length],
              ] as const
            ).map(([value, labelKey, count]) => (
              <TabsTrigger key={value} value={value}>
                {t(`contracts.tabs.${labelKey}`)}
                {count ? <span className="ml-1.5 tabular-nums text-muted-foreground">{count}</span> : null}
              </TabsTrigger>
            ))}
            <TabsTrigger value="document">{t("contracts.tabs.document")}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview">
          <ContractOverview contract={contract} />
        </TabsContent>
        {details ? (
          <>
            <TabsContent value="parties">
              <PartiesTab contractId={id} parties={details.parties} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="clauses">
              <ClausesTab contractId={id} clauses={details.clauses} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="keyDates">
              <EventsTab contractId={id} events={details.events} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="obligations">
              <ObligationsPanel contractId={id} obligations={details.obligations} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="payments">
              <PaymentsTab payments={details.payment_terms} canEdit={canExtract} />
            </TabsContent>
            <TabsContent value="penalties">
              <PenaltiesTab penalties={details.penalties} canEdit={canExtract} />
            </TabsContent>
          </>
        ) : (
          ["parties", "clauses", "keyDates", "obligations", "payments", "penalties"].map((value) => (
            <TabsContent key={value} value={value}>
              <Skeleton className="h-40 w-full" />
            </TabsContent>
          ))
        )}
        <TabsContent value="document">
          <DocumentPanel contract={contract} onUpload={canEdit ? () => setEditOpen(true) : undefined} />
        </TabsContent>
      </Tabs>

      {canEdit && <EditContractSheet contract={contract} open={editOpen} onOpenChange={setEditOpen} />}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("contracts.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("contracts.deleteBody", { title: contract.title })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteContract.mutate(contract.id, {
                  onSuccess: () => {
                    toast.success(t("contracts.deletedToast", { title: contract.title }));
                    router.push("/contracts");
                  },
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              {t("contracts.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
