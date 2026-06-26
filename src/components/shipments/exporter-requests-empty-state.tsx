import { Inbox } from "lucide-react";

export function ExporterRequestsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/60 bg-charcoal/20 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
        <Inbox className="h-6 w-6 text-primary" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">No requests yet</p>
        <p className="text-xs text-muted-foreground">
          When an importer sends you a shipment data request, it will appear here.
        </p>
      </div>
    </div>
  );
}
