import { NextResponse } from "next/server";

import { requireExporterContext } from "@/lib/auth/api-context";
import type { Database } from "@/types/database";

type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];

export async function POST(request: Request) {
  const result = await requireExporterContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId, user } = result.context;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = (body as { token?: unknown }).token;
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }

  // Fetch the invitation using authenticated client (RLS: email must match)
  const { data: rawInvitation, error: invitationError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (invitationError) {
    return NextResponse.json({ error: invitationError.message }, { status: 500 });
  }

  if (!rawInvitation) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  const invitation = rawInvitation as InvitationRow;

  // Email check
  if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json(
      {
        error: "email_mismatch",
        message: `This invitation was sent to ${invitation.email}. Please sign in with that email address.`,
      },
      { status: 403 }
    );
  }

  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: "This invitation has already been used or is no longer valid." },
      { status: 409 }
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invitation has expired." }, { status: 410 });
  }

  // Mark invitation accepted
  const { error: updateInvitationError } = await supabase
    .from("invitations")
    .update({ status: "accepted" } as never)
    .eq("id", invitation.id);

  if (updateInvitationError) {
    return NextResponse.json({ error: updateInvitationError.message }, { status: 500 });
  }

  // Link shipment requests to exporter org
  const { data: updatedRequests, error: updateRequestsError } = await supabase
    .from("shipment_requests")
    .update({ exporter_org_id: organizationId } as never)
    .eq("invitation_id", invitation.id)
    .select("id");

  if (updateRequestsError) {
    return NextResponse.json({ error: updateRequestsError.message }, { status: 500 });
  }

  return NextResponse.json({
    accepted: true,
    requestIds: (updatedRequests ?? []).map((r) => (r as { id: string }).id),
  });
}
