"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";

import { useCreateUser } from "./api";

export function CreateUserDialog() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const createUser = useCreateUser();

  const schema = z.object({
    email: z.string().trim().email(t("auth.invalidEmail")),
    password: z.string().min(8, t("users.passwordMin")),
    role: z.enum(["admin", "user"]),
  });
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", role: "user" },
  });

  function onSubmit(values: Values) {
    createUser.mutate(values, {
      onSuccess: (user) => {
        toast.success(t("users.created", { email: user.email }));
        form.reset();
        setOpen(false);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          form.setError("email", { message: t("users.emailTaken") });
        } else if (error instanceof ApiError && Object.keys(error.fieldErrors).length) {
          for (const [field, message] of Object.entries(error.fieldErrors)) {
            if (field in values) form.setError(field as keyof Values, { message });
          }
        } else {
          form.setError("root", { message: error.message });
        }
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus aria-hidden />
          {t("users.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("users.addTitle")}</DialogTitle>
          <DialogDescription>{t("users.addDescription")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.email")}</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" placeholder="name@company.tn" {...field} />
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
                  <FormLabel>{t("users.tempPassword")}</FormLabel>
                  <FormControl>
                    <Input type="text" autoComplete="new-password" spellCheck={false} {...field} />
                  </FormControl>
                  <FormDescription>{t("users.tempPasswordHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("users.columns.role")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">{t("roles.user")}</SelectItem>
                      <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                    </SelectContent>
                  </Select>
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending && <Loader2 className="animate-spin" aria-hidden />}
                {t("users.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
