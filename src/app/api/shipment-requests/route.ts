import { NextResponse } from "next/server";

import { getApiContext, requireImporterContext } from "@/lib/auth/api-context";
import { createShipmentRequestSchema } from "@/lib/shipment-request-schema";
import { mapRowToShipmentRequest } from "@/lib/shipment-request-store";
import { sendInvitationEmail } from "@/lib/email/send-invitation";
import type { Database } from "@/types/database";

type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];
type InvitationInsert = Database["public"]["Tables"]["invitations"]["Insert"];
type ShipmentRequestRow = Database["public"]["Tables"]["shipment_requests"]["Row"];
type ShipmentRequestInsert = Database["public"]["Tables"]["shipment_requests"]["Insert"];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const INVITE_EXPIRES_DAYS = 14;

export async function GET() {
  const result = await getApiContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId, orgType } = result.context;

  if (orgType === "importer") {
    const { data, error } = await supabase
      .from("shipment_requests")
      .select("*")
      .eq("importer_org_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: (data ?? []).map(mapRowToShipmentRequest) });
  }

  // Exporter: RLS allows rows where exporter_org_id matches or invitation email matches
  const { data, error } = await supabase
    .from("shipment_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: (data ?? []).map(mapRowToShipmentRequest) });
}

export async function POST(request: Request) {
  const result = await requireImporterContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId, organization } = result.context;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createShipmentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { materialType, mass, originCountry, exporterEmail, cnCode, referenceNumber, notes } =
    parsed.data;

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Insert invitation first
  const invitationInsert: InvitationInsert = {
    importer_org_id: organizationId,
    email: exporterEmail,
    token,
    status: "pending",
    expires_at: expiresAt,
  };

  const { data: rawInvitationData, error: invitationError } = await supabase
    .from("invitations")
    .insert(invitationInsert)
    .select("*")
    .single();

  if (invitationError) {
    return NextResponse.json({ error: invitationError.message }, { status: 500 });
  }

  const invitationData = rawInvitationData as InvitationRow;

  // Insert shipment request linked to invitation
  const shipmentRequestInsert: ShipmentRequestInsert = {
    importer_org_id: organizationId,
    invitation_id: invitationData.id,
    exporter_email: exporterEmail,
    material_type: materialType,
    mass,
    origin_country: originCountry,
    cn_code: cnCode ?? null,
    reference_number: referenceNumber ?? null,
    notes: notes ?? null,
    status: "pending_exporter",
  };

  const { data: rawRequestData, error: requestError } = await supabase
    .from("shipment_requests")
    .insert(shipmentRequestInsert)
    .select("*")
    .single();

  if (requestError) {
    // Attempt cleanup of orphaned invitation
    await supabase.from("invitations").delete().eq("id", invitationData.id);
    return NextResponse.json({ error: requestError.message }, { status: 500 });
  }

  const requestData = rawRequestData as ShipmentRequestRow;

  const inviteLink = `${APP_URL}/invite/${token}`;
  const importerOrgName =
    (organization as { name?: string }).name ?? "An importer on CBAMVault";

  const emailResult = await sendInvitationEmail({
    to: exporterEmail,
    importerOrgName,
    materialType,
    mass,
    originCountry,
    inviteLink,
    token,
  });

  return NextResponse.json(
    {
      request: mapRowToShipmentRequest(requestData),
      inviteLink,
      emailSent: emailResult.ok,
      emailError: emailResult.ok ? undefined : emailResult.error,
      devRedirected: emailResult.devRedirected ?? false,
      deliveredTo: emailResult.deliveredTo,
      intendedRecipient: emailResult.intendedRecipient,
    },
    { status: 201 }
  );
}
