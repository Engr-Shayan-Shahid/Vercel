import { NextResponse } from "next/server";

import { requireOwnerContext } from "@/lib/auth/api-context";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const result = await requireOwnerContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId, user } = result.context;
  const { userId } = await params;

  if (userId === user.id) {
    return NextResponse.json({ error: "You cannot remove yourself." }, { status: 400 });
  }

  // Pending invite revocation (userId is invite id)
  const { data: pendingInvite } = await supabase
    .from("team_invites")
    .select("id, status")
    .eq("id", userId)
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingInvite) {
    const { error } = await supabase
      .from("team_invites")
      .update({ status: "revoked" })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, revoked: "invite" });
  }

  const { data: targetMember } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!targetMember) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  if (targetMember.role === "owner") {
    const { count } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("role", "owner");

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the only organization owner." },
        { status: 400 }
      );
    }
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, removed: userId });
}
