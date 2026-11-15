"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { NotificationBell } from "@/features/notifications/notification-bell";

import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "@/components/logo";

import { Sidebar, SidebarNav } from "./sidebar";
import { UserMenu } from "./user-menu";

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("openMenu")}>
                <Menu aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-64 flex-col gap-0 p-0">
              <SheetTitle className="flex h-14 items-center border-b px-5">
                <Logo onClick={() => setMobileNavOpen(false)} />
              </SheetTitle>
              <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="lg:hidden">
            <Logo />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <LanguageSwitcher />
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
