"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Package, CheckCircle2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicInvitationData } from "@/lib/invitations/lookup-invitation";

interface InviteAcceptClientProps {
  token: string;
  invitation: PublicInvitationData;
  currentUserEmail: string | null;
}

export function InviteAcceptClient({
  token,
  invitation,
  currentUserEmail,
}: InviteAcceptClientProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);

  const isLoggedIn = currentUserEmail !== null;
  const emailMatches =
    isLoggedIn &&
    currentUserEmail!.toLowerCase() === invitation.email.toLowerCase();
  const emailMismatch = isLoggedIn && !emailMatches;

  const signupHref = `/signup?role=exporter&email=${encodeURIComponent(invitation.email)}&redirect=/invite/${token}`;
  const loginHref = `/login?role=exporter&email=${encodeURIComponent(invitation.email)}&redirect=/invite/${token}`;

  async function handleAccept() {
    setIsAccepting(true);
    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error === "email_mismatch") {
          toast.error("Wrong account", { description: json.message });
        } else {
          toast.error("Could not accept invitation", {
            description: json.error ?? "Please try again.",
          });
        }
        return;
      }

      toast.success("Invitation accepted!", {
        description: "The shipment request is now linked to your organisation.",
      });
      router.push("/exporter/requests");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/80 bg-charcoal/40">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
            <Package className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
              CBAMVault
            </p>
            <CardTitle className="mt-1 normal-case tracking-normal text-foreground">
              You&apos;ve been invited
            </CardTitle>
            <p className="mt-1.5 text-sm text-muted-foreground">
              An importer has requested embedded emission data for the following shipment.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Shipment summary */}
          <div className="rounded-lg border border-border/60 bg-black/20 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
              Shipment Details
            </p>
            <div className="grid grid-cols-2 gap-y-2.5 text-sm">
              <span className="text-muted-foreground">Material</span>
              <span className="font-medium text-foreground">{invitation.materialType}</span>
              <span className="text-muted-foreground">Mass</span>
              <span className="font-medium text-foreground">{invitation.mass} tonnes</span>
              <span className="text-muted-foreground">Origin</span>
              <span className="font-medium text-foreground">{invitation.originCountry}</span>
              <span className="text-muted-foreground">Invited to</span>
              <span className="font-medium text-foreground truncate">{invitation.email}</span>
            </div>
          </div>

          {/* State: logged in with matching email → accept button */}
          {isLoggedIn && emailMatches && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Signed in as <span className="font-medium">{currentUserEmail}</span>
              </div>
              <Button
                className="w-full"
                onClick={handleAccept}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Accepting…
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
            </div>
          )}

          {/* State: logged in with wrong email */}
          {emailMismatch && (
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-sm text-amber-300/90">
                  You&apos;re signed in as <strong>{currentUserEmail}</strong>, but this
                  invitation was sent to <strong>{invitation.email}</strong>. Please sign in
                  with the correct account.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href={loginHref}>Sign in as {invitation.email}</Link>
              </Button>
            </div>
          )}

          {/* State: not logged in */}
          {!isLoggedIn && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Create an Exporter account or sign in to accept this invitation.
              </p>
              <Button asChild className="w-full">
                <Link href={signupHref}>Create Exporter account</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={loginHref}>Sign in as Exporter</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
