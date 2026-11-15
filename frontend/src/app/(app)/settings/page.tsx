"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition, type ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/features/auth/api";
import { ChangePasswordForm } from "@/features/users/change-password-form";
import { setUserLocale } from "@/i18n/actions";
import { locales } from "@/i18n/config";

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-b py-6 last:border-b-0 md:grid-cols-3 md:gap-8">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="md:col-span-2">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { data: user } = useCurrentUser();

  return (
    <>
      <PageHeader title={t("settings.title")} />

      <div className="rounded-lg border bg-card px-6">
        <Section title={t("settings.profile")}>
          {user ? (
            <dl className="grid max-w-sm grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{t("auth.email")}</dt>
              <dd className="truncate font-medium">{user.email}</dd>
              <dt className="text-muted-foreground">{t("users.columns.role")}</dt>
              <dd>
                <Badge variant="secondary" className="font-normal">
                  {t(`roles.${user.role}`)}
                </Badge>
              </dd>
            </dl>
          ) : (
            <Skeleton className="h-12 w-64" />
          )}
        </Section>

        <Section title={t("settings.password")} description={t("settings.passwordDescription")}>
          <ChangePasswordForm />
        </Section>

        <Section title={t("common.language")} description={t("settings.languageDescription")}>
          <Select
            value={locale}
            disabled={pending}
            onValueChange={(next) =>
              startTransition(async () => {
                await setUserLocale(next);
                router.refresh();
              })
            }
          >
            <SelectTrigger className="w-48" aria-label={t("common.language")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locales.map((l) => (
                <SelectItem key={l} value={l} lang={l}>
                  {t(`common.languages.${l}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Section>
      </div>
    </>
  );
}
