"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO, startOfDay, endOfDay, subDays } from "date-fns";
import { ShieldCheck, RefreshCw, ChevronDown, ScrollText } from "lucide-react";

import { createBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { SectionErrorBoundary } from "@/components/ui/section-error-boundary";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuditAction } from "@/lib/audit-logger";
import type { Database } from "@/types/database";

type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];

interface AuditLogEntry extends AuditLogRow {
  userEmail?: string;
}

const ACTION_LABELS: Record<string, string> = {
  [AuditAction.IMPORT_CREATED]: "Import Created",
  [AuditAction.IMPORT_UPDATED]: "Import Updated",
  [AuditAction.IMPORT_DELETED]: "Import Deleted",
  [AuditAction.REPORT_GENERATED]: "Report Generated",
  [AuditAction.SUPPLIER_INVITED]: "Supplier Invited",
  [AuditAction.SUPPLIER_DATA_RECEIVED]: "Supplier Data Received",
  [AuditAction.DECLARATION_SUBMITTED]: "Declaration Submitted",
};

const ACTION_VARIANTS: Record<string, "default" | "secondary" | "warning" | "outline" | "success" | "muted"> = {
  [AuditAction.IMPORT_CREATED]: "success",
  [AuditAction.IMPORT_UPDATED]: "secondary",
  [AuditAction.IMPORT_DELETED]: "warning",
  [AuditAction.REPORT_GENERATED]: "default",
  [AuditAction.SUPPLIER_INVITED]: "secondary",
  [AuditAction.SUPPLIER_DATA_RECEIVED]: "success",
  [AuditAction.DECLARATION_SUBMITTED]: "default",
};

const ENTITY_LABELS: Record<string, string> = {
  import_log: "Import Log",
  emissions_report: "Emissions Report",
  shipment_request: "Shipment Request",
};

const DATE_RANGE_OPTIONS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All time", value: "all" },
];

const PAGE_SIZE = 25;

export function AuditLogPageContent() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

  const fetchLogs = useCallback(async (reset = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const currentPage = reset ? 0 : page;

      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      if (dateRange !== "all") {
        const days = parseInt(dateRange, 10);
        const from = startOfDay(subDays(new Date(), days)).toISOString();
        query = query.gte("created_at", from);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      const rows = (data ?? []) as AuditLogRow[];
      setHasMore(rows.length > PAGE_SIZE);
      const pageRows = rows.slice(0, PAGE_SIZE);

      if (reset) {
        setPage(0);
        setEntries(pageRows);
      } else {
        setEntries((prev) => [...prev, ...pageRows]);
      }

      // Fetch emails for user IDs we haven't seen yet
      const newUserIds = [...new Set(pageRows.map((r) => r.user_id))].filter(
        (id) => !userEmails[id]
      );

      if (newUserIds.length > 0) {
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", newUserIds);

        if (profileRows) {
          const emailMap: Record<string, string> = {};
          for (const p of profileRows as { user_id: string; email: string }[]) {
            emailMap[p.user_id] = p.email;
          }
          setUserEmails((prev) => ({ ...prev, ...emailMap }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter, dateRange, userEmails]);

  // Reset and reload when filters change
  useEffect(() => {
    void fetchLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, dateRange]);

  const handleLoadMore = () => {
    setPage((p) => p + 1);
  };

  useEffect(() => {
    if (page > 0) {
      void fetchLogs(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const enrichedEntries = useMemo(
    () =>
      entries.map((e) => ({
        ...e,
        userEmail: userEmails[e.user_id] ?? e.user_id.slice(0, 8) + "…",
      })),
    [entries, userEmails]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Audit Log
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Complete record of all significant actions taken within your organisation.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs(true)}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Action type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-52 h-9">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {Object.entries(AuditAction).map(([, value]) => (
                    <SelectItem key={value} value={value}>
                      {ACTION_LABELS[value] ?? value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <ErrorCard message={error} onRetry={() => void fetchLogs(true)} />
      )}

      {/* Table */}
      <SectionErrorBoundary title="Audit log failed to load">
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading && entries.length === 0 ? (
              <div className="p-4">
                <TableSkeleton columns={5} rows={8} />
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-44 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    User
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Action
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Entity
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        icon={ScrollText}
                        title="No activity recorded yet"
                        description="Actions like imports, supplier invites, and report generation will appear here."
                        className="border-0 bg-transparent"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  enrichedEntries.map((entry) => (
                    <TableRow key={entry.id} className="border-border hover:bg-white/[0.02]">
                      <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                        <div>{format(parseISO(entry.created_at), "dd MMM yyyy")}</div>
                        <div className="text-[11px] opacity-70">
                          {format(parseISO(entry.created_at), "HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-foreground max-w-[180px] truncate">
                        {entry.userEmail}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant={ACTION_VARIANTS[entry.action] ?? "outline"} className="text-xs">
                          {ACTION_LABELS[entry.action] ?? entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        <div>{ENTITY_LABELS[entry.entity_type] ?? entry.entity_type}</div>
                        <div className="text-[11px] font-mono opacity-60 mt-0.5">
                          {entry.entity_id.slice(0, 8)}…
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground max-w-xs">
                        {entry.new_values ? (
                          <DetailsCell values={entry.new_values as Record<string, unknown>} />
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            )}
          </div>
        </CardContent>
      </Card>
      </SectionErrorBoundary>

      {/* Load more */}
      {hasMore && !isLoading && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={handleLoadMore} className="gap-2">
            <ChevronDown className="h-4 w-4" />
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

function DetailsCell({ values }: { values: Record<string, unknown> }) {
  const entries = Object.entries(values).slice(0, 3);
  return (
    <div className="space-y-0.5">
      {entries.map(([key, val]) => (
        <div key={key} className="flex gap-1.5">
          <span className="text-muted-foreground/60 capitalize">
            {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
          </span>
          <span className="text-foreground/80 truncate max-w-[120px]">
            {String(val ?? "—")}
          </span>
        </div>
      ))}
      {Object.keys(values).length > 3 && (
        <span className="text-muted-foreground/50">+{Object.keys(values).length - 3} more</span>
      )}
    </div>
  );
}
