"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useCreateContract } from "@/features/contracts/api";
import {
  applyServerErrors,
  ContractForm,
  contractToFormValues,
  toContractPayload,
} from "@/features/contracts/contract-form";

export default function NewContractPage() {
  const t = useTranslations("contracts");
  const router = useRouter();
  const createContract = useCreateContract();

  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
        <Link href="/contracts">
          <ArrowLeft aria-hidden />
          {t("backToList")}
        </Link>
      </Button>
      <PageHeader title={t("newTitle")} description={t("newDescription")} />

      <div className="rounded-lg border bg-card p-6">
        <ContractForm
          defaultValues={contractToFormValues()}
          withFile
          pending={createContract.isPending}
          submitLabel={t("create")}
          onCancel={() => router.push("/contracts")}
          onSubmit={(values, file, form) =>
            createContract.mutate(
              { payload: toContractPayload(values), file },
              {
                onSuccess: (contract) => {
                  toast.success(t("createdToast", { title: contract.title }));
                  router.push(`/contracts/${contract.id}`);
                },
                onError: (error) => applyServerErrors(form, error),
              },
            )
          }
        />
      </div>
    </div>
  );
}
