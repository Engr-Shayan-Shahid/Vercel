"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ExportReportButton } from "@/components/emissions/export-report-button";
import { NewReportModal } from "@/components/emissions/new-report-modal";
import { ReportAggregationTable } from "@/components/emissions/report-aggregation-table";
import { ReportsTable } from "@/components/emissions/reports-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useImports } from "@/context/imports-context";
import { useEmissionsReports } from "@/hooks/use-emissions-reports";
import {
  formatEmbeddedEmissions,
  formatTaxLiability,
} from "@/lib/calculate-tax-liability";
import { CBAM_BENCHMARK_FACTOR } from "@/lib/report-compliance";
import type { CreateReportInput } from "@/types/emissions-report";

export function EmissionsReportsPageContent() {
  const { reports, isLoading, error, createReport, updateReportStatus } = useEmissionsReports();
  const { imports } = useImports();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null,
    [reports, selectedReportId]
  );

  const handleCreateReport = async (input: CreateReportInput) => {
    const report = await createReport(input);
    setSelectedReportId(report.id);
  };

  const handleSubmitReport = async () => {
    if (!selectedReport || selectedReport.status !== "draft") return;

    setIsSubmitting(true);
    try {
      await updateReportStatus(selectedReport.id, "submitted");
      toast.success("Report submitted", {
        description: `${selectedReport.reportId} is ready for export.`,
      });
    } catch (err) {
      toast.error("Submit failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Emissions Reports
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Generate quarterly CBAM emissions reports, aggregate goods by CN code and origin, and
            export compliance files.
          </p>
        </div>
        <NewReportModal onCreateReport={handleCreateReport} />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {imports.length === 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Add import logs on the Import Logs page before generating emissions reports.
        </div>
      )}

      <ReportsTable
        reports={reports}
        isLoading={isLoading}
        selectedReportId={selectedReport?.id ?? null}
        onSelectReport={setSelectedReportId}
      />

      {selectedReport && (
        <>
          <Card className="border-border/80 bg-charcoal/40">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="normal-case tracking-normal text-foreground">
                  {selectedReport.reportId}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedReport.period} · ETS €{selectedReport.etsPrice.toFixed(2)}/tCO₂e ·
                  Factor {CBAM_BENCHMARK_FACTOR}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedReport.status === "draft" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => void handleSubmitReport()}
                  >
                    Mark as Submitted
                  </Button>
                )}
                <ExportReportButton report={selectedReport} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <SummaryTile
                  label="Embedded Emissions"
                  value={formatEmbeddedEmissions(selectedReport.embeddedEmissions)}
                />
                <SummaryTile
                  label="Subject to CBAM"
                  value={formatEmbeddedEmissions(selectedReport.emissionsSubjectToCbam)}
                />
                <SummaryTile
                  label="CBAM Liability"
                  value={formatTaxLiability(selectedReport.liability)}
                  highlight
                />
              </div>
            </CardContent>
          </Card>

          <ReportAggregationTable rows={selectedReport.aggregatedRows} />
        </>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-deep-black/40 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1.5 text-lg font-semibold ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
