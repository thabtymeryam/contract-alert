"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Contract } from "@/types";

import { fileDisplayName, useUpdateContract } from "./api";
import { applyServerErrors, ContractForm, contractToFormValues, toContractPayload } from "./contract-form";

type EditContractSheetProps = {
  contract: Contract;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditContractSheet({ contract, open, onOpenChange }: EditContractSheetProps) {
  const t = useTranslations("contracts");
  const updateContract = useUpdateContract(contract.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="mb-6">
          <SheetTitle>{t("editTitle")}</SheetTitle>
          <SheetDescription>{contract.title}</SheetDescription>
        </SheetHeader>
        {/* Remount on open so the form starts from the latest saved values */}
        {open && (
          <ContractForm
            defaultValues={contractToFormValues(contract)}
            withFile
            currentFileName={fileDisplayName(contract.file_path)}
            pending={updateContract.isPending}
            submitLabel={t("save")}
            onCancel={() => onOpenChange(false)}
            onSubmit={(values, file, form) =>
              updateContract.mutate(
                { payload: toContractPayload(values), file },
                {
                  onSuccess: () => {
                    toast.success(t("savedToast"));
                    onOpenChange(false);
                  },
                  onError: (error) => applyServerErrors(form, error),
                },
              )
            }
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
