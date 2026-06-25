import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lookupInvitationByToken } from "@/lib/invitations/lookup-invitation";
import { createClient } from "@/lib/supabase/server";
import { InviteAcceptClient } from "@/components/shipments/invite-accept-client";

export const metadata: Metadata = {
  title: "Invitation — CBAMVault",
};

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  // Look up invitation (admin client, public access)
  const lookupResult = await lookupInvitationByToken(token);

  if (!lookupResult.ok) {
    const isExpired = lookupResult.error === "expired";
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md border-border/80 bg-charcoal/40">
          <CardHeader className="space-y-3 pb-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
              {isExpired ? (
                <AlertTriangle className="h-7 w-7 text-destructive" strokeWidth={1.5} />
              ) : (
                <XCircle className="h-7 w-7 text-destructive" strokeWidth={1.5} />
              )}
            </div>
            <CardTitle className="normal-case tracking-normal text-foreground">
              {isExpired ? "Invitation expired" : "Invalid invitation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isExpired
                ? "This invitation link has expired. Please ask the importer to send a new invite."
                : "This invitation link is invalid or has been revoked."}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login?role=exporter">Sign in as Exporter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invitation = lookupResult.data;

  // Check current auth state (may be null if not logged in)
  const supabase = await createClient();
  let currentUserEmail: string | null = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUserEmail = user?.email ?? null;
  }

  return (
    <InviteAcceptClient
      token={token}
      invitation={invitation}
      currentUserEmail={currentUserEmail}
    />
  );
}
