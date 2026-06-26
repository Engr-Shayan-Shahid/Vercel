"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileBarChart,
  FileType2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { NewReportModal } from "@/components/emissions/new-report-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { ReportCardsSkeleton } from "@/components/ui/report-cards-skeleton";
import { SectionErrorBoundary } from "@/components/ui/section-error-boundary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useImports } from "@/context/imports-context";
import { useUserSettings } from "@/context/user-settings-context";
import { useEmissionsReports } from "@/hooks/use-emissions-reports";
import {
  formatEmbeddedEmissions,
  formatTaxLiability,
} from "@/lib/calculate-tax-liability";
import {
  downloadFile,
  generateReportXml,
  type ReportOrganizationMetadata,
} from "@/lib/report-export";
import type { CreateReportInput, EmissionsReport } from "@/types/emissions-report";

type StatusFilter = "all" | "draft" | "submitted" | "accepted";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Ready" },
  { value: "accepted", label: "Submitted" },
];

const STATUS_CONFIG: Record<
  EmissionsReport["status"],
  { label: string; icon: React.ElementType; variant: "muted" | "warning" | "success" }
> = {
  draft: { label: "Draft", icon: Clock, variant: "muted" },
  submitted: { label: "Ready", icon: CheckCircle2, variant: "warning" },
  accepted: { label: "Submitted", icon: CheckCircle2, variant: "success" },
};

function useExportXml(settings: ReturnType<typeof useUserSettings>["settings"]) {
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExport = async (report: EmissionsReport) => {
    setExportingId(report.id);
    try {
      const org: ReportOrganizationMetadata = {
        companyLegalName: settings.companyLegalName,
        eoriNumber: settings.eoriNumber,
        vatTaxId: settings.vatTaxId,
        complianceOfficerName: settings.complianceOfficerName,
        email: settings.email,
      };
      const xml = generateReportXml(report, org);
      downloadFile(xml, `${report.reportId}.xml`, "application/xml");
      toast.success("XML exported", { description: `${report.reportId}.xml downloaded.` });
    } catch (err) {
      toast.error("Export failed", {
        description: err instanceof Error ? err.message : "Could not generate XML.",
      });
    } finally {
      setExportingId(null);
    }
  };

  return { handleExport, exportingId };
}

