import { DEFAULT_ETS_PRICE } from "@/lib/cbam-constants";

/**
 * Resolves the EU ETS price (€/tCO₂e) from CBAM_ETS_PRICE.
 * Update CBAM_ETS_PRICE env variable quarterly to reflect current EU ETS market price.
 */
function resolveEtsPriceFromEnv(): number {
  const envPrice = process.env.CBAM_ETS_PRICE;
  if (envPrice) {
    const parsed = Number(envPrice);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_ETS_PRICE;
}

export async function getEtsPrice(): Promise<number> {
  return resolveEtsPriceFromEnv();
}

export function getEtsPriceSync(): number {
  return resolveEtsPriceFromEnv();
}
