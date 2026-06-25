"use client";

import { CheckCircle2, Clock, SendHorizonal, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ShipmentRequest } from "@/types/shipment-request";

interface ExporterRequestStatsProps {
  requests: ShipmentRequest[];
  isLoading?: boolean;
}

export function ExporterRequestStats({ requests, isLoading }: ExporterRequestStatsProps) {
  const pending = requests.filter((r) => r.status === "pending_exporter").length;
  const submitted = requests.filter((r) => r.status === "submitted").length;
  const accepted = requests.filter((r) => r.status === "accepted").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  const statCards = [
    {
      label: "Pending",
      value: pending,
      description: "Awaiting your submission",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      ring: "ring-amber-500/20",
    },
    {
      label: "Submitted",
      value: submitted,
      description: "Emission data filed",
      icon: SendHorizonal,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      ring: "ring-blue-500/20",
    },
    {
      label: "Accepted",
      value: accepted,
      description: "Verified by importer",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      ring: "ring-emerald-500/20",
    },
    {
      label: "Rejected",
      value: rejected,
      description: "Requires correction",
      icon: XCircle,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      ring: "ring-rose-500/20",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map(({ label, value, description, icon: Icon, color, bg, ring }) => (
        <Card key={label} className="border-border/80 bg-charcoal/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ring-1 ${ring}`}>
              <Icon className={`h-4 w-4 ${color}`} strokeWidth={2} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {isLoading ? "—" : value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
