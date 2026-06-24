"use client";

import { FileBarChart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatEmbeddedEmissions,
  formatTonnes,
} from "@/lib/calculate-tax-liability";
import type { EmissionsReport } from "@/types/emissions-report";

interface ReportsTableProps {
  reports: EmissionsReport[];
  isLoading: boolean;
  selectedReportId: string | null;
  onSelectReport: (reportId: string) => void;
}

const STATUS_VARIANTS: Record<
  EmissionsReport["status"],
  "muted" | "warning" | "success"
> = {
  draft: "muted",
  submitted: "warning",
  accepted: "success",
};

export function ReportsTable({
  reports,
  isLoading,
  selectedReportId,
  onSelectReport,
}: ReportsTableProps) {
  return (
    <Card className="border-border/80 bg-charcoal/40">
      <CardHeader>
        <CardTitle className="normal-case tracking-normal text-foreground">
          Report Dashboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Quarterly embedded emissions reports with CBAM compliance status.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState />
        ) : reports.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="border-border/60 bg-deep-black/60 hover:bg-deep-black/60">
                  <TableHead>Report ID</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Total Goods</TableHead>
                  <TableHead>Embedded Emissions</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow
                    key={report.id}
                    data-state={selectedReportId === report.id ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => onSelectReport(report.id)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {report.reportId}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{report.period}</TableCell>
                    <TableCell className="text-foreground">
                      {formatTonnes(report.totalGoods)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatEmbeddedEmissions(report.embeddedEmissions)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[report.status]} className="capitalize">
                        {report.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center rounded-lg border border-border/60 bg-deep-black/40 px-6 py-12">
      <p className="text-sm text-muted-foreground">Loading reports…</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-deep-black/40 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <FileBarChart className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground">No emissions reports yet</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Generate a new report from your import logs to begin quarterly CBAM compliance
        reporting.
      </p>
    </div>
  );
}
