"use client";

import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  formatBenchmarkDeduction,
  formatCertificatePrice,
  formatTaxLiability,
  getCalculationBreakdown,
} from "@/lib/calculate-tax-liability";
import type { ImportRecord } from "@/types/import-record";

interface CalculationDetailsProps {
  record: ImportRecord;
  className?: string;
}

export function CalculationDetails({ record, className }: CalculationDetailsProps) {
  const breakdown = getCalculationBreakdown(record);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={className}
          aria-label="View liability calculation breakdown"
        >
          <Info className="h-3.5 w-3.5 text-primary/70 transition-colors hover:text-primary" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" align="end" className="w-56">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
          Calculation Details
        </p>
        <dl className="space-y-1.5">
          <DetailRow
            label="Certificate Price"
            value={formatCertificatePrice(breakdown.certificatePrice)}
          />
          <DetailRow label="CBAM Factor" value={breakdown.cbamFactor.toFixed(3)} />
          <DetailRow
            label="Benchmark Deduction"
            value={formatBenchmarkDeduction(breakdown.benchmarkDeduction)}
          />
          <DetailRow
            label="Foreign Deduction"
            value={formatTaxLiability(breakdown.foreignCarbonPriceDeduction)}
          />
          <DetailRow
            label="Total Liability"
            value={formatTaxLiability(breakdown.liability)}
            highlight={breakdown.liability > 0}
          />
          <DetailRow
            label="Markup Applied"
            value={breakdown.markupApplied ? "Yes" : "No"}
            highlight={breakdown.markupApplied}
          />
        </dl>
      </TooltipContent>
    </Tooltip>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={
          highlight
            ? "font-medium text-amber-400"
            : "font-medium tabular-nums text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}
