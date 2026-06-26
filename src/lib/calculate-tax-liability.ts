import {
  CBAM_FACTOR,
  MATERIAL_BENCHMARKS,
} from "@/lib/cbam-constants";
import type { ImportRecord } from "@/types/import-record";

export interface TaxLiabilityInput {
  taxableEmissions: number;
  etsPrice: number;
  foreignPricePerTonne: number;
}

export interface TaxLiabilityResult {
  cbamLiability: number;
  foreignCarbonPriceDeduction: number;
  liability: number;
  priceDifference: number;
}

/**
 * Resolves final CBAM liability with foreign carbon price applied against
 * the calculated CBAM liability (not gross embedded emissions).
 *
 *   CBAM_Liability = TaxableEmissions × EtsPrice
 *   Foreign_Deduction = TaxableEmissions × ForeignPrice
 *   Liability = max(0, CBAM_Liability − Foreign_Deduction)
 */
export function resolveTaxLiability(input: TaxLiabilityInput): TaxLiabilityResult {
  const { taxableEmissions, etsPrice, foreignPricePerTonne } = input;

  const cbamLiability = taxableEmissions * etsPrice;
  const foreignCarbonPriceDeduction = taxableEmissions * foreignPricePerTonne;
  const liability = Math.max(0, cbamLiability - foreignCarbonPriceDeduction);

  return {
    cbamLiability,
    foreignCarbonPriceDeduction,
    liability,
    priceDifference: etsPrice - foreignPricePerTonne,
  };
}

export function formatTonnes(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}T`;
}

export function formatTaxLiability(value: number): string {
  return `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatEmissionFactor(value: number): string {
  return `${value.toFixed(2)} tCO₂e/t`;
}

export function formatEmbeddedEmissions(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} tCO₂e`;
}

export function formatCertificatePrice(value: number): string {
  return `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/tCO₂e`;
}

export function formatBenchmarkDeduction(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂e`;
}

export function getForeignPriceDeduction(record: ImportRecord): number {
  if (record.foreignCarbonPriceDeduction > 0) {
    return record.foreignCarbonPriceDeduction;
  }

  return resolveTaxLiability({
    taxableEmissions: Math.max(0, record.embeddedEmissions - record.freeAllocation),
    etsPrice: record.etsPrice,
    foreignPricePerTonne: record.foreignPrice,
  }).foreignCarbonPriceDeduction;
}

export interface CalculationBreakdown {
  certificatePrice: number;
  cbamFactor: number;
  benchmarkDeduction: number;
  markupApplied: boolean;
  cbamLiability: number;
  foreignCarbonPriceDeduction: number;
  liability: number;
}

/** Builds a liability breakdown that mirrors the live CBAM calculation engine. */
export function getCalculationBreakdown(record: ImportRecord): CalculationBreakdown {
  const taxableEmissions = Math.max(0, record.embeddedEmissions - record.freeAllocation);
  const taxResult = resolveTaxLiability({
    taxableEmissions,
    etsPrice: record.etsPrice,
    foreignPricePerTonne: record.foreignPrice,
  });

  return {
    certificatePrice: record.etsPrice,
    cbamFactor: CBAM_FACTOR,
    benchmarkDeduction: record.freeAllocation,
    markupApplied: record.emissionFactor >= MATERIAL_BENCHMARKS[record.materialType],
    cbamLiability: taxResult.cbamLiability,
    foreignCarbonPriceDeduction: taxResult.foreignCarbonPriceDeduction,
    liability: taxResult.liability,
  };
}
