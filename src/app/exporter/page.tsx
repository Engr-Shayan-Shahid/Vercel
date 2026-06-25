import type { Metadata } from "next";

import { ExporterDashboardContent } from "@/components/shipments/exporter-dashboard-content";

export const metadata: Metadata = {
  title: "Exporter Portal — CBAMVault",
};

export default function ExporterDashboardPage() {
  return <ExporterDashboardContent />;
}
