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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEnumLabel } from "@/features/extraction/bits";
import { useUsers } from "@/features/users/api";
import type { Obligation } from "@/types";

import { useSaveObligation } from "./api";
import { FREQUENCIES, OBLIGATION_TYPES } from "./obligation-status";

// Radix Select can't hold an empty value, so "nothing selected" is this sentinel
const NONE = "none";

type ObligationDialogProps = {
  contractId: number;
  /** null = create */
  obligation: Obligation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ObligationDialog({ contractId, obligation, open, onOpenChange }: ObligationDialogProps) {
  const t = useTranslations("obligations");
  const tc = useTranslations("common");
  const label = useEnumLabel();
  const { data: users } = useUsers();
  const save = useSaveObligation(contractId);

  const schema = z.object({
    title: z.string().trim().min(1, t("titleRequired")).max(255),
    description: z.string(),
    obligation_type: z.string(),
    frequency: z.string(),
    due_date: z.string(),
    responsible_user_id: z.string(),
  });
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: obligation?.title ?? "",
      description: obligation?.description ?? "",
      obligation_type: obligation?.obligation_type ?? NONE,
      frequency: obligation?.frequency ?? NONE,
      due_date: obligation?.due_date ?? "",
      responsible_user_id: obligation?.responsible_user_id ? String(obligation.responsible_user_id) : NONE,
    },
  });

  function onSubmit(v: Values) {
    const data = {
      title: v.title.trim(),
      description: v.description.trim() || null,
      obligation_type: v.obligation_type === NONE ? null : v.obligation_type,
      frequency: v.frequency === NONE ? null : v.frequency,
      due_date: v.due_date || null,
      responsible_user_id: v.responsible_user_id === NONE ? null : Number(v.responsible_user_id),
    };
    save.mutate(
      { id: obligation?.id, data },
      {
        onSuccess: () => {
          toast.success(t("saved"));
          onOpenChange(false);
        },
        onError: (e) => form.setError("root", { message: e.message }),
      },
    );
  }

  const activeUsers = (users ?? []).filter((u) => u.is_active || u.id === obligation?.responsible_user_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{obligation ? t("editTitle") : t("addTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("titlePlaceholder")} {...field} />
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
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="responsible_user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("assignee")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>{t("unassigned")}</SelectItem>
                        {activeUsers.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dueDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {(
                [
                  ["obligation_type", "obligationType", OBLIGATION_TYPES, t("type")],
                  ["frequency", "frequency", FREQUENCIES, t("frequency")],
                ] as const
              ).map(([name, group, values, fieldLabel]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fieldLabel}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE}>{t("notSpecified")}</SelectItem>
                          {/* Keep a value the AI produced even if it isn't in the list */}
                          {field.value !== NONE && !(values as readonly string[]).includes(field.value) && (
                            <SelectItem value={field.value}>{label(group, field.value)}</SelectItem>
                          )}
                          {values.map((v) => (
                            <SelectItem key={v} value={v}>
                              {label(group, v)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              ))}
            </div>
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
