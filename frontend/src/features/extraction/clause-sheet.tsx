"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { Clause } from "@/types";

import { useSaveItem } from "./api";
import { EnumSelect } from "./enum-select";
import { CLAUSE_TYPES } from "./enums";

const schema = z.object({
  clause_number: z.string().max(50),
  title: z.string().trim().max(255),
  type: z.string(),
  summary: z.string(),
  text: z.string(),
  is_important: z.boolean(),
});
type Values = z.infer<typeof schema>;

type ClauseSheetProps = { contractId: number; clause: Clause; open: boolean; onOpenChange: (open: boolean) => void };

export function ClauseSheet({ contractId, clause, open, onOpenChange }: ClauseSheetProps) {
  const t = useTranslations("extraction");
  const tc = useTranslations("common");
  const save = useSaveItem("clauses", contractId);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      clause_number: clause.clause_number ?? "",
      title: clause.title ?? "",
      type: clause.type ?? "OTHER",
      summary: clause.summary ?? "",
      text: clause.text ?? "",
      is_important: clause.is_important,
    },
  });

  function onSubmit(values: Values) {
    const data = {
      ...values,
      clause_number: values.clause_number || null,
      title: values.title || null,
      summary: values.summary || null,
      text: values.text || null,
    };
    save.mutate(
      { id: clause.id, data },
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>{t("clauses.editTitle")}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-[6rem_1fr] gap-3">
              <FormField
                control={form.control}
                name="clause_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("clauses.number")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("clauses.title")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clauses.type")}</FormLabel>
                  <EnumSelect group="clauseType" values={CLAUSE_TYPES} value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clauses.summary")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clauses.fullText")}</FormLabel>
                  <FormControl>
                    <Textarea rows={8} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_important"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                  </FormControl>
                  <FormLabel className="font-normal">{t("clauses.markImportant")}</FormLabel>
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" aria-hidden />}
                {t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
