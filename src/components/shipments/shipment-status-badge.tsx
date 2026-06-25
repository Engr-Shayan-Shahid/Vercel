import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ShipmentRequestStatus } from "@/types/shipment-request";
import { SHIPMENT_STATUS_LABELS } from "@/types/shipment-request";

export const STATUS_STYLES: Record<ShipmentRequestStatus, string> = {
  pending_exporter:
    "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/15",
  submitted: "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/15",
  accepted: "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/15",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15",
  cancelled: "border-border bg-muted/30 text-muted-foreground",
};

interface ShipmentStatusBadgeProps {
  status: ShipmentRequestStatus;
  className?: string;
}

export function ShipmentStatusBadge({ status, className }: ShipmentStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", STATUS_STYLES[status], className)}
    >
      {SHIPMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
