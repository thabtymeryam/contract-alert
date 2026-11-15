import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Brand mark: a contract (document) with a notification badge.
 * Drawn on a 32px grid so it stays crisp from favicon size up.
 * Keep in sync with src/app/icon.svg.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7 shrink-0", className)} aria-hidden focusable="false">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      {/* Document with a folded corner */}
      <path d="M9 8.5A1.5 1.5 0 0 1 10.5 7H18l5 5v12.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 9 24.5z" fill="#fff" />
      <path d="M18 7v3.5a1.5 1.5 0 0 0 1.5 1.5H23z" fill="#bfdbfe" />
      {/* Clause lines */}
      <rect x="12" y="15" width="8" height="1.75" rx=".875" className="fill-primary" opacity=".85" />
      <rect x="12" y="19" width="5.5" height="1.75" rx=".875" className="fill-primary" opacity=".5" />
      {/* Alert badge, ringed in the background color so it separates from the page */}
      <circle cx="23.5" cy="23.5" r="5.25" className="fill-primary" />
      <circle cx="23.5" cy="23.5" r="4" fill="#f59e0b" />
      <rect x="22.85" y="20.9" width="1.3" height="3.3" rx=".65" fill="#fff" />
      <circle cx="23.5" cy="25.55" r=".75" fill="#fff" />
    </svg>
  );
}

/** Mark + wordmark, linking home. */
export function Logo({ onClick, className }: { onClick?: () => void; className?: string }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <LogoMark />
      <span>
        Contract<span className="text-primary">Alert</span>
      </span>
    </Link>
  );
}
