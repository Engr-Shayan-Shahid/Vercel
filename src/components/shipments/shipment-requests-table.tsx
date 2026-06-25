"use client";

import Link from "next/link";
import { FileText, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShipmentStatusBadge } from "@/components/shipments/shipment-status-badge";
import type { ShipmentRequest } from "@/types/shipment-request";

interface ShipmentRequestsTableProps {
  requests: ShipmentRequest[];
  variant?: "importer" | "exporter";
  onReview?: (request: ShipmentRequest) => void;
}

function EmptyState({ variant }: { variant: "importer" | "exporter" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/60 bg-charcoal/20 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
        <Truck className="h-6 w-6 text-primary" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">No shipment requests yet</p>
        <p className="text-xs text-muted-foreground">
          {variant === "exporter"
            ? "When an importer sends you a request, it will appear here."
            : "Create your first request above to invite an exporter."}
        </p>
      </div>
    </div>
  );
}

export function ShipmentRequestsTable({
  requests,
  variant = "importer",
  onReview,
}: ShipmentRequestsTableProps) {
  if (requests.length === 0) {
    return <EmptyState variant={variant} />;
  }

  if (variant === "exporter") {
    return (
      <div className="overflow-hidden rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-charcoal/40 hover:bg-charcoal/50">
              <TableHead className="text-xs font-semibold text-muted-foreground">Material</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Mass (t)</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Origin</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Date</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id} className="hover:bg-charcoal/20">
                <TableCell className="font-medium text-foreground">{req.materialType}</TableCell>
                <TableCell className="text-muted-foreground">{req.mass.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{req.originCountry}</TableCell>
                <TableCell>
                  <ShipmentStatusBadge status={req.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(req.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                    <Link href={`/exporter/requests/${req.id}`}>
                      {req.status === "pending_exporter" ? "Submit" : "View"}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Importer variant
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="bg-charcoal/40 hover:bg-charcoal/50">
            <TableHead className="text-xs font-semibold text-muted-foreground">Material</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Mass (t)</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Origin</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Exporter</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Created</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <TableRow key={req.id} className="hover:bg-charcoal/20">
              <TableCell className="font-medium text-foreground">{req.materialType}</TableCell>
              <TableCell className="text-muted-foreground">{req.mass.toLocaleString()}</TableCell>
              <TableCell className="text-muted-foreground">{req.originCountry}</TableCell>
              <TableCell className="max-w-[180px] truncate text-muted-foreground">
                {req.exporterEmail}
              </TableCell>
              <TableCell>
                <ShipmentStatusBadge status={req.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(req.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell>
                {req.status === "submitted" && onReview ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-blue-400 hover:text-blue-300"
                    onClick={() => onReview(req)}
                  >
                    Review
                  </Button>
                ) : req.status === "accepted" && req.importLogId ? (
                  <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                    <Link href="/import-logs">
                      <FileText className="h-3 w-3" />
                      Import log
                    </Link>
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
