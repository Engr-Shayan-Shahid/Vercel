"use client";

import { AlertTriangle } from "lucide-react";

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
  formatEmissionFactor,
  formatTonnes,
} from "@/lib/calculate-tax-liability";
import { CBAM_BENCHMARK_FACTOR } from "@/lib/report-compliance";
import type { AggregatedImportRow } from "@/types/emissions-report";

interface ReportAggregationTableProps {
  rows: AggregatedImportRow[];
}

export function ReportAggregationTable({ rows }: ReportAggregationTableProps) {
  if (rows.length === 0) return null;

  return (
    <Card className="border-border/80 bg-charcoal/40">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="normal-case tracking-normal text-foreground">
              Aggregated Goods
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Grouped by CN code and country of origin. Formula: Embedded − (Benchmark × Mass ×{" "}
              {CBAM_BENCHMARK_FACTOR})
            </p>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary">
            Applied factor: {CBAM_BENCHMARK_FACTOR}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow className="border-border/60 bg-deep-black/60 hover:bg-deep-black/60">
                <TableHead>CN Code</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Total Mass</TableHead>
                <TableHead>Benchmark</TableHead>
                <TableHead>Embedded</TableHead>
                <TableHead>Subject to CBAM</TableHead>
                <TableHead>Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.cnCode}-${row.originCountry}`}>
                  <TableCell className="font-mono text-foreground">{row.cnCode}</TableCell>
                  <TableCell className="text-foreground">{row.materialType}</TableCell>
                  <TableCell className="text-muted-foreground">{row.originCountry}</TableCell>
                  <TableCell className="text-foreground">{formatTonnes(row.totalMass)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatEmissionFactor(row.benchmark)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatEmbeddedEmissions(row.embeddedEmissions)}
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {formatEmbeddedEmissions(row.emissionsSubjectToCbam)}
                  </TableCell>
                  <TableCell>
                    {row.usesDefaultValues ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-amber-400"
                        title="Default values are punitive — use verified supplier data"
                      >
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="text-xs">Default Values</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Verified</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
