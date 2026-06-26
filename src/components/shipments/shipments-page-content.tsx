"use client";

import { useState } from "react";

import { ShipmentRequestForm } from "@/components/shipments/shipment-request-form";
import { ShipmentRequestsTable } from "@/components/shipments/shipment-requests-table";
import { ImporterReviewPanel } from "@/components/shipments/importer-review-panel";
import { useShipmentRequests } from "@/components/shipments/use-shipment-requests";
import { ErrorCard } from "@/components/ui/error-card";
import { SectionErrorBoundary } from "@/components/ui/section-error-boundary";
import { TableSkeleton } from "@/components/ui/table-skeleton";
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
          {!isLoading && !error && (
            <span className="text-xs text-muted-foreground">
              {requests.length} {requests.length === 1 ? "request" : "requests"}
            </span>
          )}
        </div>

        <SectionErrorBoundary title="Shipments failed to load">
          {isLoading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : error ? (
            <ErrorCard message={error} onRetry={() => void refetch()} />
          ) : (
            <div className="overflow-x-auto">
              <ShipmentRequestsTable
                requests={requests}
                variant="importer"
                onReview={(req) => setReviewingRequest(req)}
              />
            </div>
          )}
        </SectionErrorBoundary>
      </div>
    </div>
  );
}
