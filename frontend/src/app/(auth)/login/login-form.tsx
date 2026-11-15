"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/features/auth/api";
import { ApiError } from "@/lib/api-client";

/** Only same-origin paths, so ?next= can't be used as an open redirect. */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();

  const schema = z.object({
    email: z.string().trim().email(t("auth.invalidEmail")),
    password: z.string().min(1, t("auth.passwordRequired")),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof schema>) {
    login.mutate(values, {
      onSuccess: () => {
        router.replace(safeNext(searchParams.get("next")));
        router.refresh();
      },
    });
  }

  const error = login.error;
  const errorMessage =
    error instanceof ApiError
      ? error.status === 401
        ? t("auth.invalidCredentials")
        : error.status === 403
          ? t("auth.inactive")
          : error.status === 502
            ? t("errors.backendUnavailable")
            : error.message
      : error
        ? t("errors.generic")
        : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.email")}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" autoFocus placeholder="name@company.tn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.password")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {login.isPending ? t("auth.submitting") : t("auth.submit")}
        </Button>
      </form>
    </Form>
  );
}
