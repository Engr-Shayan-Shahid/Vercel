"use client";

import { useEffect, useMemo, useState } from "react";

import { CostForecastChart, type ForecastDataPoint } from "@/components/forecasting/CostForecastChart";
import { ScenarioPlanner } from "@/components/forecasting/ScenarioPlanner";
import { SavingsCard } from "@/components/forecasting/SavingsCard";
import {
  CBAM_PHASE_IN_SCHEDULE,
  DEFAULT_ETS_PRICE,
  MATERIAL_BENCHMARKS,
} from "@/lib/cbam-constants";
import type { ImportRecord } from "@/types/import-record";

function buildForecastData(
  avgAnnualTonnage: number,
  avgEmissionFactor: number,
  avgDefaultFactor: number,
  etsPrice: number,
  volumeMultiplier: number
): ForecastDataPoint[] {
  return Object.entries(CBAM_PHASE_IN_SCHEDULE)
    .map(([yearStr, factor]) => {
      const year = Number(yearStr);
      const tonnage = avgAnnualTonnage * volumeMultiplier;
      const verified = tonnage * avgEmissionFactor * etsPrice * factor;
      const defaults = tonnage * avgDefaultFactor * etsPrice * factor;
      return { year, verified: Math.max(0, verified), defaults: Math.max(0, defaults) };
    })
    .sort((a, b) => a.year - b.year);
}

export function ForecastingPageContent() {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [volumeChangePct, setVolumeChangePct] = useState(0);
  const [etsPrice, setEtsPrice] = useState(DEFAULT_ETS_PRICE);

  useEffect(() => {
    async function fetchImports() {
      try {
        const res = await fetch("/api/import-logs");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load import data.");
        setImports(data.imports ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load import data.");
      } finally {
        setIsLoading(false);
      }
    }
    void fetchImports();
  }, []);

  const stats = useMemo(() => {
    if (imports.length === 0) {
      return {
        avgAnnualTonnage: 0,
        avgEmissionFactor: 0,
        avgDefaultFactor: 0,
        totalActualEmissions: 0,
        totalDefaultEmissions: 0,
      };
    }

    const totalMass = imports.reduce((s, r) => s + r.mass, 0);
    const totalActualEmissions = imports.reduce((s, r) => s + r.embeddedEmissions, 0);

    const totalDefaultEmissions = imports.reduce((s, r) => {
      const benchmark = MATERIAL_BENCHMARKS[r.materialType] ?? r.emissionFactor;
      return s + r.mass * benchmark;
    }, 0);

    const avgEmissionFactor = totalMass > 0 ? totalActualEmissions / totalMass : 0;
    const avgDefaultFactor = totalMass > 0 ? totalDefaultEmissions / totalMass : 0;

    // Derive average annual tonnage from the date range in records
    const dates = imports
      .map((r) => new Date(r.importDate ?? r.createdAt).getFullYear())
      .filter((y) => !Number.isNaN(y));
    const uniqueYears = new Set(dates).size || 1;
    const avgAnnualTonnage = totalMass / uniqueYears;

    return {
      avgAnnualTonnage,
      avgEmissionFactor,
      avgDefaultFactor,
      totalActualEmissions,
      totalDefaultEmissions,
    };
  }, [imports]);

  const volumeMultiplier = 1 + volumeChangePct / 100;

  const forecastData = useMemo(
    () =>
      buildForecastData(
        stats.avgAnnualTonnage,
        stats.avgEmissionFactor,
        stats.avgDefaultFactor,
        etsPrice,
        volumeMultiplier
      ),
    [stats, etsPrice, volumeMultiplier]
  );

  const currentYearFactor = CBAM_PHASE_IN_SCHEDULE[new Date().getFullYear()] ?? 0.025;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          CBAM Cost Forecast
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Model your estimated CBAM liability through 2034 as the phase-in rate increases.
          Scenarios are based on your logged import history.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted/20" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : (
        <>
          <SavingsCard
            actualEmbeddedEmissions={stats.totalActualEmissions}
            defaultEmbeddedEmissions={stats.totalDefaultEmissions}
            etsPrice={etsPrice}
            cbamFactor={currentYearFactor}
          />

          <ScenarioPlanner
            volumeChangePct={volumeChangePct}
            etsPrice={etsPrice}
            onVolumeChange={setVolumeChangePct}
            onEtsPriceChange={setEtsPrice}
          />

          <CostForecastChart data={forecastData} />

          <div className="rounded-xl border border-border/60 bg-charcoal/20 px-6 py-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Methodology: </span>
              Projections use average annual tonnage and emission factors from your import logs.
              The &ldquo;with default values&rdquo; line uses the EU punitive benchmark factors per material
              type instead of your actual supplier data. CBAM phase-in rates follow EU Regulation
              2023/956, Article 22. Scenarios are estimates only — consult a compliance adviser for
              regulatory planning.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