function useExportPdf() {
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExport = async (report: EmissionsReport) => {
    setExportingId(report.id);
    try {
      const res = await fetch(`/api/emissions-reports/${report.id}/pdf`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to generate PDF.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.reportId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF exported", { description: `${report.reportId}.pdf downloaded.` });
    } catch (err) {
      toast.error("PDF export failed", {
        description: err instanceof Error ? err.message : "Could not generate PDF.",
      });
    } finally {
      setExportingId(null);
    }
  };

  return { handleExport, exportingId };
}

function ReportCard({
  report,
  onExportXml,
  onExportPdf,
  isExportingXml,
  isExportingPdf,
}: {
  report: EmissionsReport;
  onExportXml: (r: EmissionsReport) => void;
  onExportPdf: (r: EmissionsReport) => void;
  isExportingXml: boolean;
  isExportingPdf: boolean;
}) {
  const cfg = STATUS_CONFIG[report.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="flex flex-col rounded-xl border border-border/80 bg-charcoal/40 p-5 transition-colors hover:border-border">
      {/* Card top */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-xs font-medium text-muted-foreground">{report.reportId}</p>
          <p className="text-base font-semibold text-foreground">{report.period}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(report.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <Badge variant={cfg.variant} className="flex shrink-0 items-center gap-1">
          <StatusIcon className="h-3 w-3" />
          {cfg.label}
        </Badge>
      </div>

      {/* Emission + liability badges */}
      <div className="mb-5 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/60 bg-deep-black/40 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Emissions</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {formatEmbeddedEmissions(report.embeddedEmissions)}
          </p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Liability</p>
          <p className="mt-0.5 text-sm font-semibold text-primary">
            {formatTaxLiability(report.liability)}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-auto flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/emissions-reports/${report.id}`}>
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isExportingXml}
          onClick={() => onExportXml(report)}
          className="flex-1"
        >
          {isExportingXml ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileType2 className="h-3.5 w-3.5" />
          )}
          XML
        </Button>
        <Button
          size="sm"
          disabled={isExportingPdf}
          onClick={() => onExportPdf(report)}
          className="flex-1"
        >
          {isExportingPdf ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          PDF
        </Button>
      </div>
    </div>
  );
}

function ReportsEmptyState({ filtered }: { filtered: boolean }) {
  if (filtered) {
    return (
      <EmptyState
        icon={FileBarChart}
        title="No reports match your filters"
        description="Try adjusting the status or period filter."
        className="col-span-full"
      />
    );
  }

  return (
    <EmptyState
      icon={FileBarChart}
      title="No reports generated"
      description="Add imports first, then generate a quarterly CBAM emissions report."
      action={{ label: "Go to import logs", href: "/import-logs" }}
      className="col-span-full"
    />
  );
}

export function EmissionsReportsPageContent() {
  const { reports, isLoading, error, createReport, refresh } = useEmissionsReports();
  const { imports } = useImports();
  const { settings } = useUserSettings();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  const { handleExport: handleExportXml, exportingId: xmlExportingId } = useExportXml(settings);
  const { handleExport: handleExportPdf, exportingId: pdfExportingId } = useExportPdf();

  const uniquePeriods = useMemo(() => {
    const seen = new Set<string>();
    const periods: { value: string; label: string }[] = [];
    for (const r of reports) {
      if (!seen.has(r.period)) {
        seen.add(r.period);
        periods.push({ value: r.period, label: r.period });
      }
    }
    return periods;
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (periodFilter !== "all" && r.period !== periodFilter) return false;
      return true;
    });
  }, [reports, statusFilter, periodFilter]);

  const statusCounts = useMemo(
    () => ({
      all: reports.length,
      draft: reports.filter((r) => r.status === "draft").length,
      submitted: reports.filter((r) => r.status === "submitted").length,
      accepted: reports.filter((r) => r.status === "accepted").length,
    }),
    [reports]
  );

  const handleCreateReport = async (input: CreateReportInput) => {
    try {
      const report = await createReport(input);
      toast.success("Report generated", {
        description: `${report.reportId} is ready to preview and export.`,
      });
    } catch (err) {
      toast.error("Failed to generate report", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      throw err;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Report Center
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Generate, preview, and export quarterly CBAM emissions reports.
          </p>
        </div>
        <NewReportModal onCreateReport={handleCreateReport} />
      </div>

      {error && (
        <ErrorCard message={error} onRetry={() => void refresh()} />
      )}

      {imports.length === 0 && !isLoading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Add import logs on the Import Logs page before generating emissions reports.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex rounded-lg border border-border/60 bg-deep-black/40 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {statusCounts[tab.value] > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    statusFilter === tab.value
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-border/60 text-muted-foreground"
                  }`}
                >
                  {statusCounts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Period filter */}
        {uniquePeriods.length > 0 && (
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All periods</SelectItem>
              {uniquePeriods.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Report cards grid */}
      <SectionErrorBoundary title="Reports failed to load">
        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <ReportCardsSkeleton count={6} />
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReports.length === 0 ? (
              <ReportsEmptyState filtered={statusFilter !== "all" || periodFilter !== "all"} />
            ) : (
              filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onExportXml={(r) => void handleExportXml(r)}
                  onExportPdf={(r) => void handleExportPdf(r)}
                  isExportingXml={xmlExportingId === report.id}
                  isExportingPdf={pdfExportingId === report.id}
                />
              ))
            )}
          </div>
        )}
      </SectionErrorBoundary>
    </div>
  );
}
