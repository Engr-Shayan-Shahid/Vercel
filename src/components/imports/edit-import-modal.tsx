"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useImports } from "@/context/imports-context";
import { cn } from "@/lib/utils";
import {
  ORIGIN_COUNTRIES,
  importRecordToEditInput,
  validateImportEditInput,
  hasValidationErrors,
  type ImportFormErrors,
  type ImportRecord,
  type ImportRecordEditInput,
} from "@/types/import-record";

interface EditImportModalProps {
  record: ImportRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditImportModal({ record, open, onOpenChange }: EditImportModalProps) {
  const { updateImport } = useImports();
  const [form, setForm] = useState<ImportRecordEditInput>({
    mass: "",
    originCountry: "",
    emissionFactor: "",
  });
  const [errors, setErrors] = useState<ImportFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (record && open) {
      setForm(importRecordToEditInput(record));
      setErrors({});
    }
  }, [record, open]);

  function updateField<K extends keyof ImportRecordEditInput>(
    key: K,
    value: ImportRecordEditInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof ImportFormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof ImportFormErrors];
        return next;
      });
    }
  }

  async function handleSave() {
    if (!record) return;

    if (!record.id?.trim()) {
      console.error("No ID found for operation");
      toast.error("Update failed", { description: "No ID found for this import record." });
      return;
    }

    const validationErrors = validateImportEditInput(form);
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      await updateImport(record, form);
      toast.success("Import record updated", {
        description: "CBAM liability has been recalculated.",
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Update failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Import Record</DialogTitle>
          <DialogDescription>
            Update import details for {record?.materialType ?? "this record"}. Liability will be
            recalculated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-material">Material Type</Label>
            <Input id="edit-material" value={record?.materialType ?? ""} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-mass">Mass (Tonnes)</Label>
            <Input
              id="edit-mass"
              type="number"
              min="0"
              step="0.01"
              value={form.mass}
              onChange={(e) => updateField("mass", e.target.value)}
              aria-invalid={!!errors.mass}
              disabled={isSaving}
              className={cn(errors.mass && "border-destructive/50 focus-visible:ring-destructive/50")}
            />
            {errors.mass && <p className="text-xs text-destructive">{errors.mass}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-origin">Origin Country</Label>
            <Select
              value={form.originCountry || undefined}
              onValueChange={(value) => updateField("originCountry", value)}
              disabled={isSaving}
            >
              <SelectTrigger id="edit-origin" aria-invalid={!!errors.originCountry}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {ORIGIN_COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.originCountry && (
              <p className="text-xs text-destructive">{errors.originCountry}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-emission-factor">Emission Factor Eᵢ (tCO₂e/t)</Label>
            <Input
              id="edit-emission-factor"
              type="number"
              min="0"
              step="0.01"
              value={form.emissionFactor}
              onChange={(e) => updateField("emissionFactor", e.target.value)}
              aria-invalid={!!errors.emissionFactor}
              disabled={isSaving}
              className={cn(
                errors.emissionFactor && "border-destructive/50 focus-visible:ring-destructive/50"
              )}
            />
            {errors.emissionFactor && (
              <p className="text-xs text-destructive">{errors.emissionFactor}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
