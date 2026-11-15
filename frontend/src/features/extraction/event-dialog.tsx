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
import { Textarea } from "@/components/ui/textarea";
import type { ContractEvent } from "@/types";

import { useSaveItem } from "./api";
import { EnumSelect } from "./enum-select";
import { EVENT_TYPES } from "./enums";

type EventDialogProps = {
  contractId: number;
  /** null = create a new date */
  event: ContractEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EventDialog({ contractId, event, open, onOpenChange }: EventDialogProps) {
  const t = useTranslations("extraction");
  const tc = useTranslations("common");
  const save = useSaveItem("events", contractId);

  const schema = z.object({
    type: z.string(),
    date: z.string().min(1, t("events.dateRequired")),
    description: z.string(),
  });
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { type: event?.type ?? "EXPIRATION", date: event?.date ?? "", description: event?.description ?? "" },
  });

  function onSubmit(values: Values) {
    save.mutate(
      { id: event?.id, data: { ...values, description: values.description || null } },
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? t("events.editTitle") : t("events.addTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("events.type")}</FormLabel>
                  <EnumSelect group="eventType" values={EVENT_TYPES} value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("events.date")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>{t("events.description")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
