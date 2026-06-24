"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useImports } from "@/context/imports-context";
import { formatTaxLiability } from "@/lib/calculate-tax-liability";
import type { ImportRecord } from "@/types/import-record";

interface DeleteImportDialogProps {
  record: ImportRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteImportDialog({ record, open, onOpenChange }: DeleteImportDialogProps) {
  const { deleteImport } = useImports();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!record) return;

    const id = record.id?.trim();
    if (!id) {
      console.error("No ID found for operation");
      toast.error("Delete failed", { description: "No ID found for this import record." });
      return;
    }

    setIsDeleting(true);

    try {
      await deleteImport(id);
      toast.success("Import record deleted");
      onOpenChange(false);
    } catch (error) {
      toast.error("Delete failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete import record?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the {record?.materialType ?? "import"} record from{" "}
            {record?.originCountry ?? "origin"} (
            {record ? formatTaxLiability(record.taxLiability) : "€0.00"} liability). This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            variant="default"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
