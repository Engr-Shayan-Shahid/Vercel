import { NextResponse } from "next/server";

import { lookupInvitationByToken } from "@/lib/invitations/lookup-invitation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  const result = await lookupInvitationByToken(token);

  if (!result.ok) {
    const statusMap: Record<string, number> = {
      not_found: 404,
      expired: 410,
      revoked: 410,
      admin_not_configured: 503,
    };

    return NextResponse.json(
      { error: result.error },
      { status: statusMap[result.error] ?? 404 }
    );
  }

  return NextResponse.json({ invitation: result.data });
}
