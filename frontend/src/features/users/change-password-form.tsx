"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";

import { useChangePassword } from "./api";

export function ChangePasswordForm() {
  const t = useTranslations();
  const changePassword = useChangePassword();

  const schema = z
    .object({
      current_password: z.string().min(1, t("auth.passwordRequired")),
      new_password: z.string().min(8, t("users.passwordMin")),
      confirm: z.string(),
    })
    .refine((v) => v.new_password === v.confirm, { path: ["confirm"], message: t("settings.passwordMismatch") });
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: "", new_password: "", confirm: "" },
  });

  function onSubmit({ current_password, new_password }: Values) {
    changePassword.mutate(
      { current_password, new_password },
      {
        onSuccess: () => {
          toast.success(t("settings.passwordChanged"));
          form.reset();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 400) {
            form.setError("current_password", { message: t("settings.currentPasswordWrong") });
          } else {
            form.setError("root", { message: error.message });
          }
        },
      },
    );
  }

  const fields = [
    { name: "current_password", label: t("settings.currentPassword"), autoComplete: "current-password" },
    { name: "new_password", label: t("settings.newPassword"), autoComplete: "new-password" },
    { name: "confirm", label: t("settings.confirmPassword"), autoComplete: "new-password" },
  ] as const;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-sm space-y-4" noValidate>
        {fields.map(({ name, label, autoComplete }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete={autoComplete} {...field} />
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

        <Button type="submit" disabled={changePassword.isPending}>
          {changePassword.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {t("settings.updatePassword")}
        </Button>
      </form>
    </Form>
  );
}
