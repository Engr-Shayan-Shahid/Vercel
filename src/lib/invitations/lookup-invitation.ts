import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];
type ShipmentRequestRow = Database["public"]["Tables"]["shipment_requests"]["Row"];

export type InvitationLookupError =
  | "not_found"
  | "expired"
  | "revoked"
  | "admin_not_configured";

export interface PublicInvitationData {
  token: string;
  email: string;
  status: string;
  expiresAt: string;
  isExpired: boolean;
  materialType: string;
  mass: number;
  originCountry: string;
  cnCode: string | null;
  referenceNumber: string | null;
  importerOrgId: string;
}

export type InvitationLookupResult =
  | { ok: true; data: PublicInvitationData }
  | { ok: false; error: InvitationLookupError };

export async function lookupInvitationByToken(
  token: string
): Promise<InvitationLookupResult> {
  if (!isAdminConfigured()) {
    return { ok: false, error: "admin_not_configured" };
  }

  const admin = createAdminClient();

  const { data: rawInvitation, error } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !rawInvitation) {
    return { ok: false, error: "not_found" };
  }

  const invitation = rawInvitation as unknown as InvitationRow;

  if (invitation.status === "revoked") {
    return { ok: false, error: "revoked" };
  }

  const isExpired =
    invitation.status === "expired" ||
    new Date(invitation.expires_at) < new Date();

  if (isExpired && invitation.status !== "accepted") {
    return { ok: false, error: "expired" };
  }

  // Fetch linked shipment request
  const { data: rawRequest } = await admin
    .from("shipment_requests")
    .select("*")
    .eq("invitation_id", invitation.id)
    .maybeSingle();

  const firstRequest = (rawRequest as unknown as ShipmentRequestRow | null);

  return {
    ok: true,
    data: {
      token: invitation.token,
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expires_at,
      isExpired: new Date(invitation.expires_at) < new Date(),
      materialType: firstRequest?.material_type ?? "Unknown",
      mass: firstRequest ? Number(firstRequest.mass) : 0,
      originCountry: firstRequest?.origin_country ?? "Unknown",
      cnCode: firstRequest?.cn_code ?? null,
      referenceNumber: firstRequest?.reference_number ?? null,
      importerOrgId: invitation.importer_org_id,
    },
  };
}
