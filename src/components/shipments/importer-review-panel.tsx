"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { ShipmentRequest } from "@/types/shipment-request";

interface ImporterReviewPanelProps {
  request: ShipmentRequest;
  onAccepted?: (updatedRequest: ShipmentRequest) => void;
  onRejected?: (updatedRequest: ShipmentRequest) => void;
}

export function ImporterReviewPanel({
  request,
  onAccepted,
  onRejected,
}: ImporterReviewPanelProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  async function handleAccept() {
    setIsAccepting(true);
    try {
      const res = await fetch(`/api/shipment-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error((json as { error?: string }).error ?? "Failed to accept submission.");
        return;
      }

      const { importLog } = json as { importLog?: { id?: string; taxLiability?: number } };
      const liability = importLog?.taxLiability;
      toast.success(
        <div className="flex flex-col gap-1">
          <span>
            {liability != null
              ? `Accepted — CBAM liability: €${liability.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "Submission accepted — import log created."}
          </span>
          <a
            href="/import-logs"
            className="flex items-center gap-1 text-xs underline opacity-80 hover:opacity-100"
          >
            View import log
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      );
      onAccepted?.((json as { request: ShipmentRequest }).request);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept submission.");
    } finally {
      setIsAccepting(false);
    }
  }

  async function handleReject() {
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/shipment-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectionReason.trim() || undefined }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error((json as { error?: string }).error ?? "Failed to reject submission.");
        return;
      }

      toast.success("Submission rejected.");
      setShowRejectForm(false);
      setRejectionReason("");
      onRejected?.((json as { request: ShipmentRequest }).request);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject submission.");
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <Card className="border-blue-500/20 bg-blue-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
          <span className="flex h-2 w-2 rounded-full bg-blue-400" />
          Submitted — Awaiting Review
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {request.exporterEmail} submitted emission data on{" "}
          {request.submittedAt
            ? new Date(request.submittedAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Emission data summary */}
        <div className="rounded-lg border border-border/50 bg-black/20 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Submitted Emission Data
          </p>
          <dl className="grid gap-2 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Emission Factor</dt>
              <dd className="mt-0.5 text-sm font-semibold text-blue-400">
                {request.emissionFactor != null ? `${request.emissionFactor} t CO₂e/t` : "—"}
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
          </dl>
          {request.submissionNotes && (
            <div className="mt-3 border-t border-border/40 pt-3">
              <dt className="text-xs text-muted-foreground">Exporter Notes</dt>
              <dd className="mt-1 text-sm text-foreground">{request.submissionNotes}</dd>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!showRejectForm ? (
          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={isAccepting || isRejecting}
              className="flex-1 gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isAccepting ? "Accepting…" : "Accept & Create Import Log"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRejectForm(true)}
              disabled={isAccepting || isRejecting}
              className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason (optional)</Label>
              <textarea
                id="rejectionReason"
                rows={3}
                placeholder="Explain why you're rejecting this submission…"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={isRejecting}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason("");
                }}
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isRejecting}
                className="flex-1 border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                {isRejecting ? "Rejecting…" : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
