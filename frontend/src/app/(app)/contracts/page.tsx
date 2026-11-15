"use client";

import { FileText, Plus, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/features/auth/api";
import { useContracts } from "@/features/contracts/api";
import { ContractsTable } from "@/features/contracts/contracts-table";
import type { Contract, ContractStatus } from "@/types";

const STATUSES: ContractStatus[] = ["draft", "active", "expired", "terminated"];

/** Contracts with no end date sort last; otherwise soonest end date first. */
function byEndDate(a: Contract, b: Contract) {
  if (!a.end_date) return b.end_date ? 1 : 0;
  if (!b.end_date) return -1;
  return a.end_date.localeCompare(b.end_date);
}

export default function ContractsPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: user } = useCurrentUser();
  const { data: contracts, isPending, error, refetch } = useContracts();

  // Filters live in the URL so a filtered view can be shared or bookmarked
  const urlQuery = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "all";
  const scope = searchParams.get("scope") === "mine" ? "mine" : "all";

  // The search box keeps its own state: binding it straight to the URL dropped keystrokes,
  // because router.replace is async. The URL catches up after a short pause in typing.
  const [q, setQ] = useState(urlQuery);
  useEffect(() => setQ(urlQuery), [urlQuery]);

  function setParam(key: string, value: string, defaultValue: string) {
    const next = new URLSearchParams(window.location.search);
    if (value === defaultValue) next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  useEffect(() => {
    if (q === urlQuery) return;
    const timer = setTimeout(() => setParam("q", q, ""), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the typed text changes
  }, [q]);

  const filtered = useMemo(() => {
    if (!contracts) return [];
    const needle = q.trim().toLowerCase();
    return contracts
      .filter((c) => scope === "all" || c.user_id === user?.id)
      .filter((c) => status === "all" || c.status === status)
      .filter(
        (c) =>
          !needle ||
          [c.title, c.party_a, c.party_b, c.description ?? ""].some((field) => field.toLowerCase().includes(needle)),
      )
      .sort(byEndDate);
  }, [contracts, q, status, scope, user?.id]);

  const hasFilters = q !== "" || status !== "all" || scope !== "all";

  return (
    <>
      <PageHeader
        title={t("contracts.title")}
        description={t("contracts.description")}
        actions={
          <Button asChild>
            <Link href="/contracts/new">
              <Plus aria-hidden />
              {t("contracts.new")}
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("contracts.searchPlaceholder")}
            aria-label={t("contracts.searchPlaceholder")}
            className="pl-8"
          />
        </div>
        <Select value={status} onValueChange={(v) => setParam("status", v, "all")}>
          <SelectTrigger className="sm:w-44" aria-label={t("contracts.columns.status")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("contracts.allStatuses")}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`contractStatus.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tabs value={scope} onValueChange={(v) => setParam("scope", v, "all")}>
          <TabsList aria-label={t("contracts.scopeLabel")}>
            <TabsTrigger value="all">{t("contracts.scopeAll")}</TabsTrigger>
            <TabsTrigger value="mine">{t("contracts.scopeMine")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label={t("contracts.loadingLabel")}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t("contracts.emptyTitle")}
          body={t("contracts.emptyBody")}
          action={
            <Button asChild>
              <Link href="/contracts/new">
                <Plus aria-hidden />
                {t("contracts.new")}
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={t("contracts.noMatchTitle")}
          body={t("contracts.noMatchBody")}
          action={
            hasFilters && (
              <Button variant="outline" onClick={() => router.replace(pathname)}>
                {t("contracts.clearFilters")}
              </Button>
            )
          }
        />
      ) : (
        <>
          <ContractsTable contracts={filtered} />
          <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
            {t("contracts.count", { shown: filtered.length, total: contracts.length })}
          </p>
        </>
      )}
    </>
  );
}
