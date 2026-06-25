"use client";

import Link from "next/link";
import { ArrowRight, Link2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShipmentStatusBadge } from "@/components/shipments/shipment-status-badge";
import { useShipmentRequests } from "@/components/shipments/use-shipment-requests";

export function BridgeActivity() {
  const { requests, isLoading, error, refetch } = useShipmentRequests();

  const recent = requests.slice(0, 5);

  return (
    <Card className="border-border/80 bg-charcoal/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
            <Link2 className="h-4 w-4 text-primary" />
            Bridge Activity
          </CardTitle>
          <Link
            href="/shipments"
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Recent exporter emission data requests
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/30" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={() => void refetch()}
              className="text-xs text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-black/20 py-8 text-center">
            <p className="text-sm text-muted-foreground">No shipment requests yet.</p>
            <Link href="/shipments" className="text-xs text-primary hover:underline">
              Create your first request →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-black/20 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {req.materialType} — {req.mass.toLocaleString()} t
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{req.exporterEmail}</p>
                </div>
                <ShipmentStatusBadge status={req.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
