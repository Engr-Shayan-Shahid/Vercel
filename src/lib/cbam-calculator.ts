import {
  CBAM_FACTOR,
  MATERIAL_BENCHMARKS,
} from "@/lib/cbam-constants";
import { resolveTaxLiability } from "@/lib/calculate-tax-liability";
import { getEtsPriceSync } from "@/lib/ets-price";
import type { MaterialType } from "@/types/import-record";

export interface CBAMCalculationInput {
  materialType: MaterialType;
  mass: number;
  emissionFactor: number;
  foreignPrice?: number;
  etsPrice?: number;
}

export interface CBAMCalculationResult {
  embeddedEmissions: number;
  benchmark: number;
  freeAllocation: number;
  taxableEmissions: number;
  cbamLiability: number;
  foreignCarbonPriceDeduction: number;
  etsPrice: number;
  foreignPrice: number;
  priceDifference: number;
  liability: number;
}

export class CBAMCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CBAMCalculationError";
  }
}

/**
 * Official CBAM liability formula (Phase 3 engine):
 *
 *   CBAM_Liability = TaxableEmissions × EtsPrice
 *   Foreign_Deduction = TaxableEmissions × ForeignPrice
 *   Liability = max(0, CBAM_Liability − Foreign_Deduction)
 *
 * Where TaxableEmissions = max(0, EmbeddedEmissions − (Benchmark × Mass × CBAM_FACTOR)).
 * Foreign deduction is applied against calculated CBAM liability, not gross emissions.
 */
export function calculateCBAMLiability(input: CBAMCalculationInput): CBAMCalculationResult {
  const { materialType, mass, emissionFactor } = input;
  const foreignPrice = input.foreignPrice ?? 0;
  const etsPrice = input.etsPrice ?? getEtsPriceSync();

  if (!materialType || !(materialType in MATERIAL_BENCHMARKS)) {
    throw new CBAMCalculationError("Invalid or unsupported material type.");
  }

  if (Number.isNaN(mass) || mass <= 0) {
    throw new CBAMCalculationError("Mass must be a positive number.");
  }

  if (Number.isNaN(emissionFactor) || emissionFactor < 0) {
    throw new CBAMCalculationError("Emission factor must be zero or greater.");
  }

  if (Number.isNaN(foreignPrice) || foreignPrice < 0) {
    throw new CBAMCalculationError("Foreign price must be zero or greater.");
  }

  if (Number.isNaN(etsPrice) || etsPrice <= 0) {
    throw new CBAMCalculationError("ETS price must be a positive number.");
  }

  const benchmark = MATERIAL_BENCHMARKS[materialType];
  const embeddedEmissions = mass * emissionFactor;
  const freeAllocation = benchmark * mass * CBAM_FACTOR;
  const taxableEmissions =
    embeddedEmissions >= freeAllocation ? embeddedEmissions - freeAllocation : 0;

  const taxResult = resolveTaxLiability({
    taxableEmissions,
    etsPrice,
    foreignPricePerTonne: foreignPrice,
  });

  return {
    embeddedEmissions,
    benchmark,
    freeAllocation,
    taxableEmissions,
    cbamLiability: taxResult.cbamLiability,
    foreignCarbonPriceDeduction: taxResult.foreignCarbonPriceDeduction,
    etsPrice,
    foreignPrice,
    priceDifference: taxResult.priceDifference,
    liability: taxResult.liability,
  };
}
