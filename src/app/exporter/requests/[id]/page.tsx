import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShipmentStatusBadge } from "@/components/shipments/shipment-status-badge";
import { ShipmentSubmissionForm } from "@/components/shipments/shipment-submission-form";
import { createClient } from "@/lib/supabase/server";
import { mapRowToShipmentRequest } from "@/lib/shipment-request-store";
import type { ShipmentRequest } from "@/types/shipment-request";
import type { Database } from "@/types/database";

export const metadata: Metadata = {
  title: "Submission — CBAMVault Exporter",
};

type ShipmentRequestRow = Database["public"]["Tables"]["shipment_requests"]["Row"];

async function getRequest(id: string): Promise<ShipmentRequest | null> {
  try {
    const supabase = await createClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("shipment_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return mapRowToShipmentRequest(data as ShipmentRequestRow);
  } catch {
    return null;
  }
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExporterRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const request = await getRequest(id);

  if (!request) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/exporter/requests">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <Card className="border-border/80 bg-charcoal/40">
          <CardContent className="py-16 text-center">
            <p className="text-sm text-muted-foreground">Request not found or access denied.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 gap-2">
            <Link href="/exporter/requests">
              <ArrowLeft className="h-4 w-4" />
              My Requests
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {request.materialType} Shipment
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Requested by importer · {request.mass.toLocaleString()} tonnes from{" "}
            {request.originCountry}
          </p>
        </div>
        <ShipmentStatusBadge status={request.status} className="mt-1 shrink-0" />
      </div>

      {/* State-based content */}
      {request.status === "pending_exporter" && (
        <ShipmentSubmissionForm request={request} />
      )}

      {request.status === "submitted" && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
              <Clock className="h-5 w-5 text-blue-400" />
              Awaiting Importer Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your emission data has been submitted and is awaiting review by the importer.
            </p>
            <div className="rounded-lg border border-border/50 bg-black/20 p-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Emission Factor Submitted</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-blue-400">
                    {request.emissionFactor ?? "—"} t CO₂e/t
                  </dd>
                </div>
                {request.directEmissions != null && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Direct Emissions</dt>
                    <dd className="mt-0.5 text-sm text-foreground">{request.directEmissions} t CO₂e/t</dd>
                  </div>
                )}
                {request.indirectEmissions != null && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Indirect Emissions</dt>
                    <dd className="mt-0.5 text-sm text-foreground">{request.indirectEmissions} t CO₂e/t</dd>
                  </div>
                )}
                {request.submittedAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Submitted At</dt>
                    <dd className="mt-0.5 text-sm text-foreground">
                      {new Date(request.submittedAt).toLocaleString("en-GB")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/exporter/requests">← Back to My Requests</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {request.status === "accepted" && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              Submission Accepted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The importer has accepted your emission data. An import log has been created in
              their system.
            </p>
            <div className="rounded-lg border border-border/50 bg-black/20 p-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Emission Factor</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-green-400">
                    {request.emissionFactor ?? "—"} t CO₂e/t
                  </dd>
                </div>
                {request.acceptedAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Accepted At</dt>
                    <dd className="mt-0.5 text-sm text-foreground">
                      {new Date(request.acceptedAt).toLocaleString("en-GB")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/exporter/requests">← Back to My Requests</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {request.status === "rejected" && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
              <XCircle className="h-5 w-5 text-destructive" />
              Submission Rejected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The importer has rejected your submission. Please contact them for further details.
            </p>
            {request.submissionNotes && (
              <div className="rounded-lg border border-border/50 bg-black/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">Rejection Reason</p>
                <p className="mt-1 text-sm text-foreground">{request.submissionNotes}</p>
              </div>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/exporter/requests">← Back to My Requests</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
