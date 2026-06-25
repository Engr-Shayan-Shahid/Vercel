"use client";

import { useCallback, useEffect, useState } from "react";

import type { ShipmentRequest } from "@/types/shipment-request";

interface UseShipmentRequestsResult {
  requests: ShipmentRequest[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useShipmentRequests(): UseShipmentRequestsResult {
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shipment-requests");
      const json = await res.json();
      if (!res.ok) {
        setError((json as { error?: string }).error ?? "Failed to load requests.");
        return;
      }
      setRequests((json as { requests: ShipmentRequest[] }).requests ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { requests, isLoading, error, refetch };
}
