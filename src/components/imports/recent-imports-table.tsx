"use client";

import { useState } from "react";
import { PackageOpen, Pencil, Trash2 } from "lucide-react";

import { CalculationDetails } from "@/components/imports/calculation-details";
import { DeleteImportDialog } from "@/components/imports/delete-import-dialog";
import { EditImportModal } from "@/components/imports/edit-import-modal";
import { ProofViewerModal } from "@/components/imports/proof-viewer-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useImports } from "@/context/imports-context";
import {
  formatEmbeddedEmissions,
  formatEmissionFactor,
  formatTaxLiability,
  formatTonnes,
  getForeignPriceDeduction,
} from "@/lib/calculate-tax-liability";
import type { ImportRecord } from "@/types/import-record";

function getRecordId(record: ImportRecord): string | null {
  const id = record.id?.trim();
  return id || null;
}

export function RecentImportsTable() {
  const { imports, isLoading, error, getProofUrl } = useImports();
  const [proofRecord, setProofRecord] = useState<ImportRecord | null>(null);
  const [proofUrl, setProofUrl] = useState<string | undefined>();
  const [proofLoading, setProofLoading] = useState(false);
  const [editRecord, setEditRecord] = useState<ImportRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<ImportRecord | null>(null);

  function handleEdit(record: ImportRecord) {
    const id = getRecordId(record);
    if (!id) {
      console.error("No ID found for operation");
      return;
    }
    console.log("Opening edit for ID:", id);
    setEditRecord({ ...record, id });
  }

  function handleViewProof(record: ImportRecord) {
    setProofRecord(record);
    setProofUrl(undefined);
    setProofLoading(true);

    void getProofUrl(record.id)
      .then((url) => setProofUrl(url ?? undefined))
      .finally(() => setProofLoading(false));
  }

  function handleDelete(record: ImportRecord) {
    const id = getRecordId(record);
    if (!id) {
      console.error("No ID found for operation");
      return;
    }
    console.log("Opening delete confirmation for ID:", id);
    setDeleteRecord({ ...record, id });
  }

  return (
    <>
      <Card className="border-border/80 bg-charcoal/40">
        <CardHeader>
          <CardTitle className="normal-case tracking-normal text-foreground">
            Recent Imports
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Live CBAM calculation results — liability computed via the official formula.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {isLoading ? (
            <LoadingState />
          ) : imports.length === 0 ? (
            <EmptyState />
          ) : (
            <TooltipProvider delayDuration={150}>
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-deep-black/60">
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Material
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Mass
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Origin
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Eᵢ
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Embedded
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Foreign Price
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Total Liability
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {imports.map((record, index) => {
                      const foreignDeduction = getForeignPriceDeduction(record);

                      return (
                        <tr
                          key={record.id}
                          className="border-b border-border/40 transition-colors last:border-0 hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-3.5">
                            <span className="font-medium text-foreground">{record.materialType}</span>
                            {index === 0 && (
                              <span className="ml-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                Latest
                              </span>
                            )}
                            {record.proofOfPaymentFileName && (
                              <p className="mt-0.5 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => handleViewProof(record)}
                                  className="text-primary underline-offset-2 hover:underline"
                                >
                                  Proof: {record.proofOfPaymentFileName}
                                </button>
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-foreground">{formatTonnes(record.mass)}</td>
                          <td className="px-4 py-3.5 text-muted-foreground">
                            {record.originCountry}
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground">
                            {formatEmissionFactor(record.emissionFactor)}
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground">
                            {formatEmbeddedEmissions(record.embeddedEmissions)}
                          </td>
                          <td className="px-4 py-3.5 text-right text-muted-foreground">
                            {formatTaxLiability(foreignDeduction)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="inline-flex items-center justify-end gap-1.5">
                              <span className="font-semibold text-primary">
                                {formatTaxLiability(record.taxLiability)}
                              </span>
                              <CalculationDetails record={record} />
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-muted-foreground hover:text-primary"
                                onClick={() => handleEdit(record)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(record)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      <ProofViewerModal
        open={proofRecord !== null}
        onOpenChange={(open) => {
          if (!open) {
            setProofRecord(null);
            setProofUrl(undefined);
          }
        }}
        fileName={proofRecord?.proofOfPaymentFileName ?? "Proof of payment"}
        fileUrl={proofUrl}
        isLoading={proofLoading}
      />

      <EditImportModal
        record={editRecord}
        open={editRecord !== null}
        onOpenChange={(open) => {
          if (!open) setEditRecord(null);
        }}
      />

      <DeleteImportDialog
        record={deleteRecord}
        open={deleteRecord !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteRecord(null);
        }}
      />
    </>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center rounded-lg border border-border/60 bg-deep-black/40 px-6 py-12">
      <p className="text-sm text-muted-foreground">Loading import logs…</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-deep-black/40 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <PackageOpen className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground">No import records yet</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Submit an import to run the CBAM calculation engine. Results appear here instantly.
      </p>
    </div>
  );
}
