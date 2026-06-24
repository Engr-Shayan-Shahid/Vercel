import type { MaterialType } from "@/types/import-record";

/** CBAM transitional factor (2.5% in 2026). */
export const CBAM_FACTOR = 0.025;

/** Benchmark allowance complement factor for 2026 (1 − CBAM_FACTOR). */
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
};

/** Fallback EU ETS price (€/tCO₂e). Override via env or monthly update. */
export const DEFAULT_ETS_PRICE = 80;

export const PUNITIVE_DEFAULTS_WARNING =
  "Default values are punitive. Use verified supplier data to lower your embedded emissions (Eᵢ) and reduce liability.";

export const FOREIGN_PRICE_PROOF_WARNING =
  "A foreign carbon price deduction (P_foreign) requires proof of payment upload — this is a legal requirement for the deduction to be valid.";
