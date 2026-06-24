"use client";

import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useImports } from "@/context/imports-context";
import { useEmissionsReports } from "@/hooks/use-emissions-reports";
import { formatTaxLiability } from "@/lib/calculate-tax-liability";
import {
  getCurrentQuarter,
  getNextFilingDeadline,
} from "@/lib/settings-schema";
import {
  getQuarterDateRange,
  importMatchesPeriod,
} from "@/types/emissions-report";

export function ComplianceSummary() {
  const { imports } = useImports();
  const { reports } = useEmissionsReports();
  const { year, quarter } = getCurrentQuarter();

  const summary = useMemo(() => {
    const periodImports = imports.filter((record) =>
      importMatchesPeriod(record, year, quarter)
    );
    const periodLiability = periodImports.reduce((sum, record) => sum + record.taxLiability, 0);
    const currentReport = reports.find((report) => report.year === year && report.quarter === quarter);
    const deadline = getNextFilingDeadline(year, quarter);
    const { end } = getQuarterDateRange(year, quarter);

    return {
      period: `${year} ${quarter}`,
      importCount: periodImports.length,
      liability: periodLiability,
      reportStatus: currentReport?.status ?? "Not created",
      deadline: deadline.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
      periodEnd: end.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
    };
  }, [imports, reports, year, quarter]);

  const rows = [
    { label: "Reporting Period", value: summary.period },
    { label: "Imports This Quarter", value: String(summary.importCount) },
    {
      label: "Quarter Liability",
      value: summary.importCount > 0 ? formatTaxLiability(summary.liability) : "—",
    },
    { label: "Report Status", value: summary.reportStatus },
    { label: "Next Filing Deadline", value: summary.deadline },
    { label: "Data Source", value: "Supabase (tenant-scoped)" },
  ];

  return (
    <Card className="border-border/80 bg-charcoal/40">
      <CardHeader>
        <CardTitle className="normal-case tracking-normal text-foreground">
          Compliance Summary
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Current quarter metrics through {summary.periodEnd}.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between border-b border-border/40 pb-4 last:border-0 last:pb-0"
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-medium capitalize text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
