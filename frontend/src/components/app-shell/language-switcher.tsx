"use client";

import { Check, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setUserLocale } from "@/i18n/actions";
import { locales } from "@/i18n/config";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function select(locale: string) {
    startTransition(async () => {
      await setUserLocale(locale);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={pending} aria-label={t("language")}>
          <Languages aria-hidden />
          <span className="uppercase">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem key={locale} onSelect={() => select(locale)} lang={locale}>
            <Check className={locale === current ? "opacity-100" : "opacity-0"} aria-hidden />
            {t(`languages.${locale}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
