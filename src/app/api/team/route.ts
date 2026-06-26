import { NextResponse } from "next/server";

import { getMembershipRole, requireImporterContext } from "@/lib/auth/api-context";

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: string;
  joinedAt: string;
  status: "active" | "pending";
}

export async function GET() {
  const result = await requireImporterContext();
  if (!result.ok) return result.response;

  const { supabase, organizationId, user } = result.context;

  const { data: memberRows, error: membersError } = await supabase
    .from("organization_members")
    .select("user_id, role, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  const userIds = (memberRows ?? []).map((row) => row.user_id);

  const { data: profileRows, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, email, compliance_officer_name")
    .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profileMap = new Map(
    (profileRows ?? []).map((p) => [
      p.user_id,
      { email: p.email, name: p.compliance_officer_name },
    ])
  );

  const members: TeamMember[] = (memberRows ?? []).map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      userId: row.user_id,
      email: profile?.email ?? "",
      name: profile?.name ?? "Team member",
      role: row.role,
      joinedAt: row.created_at,
      status: "active" as const,
    };
  });

  const { data: inviteRows, error: invitesError } = await supabase
    .from("team_invites")
    .select("id, email, role, created_at, expires_at")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (invitesError) {
    return NextResponse.json({ error: invitesError.message }, { status: 500 });
  }

  const pendingInvites: TeamMember[] = (inviteRows ?? []).map((invite) => ({
    userId: invite.id,
    email: invite.email,
    name: invite.email.split("@")[0] ?? invite.email,
    role: invite.role,
    joinedAt: invite.created_at,
    status: "pending" as const,
  }));

  const role = await getMembershipRole(supabase, user.id, organizationId);

  return NextResponse.json({
    members: [...members, ...pendingInvites],
    currentUserId: user.id,
    role,
  });
}
