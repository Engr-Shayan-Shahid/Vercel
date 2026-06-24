import { DEFAULT_ETS_PRICE } from "@/lib/cbam-constants";

/**
 * Resolves the current EU ETS price (€/tCO₂e).
 *
 * Phase 3: uses a configurable constant. Structured for quarterly (2026) /
 * weekly (2027) updates via a public API fetch with constant fallback.
 */
export async function getEtsPrice(): Promise<number> {
  const envPrice = process.env.CBAM_ETS_PRICE;
  if (envPrice) {
    const parsed = Number(envPrice);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  try {
    // Placeholder for a public EU ETS price feed — falls back silently when unavailable.
    const response = await fetch("https://api.carbonintensity.org.uk/intensity", {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return DEFAULT_ETS_PRICE;
    }

    // External API shape may differ; keep constant until a CBAM-specific feed is wired.
    await response.json();
    return DEFAULT_ETS_PRICE;
  } catch {
    return DEFAULT_ETS_PRICE;
  }
}

export function getEtsPriceSync(): number {
  const envPrice = process.env.CBAM_ETS_PRICE;
  if (envPrice) {
    const parsed = Number(envPrice);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_ETS_PRICE;
}
