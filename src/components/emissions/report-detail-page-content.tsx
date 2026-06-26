"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileType2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useImports } from "@/context/imports-context";
import { useUserSettings } from "@/context/user-settings-context";
import {
  formatEmbeddedEmissions,
  formatEmissionFactor,
  formatTaxLiability,
  formatTonnes,
} from "@/lib/calculate-tax-liability";
import { CBAM_BENCHMARK_ALLOWANCE_FACTOR } from "@/lib/cbam-constants";
import {
  downloadFile,
  generateReportXml,
  type ReportOrganizationMetadata,
} from "@/lib/report-export";
import type { EmissionsReport } from "@/types/emissions-report";

const STATUS_CONFIG: Record<
  EmissionsReport["status"],
  { label: string; icon: React.ElementType; variant: "muted" | "warning" | "success" }
> = {
  draft: { label: "Draft", icon: Clock, variant: "muted" },
  submitted: { label: "Ready", icon: CheckCircle2, variant: "warning" },
  accepted: { label: "Submitted", icon: CheckCircle2, variant: "success" },
};

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
    <div className="rounded-lg border border-border/60 bg-deep-black/40 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1.5 text-xl font-semibold ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

interface ReportDetailPageContentProps {
  reportId: string;
}

export function ReportDetailPageContent({ reportId }: ReportDetailPageContentProps) {
  const router = useRouter();
  const { imports } = useImports();
  const { settings } = useUserSettings();
  const [report, setReport] = useState<EmissionsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportingXml, setIsExportingXml] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/emissions-reports/${reportId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load report.");
        if (!cancelled) setReport(data.report as EmissionsReport);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load report.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  const reportImports = useMemo(() => {
    if (!report) return [];
    const idSet = new Set(report.importIds);
    return imports.filter((imp) => idSet.has(imp.id));
  }, [report, imports]);

  const handleExportXml = async () => {
    if (!report) return;
    setIsExportingXml(true);
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
      setIsExportingXml(false);
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;
    setIsExportingPdf(true);
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
      setIsExportingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-7xl items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </button>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error ?? "Report not found."}
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[report.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Back + header */}
      <div className="space-y-4">
        <Link
          href="/emissions-reports"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Report Center
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {report.reportId}
              </h1>
              <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Reporting period:{" "}
              <span className="font-medium text-foreground">{report.period}</span> · Generated{" "}
              {new Date(report.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              · ETS €{report.etsPrice.toFixed(2)}/tCO₂e
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="Total Goods" value={formatTonnes(report.totalGoods)} />
        <SummaryTile
          label="Embedded Emissions"
          value={formatEmbeddedEmissions(report.embeddedEmissions)}
        />
        <SummaryTile
          label="Subject to CBAM"
          value={formatEmbeddedEmissions(report.emissionsSubjectToCbam)}
        />
        <SummaryTile
          label="Estimated Liability"
          value={formatTaxLiability(report.liability)}
          highlight
        />
      </div>

      {/* Breakdown by material */}
      <Card className="border-border/80 bg-charcoal/40">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="normal-case tracking-normal text-foreground">
                Material Breakdown
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Aggregated by CN code and country of origin. Benchmark factor:{" "}
                {CBAM_BENCHMARK_ALLOWANCE_FACTOR}
              </p>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {report.aggregatedRows.length} material group
              {report.aggregatedRows.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {report.aggregatedRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No aggregated rows found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <Table className="min-w-[960px]">
                <TableHeader>
                  <TableRow className="border-border/60 bg-deep-black/60 hover:bg-deep-black/60">
                    <TableHead>CN Code</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Imports</TableHead>
                    <TableHead>Total Mass</TableHead>
                    <TableHead>Benchmark</TableHead>
                    <TableHead>Embedded</TableHead>
                    <TableHead>Subject to CBAM</TableHead>
                    <TableHead>Flags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.aggregatedRows.map((row) => (
                    <TableRow key={`${row.cnCode}-${row.originCountry}`}>
                      <TableCell className="font-mono text-foreground">{row.cnCode}</TableCell>
                      <TableCell className="text-foreground">{row.materialType}</TableCell>
                      <TableCell className="text-muted-foreground">{row.originCountry}</TableCell>
                      <TableCell className="text-muted-foreground">{row.importCount}</TableCell>
                      <TableCell className="text-foreground">
                        {formatTonnes(row.totalMass)}
                      </TableCell>
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
                          <span className="inline-flex items-center gap-1.5 text-amber-400">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span className="text-xs">Default</span>
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
          )}
        </CardContent>
      </Card>

      {/* Individual imports list */}
      <Card className="border-border/80 bg-charcoal/40">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="normal-case tracking-normal text-foreground">
                Import Records
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                All import logs included in this report.
              </p>
            </div>
            <Badge variant="outline" className="border-border/60">
              {report.importIds.length} record{report.importIds.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {reportImports.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
              {report.importIds.length === 0
                ? "No import records linked to this report."
                : "Import records are loading or were deleted."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="border-border/60 bg-deep-black/60 hover:bg-deep-black/60">
                    <TableHead>Material</TableHead>
                    <TableHead>CN Code</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Import Date</TableHead>
                    <TableHead>Mass</TableHead>
                    <TableHead>Emission Factor</TableHead>
                    <TableHead>Embedded Emissions</TableHead>
                    <TableHead>Tax Liability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportImports.map((imp) => (
                    <TableRow key={imp.id}>
                      <TableCell className="font-medium text-foreground">
                        {imp.materialType}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">{imp.cnCode}</TableCell>
                      <TableCell className="text-muted-foreground">{imp.originCountry}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(imp.importDate).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell className="text-foreground">{formatTonnes(imp.mass)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatEmissionFactor(imp.emissionFactor)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatEmbeddedEmissions(imp.embeddedEmissions)}
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {formatTaxLiability(imp.taxLiability)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download section */}
      <Card className="border-border/80 bg-charcoal/40">
        <CardHeader>
          <CardTitle className="normal-case tracking-normal text-foreground">
            Downloads &amp; Submission
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Export this report in EU-compliant XML format or as a PDF summary.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={isExportingXml}
              onClick={() => void handleExportXml()}
            >
              {isExportingXml ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileType2 className="h-4 w-4" />
              )}
              Download XML
            </Button>
            <Button disabled={isExportingPdf} onClick={() => void handleExportPdf()}>
              {isExportingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download PDF
            </Button>
          </div>

          {/* EU Registry info banner */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Submit to the EU CBAM Registry
                </p>
                <p className="text-sm text-muted-foreground">
                  After downloading your XML report, log into the official EU CBAM Transitional
                  Registry to submit your quarterly declaration. Ensure your EORI number and company
                  details are up to date in Settings before submitting.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <a
                  href="https://cbam.ec.europa.eu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open EU Registry
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
