import { ImportForm } from "@/components/imports/import-form";
import { RecentImportsTable } from "@/components/imports/recent-imports-table";

export default function ImportLogsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Import Logs
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Log CBAM-relevant imports and review calculated tax liability in real time.
        </p>
      </div>

      <ImportForm />
      <RecentImportsTable />
    </div>
  );
}
