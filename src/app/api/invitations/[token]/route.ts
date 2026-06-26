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

    const errorMessages: Partial<Record<string, string>> = {
      expired: "This invitation has expired.",
    };

    return NextResponse.json(
      { error: errorMessages[result.error] ?? result.error },
      { status: statusMap[result.error] ?? 404 }
    );
  }

  const invitation = result.data;

  if (new Date(invitation.expiresAt) < new Date()) {
    return NextResponse.json(
      { error: "This invitation has expired." },
      { status: 410 }
    );
  }

  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: "This invitation has already been used." },
      { status: 409 }
    );
  }

  return NextResponse.json({ invitation });
}
