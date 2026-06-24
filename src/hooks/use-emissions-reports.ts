"use client";

import { useCallback, useEffect, useState } from "react";

import type { CreateReportInput, EmissionsReport, ReportStatus } from "@/types/emissions-report";

interface UseEmissionsReportsResult {
  reports: EmissionsReport[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createReport: (input: CreateReportInput) => Promise<EmissionsReport>;
  updateReportStatus: (id: string, status: ReportStatus) => Promise<EmissionsReport>;
}

export function useEmissionsReports(): UseEmissionsReportsResult {
  const [reports, setReports] = useState<EmissionsReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/emissions-reports");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load emissions reports.");
      }

      setReports(data.reports ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emissions reports.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createReport = useCallback(
    async (input: CreateReportInput): Promise<EmissionsReport> => {
      const response = await fetch("/api/emissions-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create report.");
      }

      setReports((prev) => [data.report, ...prev]);
      return data.report as EmissionsReport;
    },
    []
  );

  const updateReportStatus = useCallback(
    async (id: string, status: ReportStatus): Promise<EmissionsReport> => {
      const response = await fetch("/api/emissions-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update report status.");
      }

      setReports((prev) =>
        prev.map((report) => (report.id === id ? (data.report as EmissionsReport) : report))
      );

      return data.report as EmissionsReport;
    },
    []
  );

  return { reports, isLoading, error, refresh, createReport, updateReportStatus };
}
