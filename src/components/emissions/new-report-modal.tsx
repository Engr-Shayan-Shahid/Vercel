"use client";

import { useMemo, useState } from "react";
import { Calculator, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useImports } from "@/context/imports-context";
import {
  formatEmbeddedEmissions,
  formatTaxLiability,
  formatTonnes,
} from "@/lib/calculate-tax-liability";
import { getEtsPriceSync } from "@/lib/ets-price";
import { CBAM_BENCHMARK_ALLOWANCE_FACTOR } from "@/lib/cbam-constants";
import { summarizeReportFromImports } from "@/lib/report-compliance";
import type { CreateReportInput, ReportQuarter } from "@/types/emissions-report";
import {
  REPORT_QUARTERS,
  importMatchesPeriod,
  validateReportInput,
  hasReportValidationErrors,
} from "@/types/emissions-report";

interface NewReportModalProps {
  onCreateReport: (input: CreateReportInput) => Promise<void>;
}

const CURRENT_YEAR = new Date().getFullYear();

export function NewReportModal({ onCreateReport }: NewReportModalProps) {
  const { imports } = useImports();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [quarter, setQuarter] = useState<ReportQuarter | "">("");
  const [etsPrice, setEtsPrice] = useState(String(getEtsPriceSync()));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<ReturnType<typeof validateReportInput>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredImports = useMemo(() => {
    if (!quarter) return imports;
    const yearNum = Number(year);
    if (Number.isNaN(yearNum)) return imports;
    return imports.filter((record) => importMatchesPeriod(record, yearNum, quarter));
  }, [imports, year, quarter]);

  const preview = useMemo(() => {
    const selected = filteredImports.filter((r) => selectedIds.has(r.id));
    if (selected.length === 0 || !etsPrice.trim()) return null;
    const price = Number(etsPrice);
    if (Number.isNaN(price) || price <= 0) return null;
    return summarizeReportFromImports(selected, price);
  }, [filteredImports, selectedIds, etsPrice]);

  const toggleImport = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredImports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredImports.map((r) => r.id)));
    }
  };

  const resetForm = () => {
    setQuarter("");
    setEtsPrice(String(getEtsPriceSync()));
    setSelectedIds(new Set());
    setErrors({});
  };

  const handleSubmit = async () => {
    const validationErrors = validateReportInput(
      Number(year),
      quarter,
      etsPrice,
      Array.from(selectedIds)
    );

    if (hasReportValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const selectedImports = imports.filter((r) => selectedIds.has(r.id));

      await onCreateReport({
        year: Number(year),
        quarter: quarter as ReportQuarter,
        etsPrice: Number(etsPrice),
        importIds: Array.from(selectedIds),
        imports: selectedImports,
      });

      toast.success("Report generated", {
        description: `Quarterly report for ${year} ${quarter} created successfully.`,
      });

      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error("Report generation failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Generate Emissions Report</DialogTitle>
          <DialogDescription>
            Filter import logs by reporting period, select entries, and compute CBAM liability
            using the quarterly ETS price.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="report-year">Year</Label>
              <Input
                id="report-year"
                type="number"
                min={2020}
                max={2100}
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setSelectedIds(new Set());
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-quarter">Quarter</Label>
              <Select
                value={quarter}
                onValueChange={(value) => {
                  setQuarter(value as ReportQuarter);
                  setSelectedIds(new Set());
                }}
              >
                <SelectTrigger id="report-quarter">
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_QUARTERS.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ets-price">Quarterly ETS Price (€/tCO₂e)</Label>
              <Input
                id="ets-price"
                type="number"
                min={0}
                step="0.01"
                value={etsPrice}
                onChange={(e) => setEtsPrice(e.target.value)}
              />
            </div>
          </div>

          {(errors.period || errors.etsPrice || errors.imports) && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errors.period ?? errors.etsPrice ?? errors.imports}
            </div>
          )}

          <div className="rounded-lg border border-border/60 bg-deep-black/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Calculator className="h-4 w-4 text-primary" />
              <span>
                Emissions Subject to CBAM = Embedded − (Benchmark × Mass × {CBAM_BENCHMARK_ALLOWANCE_FACTOR})
              </span>
            </div>
            {preview ? (
              <div className="grid gap-3 sm:grid-cols-4">
                <PreviewStat label="Total Goods" value={formatTonnes(preview.totalGoods)} />
                <PreviewStat
                  label="Embedded Emissions"
                  value={formatEmbeddedEmissions(preview.embeddedEmissions)}
                />
                <PreviewStat
                  label="Subject to CBAM"
                  value={formatEmbeddedEmissions(preview.emissionsSubjectToCbam)}
                />
                <PreviewStat label="Liability" value={formatTaxLiability(preview.liability)} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select import logs to preview aggregated liability.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Import Logs {quarter ? `(${filteredImports.length} in period)` : ""}</Label>
              {filteredImports.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={toggleAll}>
                  {selectedIds.size === filteredImports.length ? "Deselect all" : "Select all"}
                </Button>
              )}
            </div>

            {filteredImports.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                {imports.length === 0
                  ? "No import logs available. Add imports on the Import Logs page first."
                  : "No import logs match the selected reporting period."}
              </div>
            ) : (
              <div className="max-h-64 overflow-auto rounded-lg border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-deep-black/60 hover:bg-deep-black/60">
                      <TableHead className="w-10" />
                      <TableHead>Material</TableHead>
                      <TableHead>Origin</TableHead>
                      <TableHead>Mass</TableHead>
                      <TableHead>Embedded</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredImports.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(record.id)}
                            onCheckedChange={() => toggleImport(record.id)}
                            aria-label={`Select import ${record.materialType}`}
                          />
                        </TableCell>
                        <TableCell className="text-foreground">{record.materialType}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.originCountry}
                        </TableCell>
                        <TableCell>{formatTonnes(record.mass)}</TableCell>
                        <TableCell>{formatEmbeddedEmissions(record.embeddedEmissions)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "Generating…" : "Generate Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/50 bg-charcoal/60 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
