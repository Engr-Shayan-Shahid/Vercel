import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOwnerContext } from "@/lib/auth/api-context";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const INVITE_EXPIRES_DAYS = 14;

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export async function POST(request: Request) {
  const result = await requireOwnerContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId, user, organization } = result.context;

  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Team invites require SUPABASE_SERVICE_ROLE_KEY. Add it to your server environment.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const email = parsed.data.email.toLowerCase();

  // Block duplicate active membership
  const { data: existingProfiles } = await supabase
    .from("profiles")
    .select("user_id, email")
    .ilike("email", email);

  if (existingProfiles && existingProfiles.length > 0) {
    const existingUserId = existingProfiles[0].user_id;
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("user_id", existingUserId)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: "This user is already a member of your organization." },
        { status: 409 }
      );
    }
  }

  // Block duplicate pending invite
  const { data: pendingInvite } = await supabase
    .from("team_invites")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .ilike("email", email)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (pendingInvite) {
    return NextResponse.json(
      { error: "An invitation is already pending for this email." },
      { status: 409 }
    );
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + INVITE_EXPIRES_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: insertError } = await supabase.from("team_invites").insert({
    organization_id: organizationId,
    email,
    token,
    role: "member",
    invited_by: user.id,
    status: "pending",
    expires_at: expiresAt,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const admin = createAdminClient();
  const orgName = organization.name || "CBAMVault";

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        team_invite_token: token,
        account_type: "importer",
        invited_org_name: orgName,
      },
      redirectTo: `${APP_URL}/login?role=importer&team_invite=${token}`,
    }
  );

  if (inviteError) {
    await supabase
      .from("team_invites")
      .update({ status: "revoked" })
      .eq("token", token);

    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      email,
      inviteId: inviteData.user?.id ?? null,
      expiresAt,
    },
    { status: 201 }
  );
}
