"use client";

import { useState } from "react";

import { ShipmentRequestsTable } from "@/components/shipments/shipment-requests-table";
import { useShipmentRequests } from "@/components/shipments/use-shipment-requests";
import type { ShipmentRequestStatus } from "@/types/shipment-request";

type FilterTab = "all" | ShipmentRequestStatus;

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending_exporter" },
  { label: "Submitted", value: "submitted" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

export function ExporterRequestsContent() {
  const { requests, isLoading, error, refetch } = useShipmentRequests();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered =
    activeTab === "all" ? requests : requests.filter((r) => r.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-black/30 p-1 ring-1 ring-border/50 w-fit">
        {TABS.map((tab) => {
          const count =
            tab.value === "all"
              ? requests.length
              : requests.filter((r) => r.status === tab.value).length;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {!isLoading && count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs leading-none ${
                    isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/30" />
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
        <ShipmentRequestsTable requests={filtered} variant="exporter" />
      )}
    </div>
  );
}
