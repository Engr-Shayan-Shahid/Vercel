"use client";

import { useState } from "react";

import { ShipmentRequestForm } from "@/components/shipments/shipment-request-form";
import { ShipmentRequestsTable } from "@/components/shipments/shipment-requests-table";
import { ImporterReviewPanel } from "@/components/shipments/importer-review-panel";
import { useShipmentRequests } from "@/components/shipments/use-shipment-requests";
import type { ShipmentRequest } from "@/types/shipment-request";

export function ShipmentsPageContent() {
  const { requests, isLoading, error, refetch } = useShipmentRequests();
  const [reviewingRequest, setReviewingRequest] = useState<ShipmentRequest | null>(null);

  function handleCreated(newRequest: ShipmentRequest) {
    void refetch();
    void newRequest;
  }

  function handleReviewed(updatedRequest: ShipmentRequest) {
    setReviewingRequest(null);
    void refetch();
    void updatedRequest;
  }

  return (
    <div className="space-y-8">
      <ShipmentRequestForm onCreated={handleCreated} />

      {/* Review panel for submitted requests */}
      {reviewingRequest && (
        <ImporterReviewPanel
          request={reviewingRequest}
          onAccepted={handleReviewed}
          onRejected={handleReviewed}
        />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Requests</h2>
          {!isLoading && (
            <span className="text-xs text-muted-foreground">
              {requests.length} {requests.length === 1 ? "request" : "requests"}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/30" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-charcoal/20 py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={() => void refetch()}
              className="text-xs text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <ShipmentRequestsTable
            requests={requests}
            variant="importer"
            onReview={(req) => setReviewingRequest(req)}
          />
        )}
      </div>
    </div>
  );
}
