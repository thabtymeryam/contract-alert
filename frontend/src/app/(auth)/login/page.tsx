import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { LanguageSwitcher } from "@/components/app-shell/language-switcher";
import { Logo } from "@/components/logo";

import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("title") };
}

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Logo />
        <LanguageSwitcher />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">{t("noAccount")}</p>
        </div>
      </main>
    </div>
  );
}
