"use client";

import { Package, Leaf, DollarSign } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useImports } from "@/context/imports-context";
import {
  formatEmbeddedEmissions,
  formatEmissionFactor,
  formatTaxLiability,
  formatTonnes,
} from "@/lib/calculate-tax-liability";
import { DEFAULT_ETS_PRICE } from "@/lib/cbam-constants";

export function StatCards() {
  const { imports, totalMass, totalTaxLiability, totalEmbeddedEmissions, averageEmissionFactor } =
    useImports();

  const stats = [
    {
      title: "Total Imports (Tonnes)",
      value: imports.length > 0 ? formatTonnes(totalMass) : "—",
      description: imports.length > 0 ? `${imports.length} record(s) logged` : "Add imports to calculate",
      icon: Package,
    },
    {
      title: "Total Embedded Emissions",
      value: imports.length > 0 ? formatEmbeddedEmissions(totalEmbeddedEmissions) : "—",
      description:
        imports.length > 0
          ? `avg intensity ${formatEmissionFactor(averageEmissionFactor)}`
          : "Σ (mass × Eᵢ)",
      icon: Leaf,
    },
    {
      title: "Total Liability",
      value: imports.length > 0 ? formatTaxLiability(totalTaxLiability) : "—",
      description: `CBAM engine @ €${DEFAULT_ETS_PRICE} ETS (configurable)`,
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card
            key={stat.title}
            className="group relative overflow-hidden border-border/80 bg-charcoal/40 transition-colors hover:border-primary/20 hover:bg-charcoal/60"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px]">{stat.title}</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
                <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.75} />
              </div>
            </CardHeader>

            <CardContent className="relative">
              <p className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
