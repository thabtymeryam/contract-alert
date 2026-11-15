import { BellRing, ClipboardCheck, FileText, LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react";

export type NavItem = {
  /** Key under the "nav" namespace in the message files */
  labelKey: "dashboard" | "contracts" | "alerts" | "obligations" | "users" | "settings";
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

// Add new pages here as they ship
export const navItems: NavItem[] = [
  { labelKey: "dashboard", href: "/", icon: LayoutDashboard },
  { labelKey: "contracts", href: "/contracts", icon: FileText },
  { labelKey: "alerts", href: "/alerts", icon: BellRing },
  { labelKey: "obligations", href: "/obligations", icon: ClipboardCheck },
  { labelKey: "users", href: "/users", icon: Users, adminOnly: true },
];

/** Pinned to the bottom of the sidebar */
export const secondaryNavItems: NavItem[] = [{ labelKey: "settings", href: "/settings", icon: Settings }];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
