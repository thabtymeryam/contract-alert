"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-client";
import type { Contract, ContractStatus } from "@/types";

import { PdfDropzone } from "./pdf-dropzone";

const STATUSES: ContractStatus[] = ["draft", "active", "expired", "terminated"];

function useContractSchema() {
  const t = useTranslations("contracts.form");
  return z
    .object({
      title: z.string().trim().min(1, t("required")).max(255),
      description: z.string(),
      party_a: z.string().trim().min(1, t("required")).max(255),
      party_b: z.string().trim().min(1, t("required")).max(255),
      status: z.enum(["draft", "active", "expired", "terminated"]),
      start_date: z.string(),
      end_date: z.string(),
      renewal_date: z.string(),
      value: z
        .string()
        .trim()
        .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), t("invalidValue")),
    })
    .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
      path: ["end_date"],
      message: t("endBeforeStart"),
    });
}

export type ContractFormValues = z.infer<ReturnType<typeof useContractSchema>>;

/** Form strings -> API payload: empty optional fields become null so they can be cleared. */
export function toContractPayload(v: ContractFormValues) {
  return {
    title: v.title.trim(),
    description: v.description.trim() || null,
    party_a: v.party_a.trim(),
    party_b: v.party_b.trim(),
    status: v.status,
    start_date: v.start_date || null,
    end_date: v.end_date || null,
    renewal_date: v.renewal_date || null,
    value: v.value === "" ? null : Number(v.value),
  };
}

export function contractToFormValues(c?: Contract): ContractFormValues {
  return {
    title: c?.title ?? "",
    description: c?.description ?? "",
    party_a: c?.party_a ?? "",
    party_b: c?.party_b ?? "",
    status: c?.status ?? "draft",
    start_date: c?.start_date ?? "",
    end_date: c?.end_date ?? "",
    renewal_date: c?.renewal_date ?? "",
    value: c?.value != null ? String(c.value) : "",
  };
}

/** Puts FastAPI 422 field errors on the matching inputs; anything else goes to the form-level error. */
export function applyServerErrors(form: UseFormReturn<ContractFormValues>, error: Error) {
  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {};
  const known = Object.entries(fieldErrors).filter(([f]) => f in form.getValues());
  if (known.length) {
    for (const [field, message] of known) form.setError(field as keyof ContractFormValues, { message });
  } else {
    form.setError("root", { message: error.message });
  }
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-sm font-semibold">{legend}</legend>
      {children}
    </fieldset>
  );
}

type ContractFormProps = {
  defaultValues: ContractFormValues;
  onSubmit: (values: ContractFormValues, file: File | null, form: UseFormReturn<ContractFormValues>) => void;
  submitLabel: string;
  pending: boolean;
  onCancel?: () => void;
  /** Show the PDF picker (create form, or edit with replace) */
  withFile?: boolean;
  currentFileName?: string | null;
  /** Extra controls rendered above the buttons (e.g. "run extraction after upload") */
  footerExtra?: ReactNode;
};

export function ContractForm({
  defaultValues,
  onSubmit,
  submitLabel,
  pending,
  onCancel,
  withFile,
  currentFileName,
  footerExtra,
}: ContractFormProps) {
  const t = useTranslations();
  const schema = useContractSchema();
  const form = useForm<ContractFormValues>({ resolver: zodResolver(schema), defaultValues });
  const [file, setFile] = useState<File | null>(null);

  const dateFields = [
    { name: "start_date", label: t("contracts.columns.startDate") },
    { name: "end_date", label: t("contracts.columns.endDate") },
    { name: "renewal_date", label: t("contracts.columns.renewalDate") },
  ] as const;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(values, file, form))} className="space-y-8" noValidate>
        <Fieldset legend={t("contracts.form.details")}>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("contracts.columns.title")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("contracts.form.titlePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("contracts.columns.description")}{" "}
                  <span className="font-normal text-muted-foreground">({t("contracts.form.optional")})</span>
                </FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>{t("contracts.columns.status")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`contractStatus.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </Fieldset>

        <Fieldset legend={t("contracts.columns.parties")}>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["party_a", "party_b"] as const).map((name) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(`contracts.form.${name}`)}</FormLabel>
                    <FormControl>
                      <Input placeholder={t(`contracts.form.${name}Placeholder`)} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </Fieldset>

        <Fieldset legend={t("contracts.form.datesAndValue")}>
          <div className="grid gap-4 sm:grid-cols-3">
            {dateFields.map(({ name, label }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>{t("contracts.form.valueLabel")}</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="decimal" min={0} step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Fieldset>

        {withFile && (
          <Fieldset legend={t("contracts.form.document")}>
            <PdfDropzone value={file} onChange={setFile} currentFileName={currentFileName} disabled={pending} />
          </Fieldset>
        )}

        {footerExtra}

        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
              {t("common.cancel")}
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
