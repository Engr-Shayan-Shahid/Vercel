"use client";

import Link from "next/link";
import { ArrowRight, SendHorizonal } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExporterRequestStats } from "@/components/shipments/exporter-request-stats";
import { ShipmentRequestsTable } from "@/components/shipments/shipment-requests-table";
import { useShipmentRequests } from "@/components/shipments/use-shipment-requests";

export function ExporterDashboardContent() {
  const { requests, isLoading, error, refetch } = useShipmentRequests();

  const recent = requests.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Exporter Portal
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your CBAM emission data submissions and respond to importer requests.
        </p>
      </div>

      <ExporterRequestStats requests={requests} isLoading={isLoading} />

      <Card className="border-border/80 bg-charcoal/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium text-foreground">
                Recent Emission Requests
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Importers have sent you these data requests.
              </p>
            </div>
            {!isLoading && requests.length > 0 && (
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/exporter/requests">
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/30" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={() => void refetch()}
                className="text-xs text-primary hover:underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <ShipmentRequestsTable requests={recent} variant="exporter" />
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-4">
        <div className="flex gap-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <SendHorizonal className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">How the Exporter Portal works</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              When an EU importer includes your products in a CBAM declaration, they&apos;ll send
              you a request via this portal. You&apos;ll provide embedded emission data for each
              product, which the importer uses to calculate their carbon liability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
