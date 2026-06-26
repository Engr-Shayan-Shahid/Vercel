"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Leaf,
  Euro,
  Package,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Truck,
  BarChart3,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

import { useImports } from "@/context/imports-context";
import { useUserSettings } from "@/context/user-settings-context";
import { useShipmentRequests } from "@/components/shipments/use-shipment-requests";
import { getCurrentQuarter } from "@/lib/settings-schema";
import { getNextDeadline, getDaysUntilDeadline, getDeadlineUrgency } from "@/lib/cbam-deadlines";
import { importMatchesPeriod } from "@/types/emissions-report";
import { DEFAULT_ETS_PRICE } from "@/lib/cbam-constants";
import {
  formatTaxLiability,
  formatEmbeddedEmissions,
} from "@/lib/calculate-tax-liability";
import { ShipmentStatusBadge } from "@/components/shipments/shipment-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorCard } from "@/components/ui/error-card";
import { SectionErrorBoundary } from "@/components/ui/section-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCardsSkeleton } from "@/components/ui/stat-card-skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function DashboardContent() {
  const {
    imports,
    totalEmbeddedEmissions,
    totalTaxLiability,
    isLoading: importsLoading,
    error: importsError,
    refreshImports,
  } = useImports();
  const { settings } = useUserSettings();
  const {
    requests,
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useShipmentRequests();
  const { year, quarter } = getCurrentQuarter();
  const nextDeadline = getNextDeadline();
  const daysUntilDeadline = getDaysUntilDeadline();
  const deadlineUrgency = getDeadlineUrgency();

  const quarterImports = useMemo(
    () => imports.filter((r) => importMatchesPeriod(r, year, quarter)),
    [imports, year, quarter]
  );

  const activeRequests = useMemo(
    () => requests.filter((r) => r.status !== "cancelled" && r.status !== "rejected"),
    [requests]
  );

  const respondedRequests = useMemo(
    () => requests.filter((r) => r.status === "submitted" || r.status === "accepted"),
    [requests]
  );

  const supplierResponseRate =
    activeRequests.length > 0
      ? Math.round((respondedRequests.length / activeRequests.length) * 100)
      : 0;

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === "pending_exporter"),
    [requests]
  );

  const acceptedImportIds = useMemo(
    () =>
      new Set(
        requests
          .filter((r) => r.status === "accepted" && r.importLogId)
          .map((r) => r.importLogId!)
      ),
    [requests]
  );

  const complianceState: "ok" | "warning" | "urgent" = useMemo(() => {
    if (pendingRequests.length > 0 && daysUntilDeadline <= 30) return "urgent";
    if (pendingRequests.length > 0) return "warning";
    return "ok";
  }, [pendingRequests.length, daysUntilDeadline]);

  const recentImports = imports.slice(0, 5);
  const recentActivity = requests.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card px-4 py-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Organisation
          </p>
          <h1 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {settings.companyLegalName || "Importer Dashboard"}
          </h1>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {/* Live ETS price */}
          <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-sm font-semibold text-emerald-400">
              €{DEFAULT_ETS_PRICE}/tonne ETS
            </span>
          </div>

          {/* Deadline countdown */}
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-4 py-2.5",
              deadlineUrgency === "critical"
                ? "border-red-500/25 bg-red-500/10"
                : deadlineUrgency === "warning"
                  ? "border-amber-500/25 bg-amber-500/10"
                  : "border-border/60 bg-muted/20"
            )}
          >
            <CalendarClock
              className={cn(
                "h-4 w-4",
                deadlineUrgency === "critical"
                  ? "text-red-400"
                  : deadlineUrgency === "warning"
                    ? "text-amber-400"
                    : "text-muted-foreground"
              )}
            />
            <div>
              <p
                className={cn(
                  "text-sm font-semibold leading-none",
                  deadlineUrgency === "critical"
                    ? "text-red-400"
                    : deadlineUrgency === "warning"
                      ? "text-amber-400"
                      : "text-foreground"
                )}
              >
                {daysUntilDeadline}d until {nextDeadline.period} deadline
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {nextDeadline.date.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero Stat Row ── */}
      <SectionErrorBoundary title="Dashboard stats failed to load">
        {importsError ? (
          <ErrorCard message={importsError} onRetry={() => void refreshImports()} />
        ) : importsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCardsSkeleton count={4} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <HeroCard
              title="Total Embedded Emissions"
              value={imports.length > 0 ? formatEmbeddedEmissions(totalEmbeddedEmissions) : "—"}
              subtitle="tCO₂e across all imports"
              icon={Leaf}
              accent="emerald"
            />
            <HeroCard
              title="Estimated CBAM Liability"
              value={imports.length > 0 ? formatTaxLiability(totalTaxLiability) : "—"}
              subtitle={`At €${DEFAULT_ETS_PRICE}/tonne ETS`}
              icon={Euro}
              accent="blue"
            />
            <HeroCard
              title="Imports This Quarter"
              value={String(quarterImports.length)}
              subtitle={`${year} ${quarter}`}
              icon={Package}
              accent="violet"
            />
            <SupplierRateCard
              rate={supplierResponseRate}
              total={activeRequests.length}
              loading={requestsLoading}
            />
          </div>
        )}
      </SectionErrorBoundary>

      {/* ── Compliance Banner ── */}
      <ComplianceBanner
        state={complianceState}
        pendingCount={pendingRequests.length}
        daysUntilDeadline={daysUntilDeadline}
      />

      {/* ── Two Column Layout ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Recent Imports — 60% */}
        <div className="xl:col-span-3">
          <SectionErrorBoundary title="Recent imports failed to load">
          <Card className="h-full border-border/60 bg-card">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Recent Imports
                  </CardTitle>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Last 5 records with compliance status
                  </p>
                </div>
                <Link
                  href="/import-logs"
                  className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {importsError ? (
                <div className="p-4">
                  <ErrorCard message={importsError} onRetry={() => void refreshImports()} />
                </div>
              ) : importsLoading ? (
                <div className="divide-y divide-border/30">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-6">
                      <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : recentImports.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/30">
                    <Package className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No imports yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add your first import to start tracking CBAM liability
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/import-logs">Add first import</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {recentImports.map((record, idx) => {
                    const isVerified = acceptedImportIds.has(record.id);
                    return (
                      <div
                        key={record.id}
                        className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/10"
                      >
                        {/* Index dot */}
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/30 text-[11px] font-semibold text-muted-foreground">
                          {idx + 1}
                        </div>

                        {/* Main info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {record.materialType}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              · {record.originCountry}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {record.mass.toLocaleString()} t &middot; {record.importDate}
                          </p>
                        </div>

                        {/* Financials */}
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {formatTaxLiability(record.taxLiability)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatEmbeddedEmissions(record.embeddedEmissions)}
                          </p>
                        </div>

                        {/* Status chip */}
                        <div className="shrink-0">
                          {isVerified ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400"
                            >
                              Verified
                            </Badge>
                          ) : record.proofOfPaymentFileName ? (
                            <Badge
                              variant="outline"
                              className="border-blue-500/30 bg-blue-500/10 text-xs text-blue-400"
                            >
                              With proof
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 bg-amber-500/10 text-xs text-amber-400"
                            >
                              Manual
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          </SectionErrorBoundary>
        </div>

        {/* Supplier Activity — 40% */}
        <div className="xl:col-span-2">
          <SectionErrorBoundary title="Supplier activity failed to load">
          <Card className="h-full border-border/60 bg-card">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Supplier Activity
                  </CardTitle>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Recent data requests
                  </p>
                </div>
                <Link
                  href="/shipments"
                  className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {requestsError ? (
                <ErrorCard message={requestsError} onRetry={() => void refetchRequests()} />
              ) : requestsLoading ? (
                <div className="space-y-2.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg px-1 py-2">
                      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-36" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/30">
                    <Truck className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No requests yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Invite suppliers to share verified emission data
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/shipments">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Request data
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border/40 bg-muted/10 px-3.5 py-3 transition-colors hover:bg-muted/20"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {req.materialType} &middot; {req.mass.toLocaleString()} t
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {req.exporterEmail}
                        </p>
                      </div>
                      <ShipmentStatusBadge status={req.status} />
                    </div>
                  ))}
                  <Button asChild size="sm" variant="outline" className="mt-2 w-full">
                    <Link href="/shipments">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Request supplier data
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          </SectionErrorBoundary>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickActionCard
          href="/import-logs"
          icon={Plus}
          accent="emerald"
          title="Add Import"
          description="Log a new CBAM goods import and compute liability"
        />
        <QuickActionCard
          href="/shipments"
          icon={Truck}
          accent="blue"
          title="Request Supplier Data"
          description="Invite a supplier to submit verified emission factors"
        />
        <QuickActionCard
          href="/emissions-reports"
          icon={BarChart3}
          accent="violet"
          title="Generate Report"
          description="Create a quarterly CBAM emissions declaration report"
        />
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type Accent = "emerald" | "blue" | "violet" | "amber" | "red";

const ACCENT_CLASSES: Record<
  Accent,
  { icon: string; iconBg: string; ring: string; glow: string }
> = {
  emerald: {
    icon: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    glow: "from-emerald-500/5",
  },
  blue: {
    icon: "text-blue-400",
    iconBg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
    glow: "from-blue-500/5",
  },
  violet: {
    icon: "text-violet-400",
    iconBg: "bg-violet-500/10",
    ring: "ring-violet-500/20",
    glow: "from-violet-500/5",
  },
  amber: {
    icon: "text-amber-400",
    iconBg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    glow: "from-amber-500/5",
  },
  red: {
    icon: "text-red-400",
    iconBg: "bg-red-500/10",
    ring: "ring-red-500/20",
    glow: "from-red-500/5",
  },
};

function HeroCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  accent: Accent;
}) {
  const ac = ACCENT_CLASSES[accent];

  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card transition-all duration-200 hover:border-border hover:shadow-md">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-60",
          ac.glow
        )}
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg ring-1", ac.iconBg, ac.ring)}>
            <Icon className={cn("h-[18px] w-[18px]", ac.icon)} strokeWidth={1.75} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierRateCard({
  rate,
  total,
  loading,
}: {
  rate: number;
  total: number;
  loading: boolean;
}) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card transition-all duration-200 hover:border-border hover:shadow-md">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-60" />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Supplier Response Rate
          </p>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 ring-1 ring-orange-500/20">
            <Users className="h-[18px] w-[18px] text-orange-400" strokeWidth={1.75} />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4">
          {loading ? (
            <>
              <Skeleton className="h-[72px] w-[72px] shrink-0 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
            </>
          ) : (
            <>
              {/* Progress ring */}
              <div className="relative shrink-0">
                <svg width="72" height="72" className="-rotate-90">
                  <circle
                    cx="36" cy="36" r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-muted/20"
                  />
                  <circle
                    cx="36" cy="36" r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={cn(
                      "transition-all duration-700",
                      rate >= 80 ? "text-emerald-400" : rate >= 50 ? "text-amber-400" : "text-red-400"
                    )}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                  {total === 0 ? "—" : `${rate}%`}
                </span>
              </div>

              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {total === 0 ? "—" : `${rate}%`}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {total === 0 ? "No active requests" : `${respondedOf(rate, total)}/${total} responded`}
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function respondedOf(rate: number, total: number) {
  return Math.round((rate / 100) * total);
}

function ComplianceBanner({
  state,
  pendingCount,
  daysUntilDeadline,
}: {
  state: "ok" | "warning" | "urgent";
  pendingCount: number;
  daysUntilDeadline: number;
}) {
  if (state === "ok") {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-300">
            Fully Compliant — Ready to declare
          </p>
          <p className="mt-0.5 text-xs text-emerald-400/70">
            All supplier data is accounted for. Generate your report when ready.
          </p>
        </div>
        <div className="ml-auto shrink-0">
          <Button asChild size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white border-0">
            <Link href="/emissions-reports">Generate report</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (state === "urgent") {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-red-500/25 bg-red-500/10 px-6 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-300">
            Urgent — {pendingCount} supplier{pendingCount !== 1 ? "s" : ""} pending &amp; deadline in {daysUntilDeadline} days
          </p>
          <p className="mt-0.5 text-xs text-red-400/70">
            Chase outstanding requests immediately to meet your filing deadline.
          </p>
        </div>
        <div className="ml-auto shrink-0">
          <Button asChild size="sm" variant="destructive">
            <Link href="/shipments">Chase suppliers</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-6 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
        <Clock className="h-5 w-5 text-amber-400" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-amber-300">
          {pendingCount} import{pendingCount !== 1 ? "s" : ""} missing supplier data — action required
        </p>
        <p className="mt-0.5 text-xs text-amber-400/70">
          Request verified emission factors from your suppliers to reduce liability.
        </p>
      </div>
      <div className="ml-auto shrink-0">
        <Button
          asChild
          size="sm"
          className="border border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
        >
          <Link href="/shipments">Request data</Link>
        </Button>
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  accent,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  accent: Accent;
  title: string;
  description: string;
}) {
  const ac = ACCENT_CLASSES[accent];

  return (
    <Link href={href} className="group block">
      <Card className="h-full cursor-pointer border-border/60 bg-card transition-all duration-200 hover:border-border hover:shadow-md group-hover:-translate-y-0.5">
        <CardContent className="p-6">
          <div
            className={cn(
              "mb-4 flex h-11 w-11 items-center justify-center rounded-xl ring-1",
              ac.iconBg,
              ac.ring
            )}
          >
            <Icon className={cn("h-5 w-5", ac.icon)} strokeWidth={1.75} />
          </div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
          <div
            className={cn(
              "mt-4 flex items-center gap-1 text-xs font-medium transition-colors",
              ac.icon,
              "opacity-70 group-hover:opacity-100"
            )}
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
