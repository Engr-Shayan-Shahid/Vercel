import { StatCards } from "@/components/dashboard/stat-cards";
import { ComplianceSummary } from "@/components/dashboard/compliance-summary";
import { ImportForm } from "@/components/imports/import-form";
import { RecentImportsTable } from "@/components/imports/recent-imports-table";
import { BridgeActivity } from "@/components/shipments/bridge-activity";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Overview of your CBAM compliance metrics and import activity.
        </p>
      </div>

      <StatCards />

      <BridgeActivity />

      <div className="grid gap-6 xl:grid-cols-2">
        <ImportForm />
        <RecentImportsTable />
      </div>

      <ComplianceSummary />
    </div>
  );
}
