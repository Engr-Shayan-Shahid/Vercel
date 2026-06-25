import type { Metadata } from "next";

import { ShipmentsPageContent } from "@/components/shipments/shipments-page-content";

export const metadata: Metadata = {
  title: "Shipments — CBAMVault",
};

export default function ShipmentsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Shipment Requests
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Invite exporters and collect embedded emission data for your CBAM declarations.
        </p>
      </div>

      <ShipmentsPageContent />
    </div>
  );
}
