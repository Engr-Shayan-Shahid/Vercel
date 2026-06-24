import { StatCards } from "@/components/dashboard/stat-cards";
import { ImportForm } from "@/components/imports/import-form";
import { RecentImportsTable } from "@/components/imports/recent-imports-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

      <div className="grid gap-6 xl:grid-cols-2">
        <ImportForm />
        <RecentImportsTable />
      </div>

      <Card className="border-border/80 bg-charcoal/40">
        <CardHeader>
          <CardTitle className="normal-case tracking-normal text-foreground">
            Compliance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {[
              { label: "Reporting Period", value: "Q1 2026" },
              { label: "CBAM Certificates Required", value: "847" },
              { label: "Next Filing Deadline", value: "Apr 30, 2026" },
              { label: "Data Source", value: "In-memory demo (Phase 2)" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between border-b border-border/40 pb-4 last:border-0 last:pb-0"
              >
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm font-medium text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
