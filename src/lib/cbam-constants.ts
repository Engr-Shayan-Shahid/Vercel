import type { MaterialType } from "@/types/import-record";

/** CBAM transitional phase-in rate for 2026 (2.5% of benchmark free allocation). */
export const CBAM_FACTOR = 0.025;

/** Complement of CBAM_FACTOR — fraction of benchmark not covered by free allocation. */
export const CBAM_BENCHMARK_ALLOWANCE_FACTOR = 0.975;

/**
 * Default EU CBAM benchmarks (tCO₂e/t) — punitive when used instead of verified supplier data.
 * Update per EU Implementing Regulation annexes.
 */
export const MATERIAL_BENCHMARKS: Record<MaterialType, number> = {
  Steel: 1.288,
  Aluminum: 1.514,
  Cement: 0.766,
  Fertilizer: 2.05,
  Hydrogen: 3.93,
};

/** Fallback EU ETS price (€/tCO₂e). Override via CBAM_ETS_PRICE env variable. */
export const DEFAULT_ETS_PRICE = 65;

export const PUNITIVE_DEFAULTS_WARNING =
  "Default values are punitive. Use verified supplier data to lower your embedded emissions (Eᵢ) and reduce liability.";

export const FOREIGN_PRICE_PROOF_WARNING =
  "A foreign carbon price deduction (P_foreign) requires proof of payment upload — this is a legal requirement for the deduction to be valid.";

/**
 * EU CBAM phase-in schedule: fraction of liability applicable each calendar year.
 * 2026 = 2.5 %, rising linearly to 100 % by 2034.
 * Source: EU Regulation 2023/956, Article 22.
 */
export const CBAM_PHASE_IN_SCHEDULE: Record<number, number> = {
  2026: 0.025,
  2027: 0.05,
  2028: 0.1,
  2029: 0.2,
  2030: 0.4,
  2031: 0.6,
  2032: 0.7,
  2033: 0.85,
  2034: 1.0,
};
