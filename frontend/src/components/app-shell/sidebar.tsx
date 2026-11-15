"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Logo } from "@/components/logo";
import { useCurrentUser } from "@/features/auth/api";
import { isAdmin } from "@/lib/permissions";
import { cn } from "@/lib/utils";

import { isActive, navItems, secondaryNavItems, type NavItem } from "./nav-items";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { data: user } = useCurrentUser();
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin(user));

  function renderLink(item: NavItem) {
    const active = isActive(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {t(item.labelKey)}
      </Link>
    );
  }

  return (
    <nav aria-label={t("main")} className="flex flex-1 flex-col p-3">
      <div className="flex flex-col gap-0.5">{visibleItems.map(renderLink)}</div>
      <div className="mt-auto flex flex-col gap-0.5 border-t border-sidebar-border pt-3">
        {secondaryNavItems.map(renderLink)}
      </div>
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <Logo />
      </div>
      <SidebarNav />
    </aside>
  );
}
