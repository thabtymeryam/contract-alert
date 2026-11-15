"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Party } from "@/types";

import { useSaveItem } from "./api";
import { EnumSelect } from "./enum-select";
import { PARTY_ROLES, PARTY_TYPES } from "./enums";

type PartyDialogProps = {
  contractId: number;
  /** null = add a new party */
  party: Party | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TEXT_FIELDS = ["registration_number", "address", "contact_email", "contact_phone"] as const;

export function PartyDialog({ contractId, party, open, onOpenChange }: PartyDialogProps) {
  const t = useTranslations("extraction");
  const tc = useTranslations("common");
  const save = useSaveItem("parties", contractId);

  const schema = z.object({
    name: z.string().trim().min(1, t("parties.nameRequired")).max(255),
    type: z.string(),
    role: z.string(),
    registration_number: z.string().max(255),
    address: z.string(),
    contact_email: z.union([z.literal(""), z.string().trim().email(t("parties.invalidEmail"))]),
    contact_phone: z.string().max(100),
  });
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: party?.name ?? "",
      type: party?.type ?? "COMPANY",
      role: party?.role ?? "OTHER",
      registration_number: party?.registration_number ?? "",
      address: party?.address ?? "",
      contact_email: party?.contact_email ?? "",
      contact_phone: party?.contact_phone ?? "",
    },
  });

  function onSubmit(values: Values) {
    const data: Record<string, unknown> = { ...values };
    for (const field of TEXT_FIELDS) data[field] = values[field] || null;
    save.mutate(
      { id: party?.id, data },
      {
        onSuccess: () => {
          toast.success(t("saved"));
          onOpenChange(false);
        },
        onError: (e) => form.setError("root", { message: e.message }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{party ? t("parties.editTitle") : t("parties.addTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("parties.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("parties.role")}</FormLabel>
                    <EnumSelect group="partyRole" values={PARTY_ROLES} value={field.value} onChange={field.onChange} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("parties.type")}</FormLabel>
                    <EnumSelect group="partyType" values={PARTY_TYPES} value={field.value} onChange={field.onChange} />
                  </FormItem>
                )}
              />
            </div>
            {TEXT_FIELDS.map((name) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(`parties.${name}`)}</FormLabel>
                    <FormControl>
                      <Input type={name === "contact_email" ? "email" : "text"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            {form.formState.errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" aria-hidden />}
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
