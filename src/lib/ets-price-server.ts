import {
  getCurrentCbamQuarter,
  getOfficialCbamPrice,
} from "@/lib/cbam-certificate-price";
import { resolveEtsPriceFromEnv } from "@/lib/ets-price";
import { createClient } from "@/lib/supabase/server";

/** Resolves ETS price: org override → DB official → hardcoded official → env fallback. Server-only. */
export async function getEtsPriceForOrganization(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const { year, quarter } = getCurrentCbamQuarter();

  if (!supabase) {
    return getOfficialCbamPrice(year, quarter) ?? resolveEtsPriceFromEnv();
  }

  const { data: orgData } = await supabase
    .from("organizations")
    .select("ets_price_override")
    .eq("id", organizationId)
    .maybeSingle();

  const override = (orgData as { ets_price_override?: number | null } | null)?.ets_price_override;
  if (override != null && override > 0) {
    return override;
  }

  const quarterKey = `${year}-${quarter}`;
  const { data: priceData } = await supabase
    .from("cbam_certificate_prices")
    .select("price")
    .eq("quarter", quarterKey)
    .maybeSingle();

  const dbPrice = (priceData as { price?: number } | null)?.price;
  if (dbPrice != null && dbPrice > 0) {
    return Number(dbPrice);
  }

  const hardcodedPrice = getOfficialCbamPrice(year, quarter);
  if (hardcodedPrice != null) {
    return hardcodedPrice;
  }

  return resolveEtsPriceFromEnv();
}
