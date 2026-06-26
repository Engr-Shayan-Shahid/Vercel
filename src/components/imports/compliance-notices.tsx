import { AlertTriangle, Info, type LucideIcon } from "lucide-react";

import {
  FOREIGN_PRICE_PROOF_WARNING,
  PUNITIVE_DEFAULTS_WARNING,
} from "@/lib/cbam-constants";
import { DEFAULT_ETS_PRICE } from "@/lib/cbam-constants";

export function ComplianceNotices() {
  return (
    <div className="space-y-3">
      <Notice
        variant="warning"
        icon={AlertTriangle}
        title="Default values are punitive"
        message={PUNITIVE_DEFAULTS_WARNING}
      />
      <Notice
        variant="info"
        icon={Info}
        title={`ETS price: €${DEFAULT_ETS_PRICE}/tCO₂e (configurable)`}
        message="EU ETS prices update quarterly in 2026 and weekly from 2027. Set CBAM_ETS_PRICE in your environment and update it quarterly to match the current EU ETS market price."
      />
      <Notice
        variant="info"
        icon={Info}
        title="Foreign carbon price deductions"
        message={FOREIGN_PRICE_PROOF_WARNING}
      />
    </div>
  );
}

function Notice({
  variant,
  icon: Icon,
  title,
  message,
}: {
  variant: "warning" | "info";
  icon: LucideIcon;
  title: string;
  message: string;
}) {
  const styles =
    variant === "warning"
      ? "border-amber-500/30 bg-amber-500/5 text-amber-200"
      : "border-border bg-charcoal/40 text-muted-foreground";

  const iconStyles = variant === "warning" ? "text-amber-400" : "text-primary";

  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 ${styles}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconStyles}`} />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
