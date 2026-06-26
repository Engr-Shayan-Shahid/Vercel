"use client";

import { TrendingDown, Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SavingsCardProps {
  actualEmbeddedEmissions: number;
  defaultEmbeddedEmissions: number;
  etsPrice: number;
  cbamFactor: number;
}

export function SavingsCard({
  actualEmbeddedEmissions,
  defaultEmbeddedEmissions,
  etsPrice,
  cbamFactor,
}: SavingsCardProps) {
  const savingsEmissions = Math.max(0, defaultEmbeddedEmissions - actualEmbeddedEmissions);
  const savingsEuros = savingsEmissions * etsPrice * cbamFactor;
  const pctSaved =
    defaultEmbeddedEmissions > 0
      ? (savingsEmissions / defaultEmbeddedEmissions) * 100
      : 0;

  const formattedSavings = new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(savingsEuros);

  return (
    <Card className="border-border/80 bg-charcoal/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium normal-case tracking-normal text-foreground">
            <TrendingDown className="h-4 w-4 text-emerald-400" />
            Potential Savings (This Year)
          </CardTitle>
          <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="How is this calculated?">
                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-60">
              <p className="text-xs">
                Calculated as the difference between using EU default emission factors vs. your
                verified supplier data, multiplied by the current ETS price and the 2026 CBAM
                phase-in factor.
              </p>
            </TooltipContent>
          </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {savingsEuros > 0 ? (
          <div className="space-y-3">
            <p className="text-3xl font-bold tracking-tight text-emerald-400">
              {formattedSavings}
            </p>
            <p className="text-sm text-muted-foreground">
              By using verified supplier emission data you avoid{" "}
              <span className="font-medium text-foreground">
                {savingsEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e
              </span>{" "}
              of additional declared emissions, saving {pctSaved.toFixed(1)}% vs default values.
            </p>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
              <p className="text-xs font-medium text-emerald-400">
                Verified supplier data = lower liability
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Default EU factors are punitive. Request emission certificates from your suppliers
                to lock in these savings.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <TrendingDown className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No import data yet. Add imports to see potential savings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
