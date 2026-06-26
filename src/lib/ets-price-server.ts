import { resolveEtsPriceFromEnv } from "@/lib/ets-price";
import { createClient } from "@/lib/supabase/server";

/** Resolves ETS price using org override when set, else env default. Server-only. */
export async function getEtsPriceForOrganization(organizationId: string): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return resolveEtsPriceFromEnv();

  const { data } = await supabase
    .from("organizations")
    .select("ets_price_override")
    .eq("id", organizationId)
    .maybeSingle();

  const override = (data as { ets_price_override?: number | null } | null)?.ets_price_override;
  if (override != null && override > 0) {
    return override;
  }

  return resolveEtsPriceFromEnv();
}
