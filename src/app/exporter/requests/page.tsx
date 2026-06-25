import type { Metadata } from "next";

import { ExporterRequestsContent } from "@/components/shipments/exporter-requests-content";

export const metadata: Metadata = {
  title: "My Requests — CBAMVault Exporter",
};

export default function ExporterRequestsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            My Requests
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Emission data requests sent to you by importers. Submit your data to complete each request.
          </p>
        </div>
      </div>

      <ExporterRequestsContent />
    </div>
  );
}
