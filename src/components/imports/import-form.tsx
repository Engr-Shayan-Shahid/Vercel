"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, PlusCircle } from "lucide-react";

import { ComplianceNotices } from "@/components/imports/compliance-notices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  EMPTY_IMPORT_INPUT,
  MATERIAL_TYPES,
  ORIGIN_COUNTRIES,
  type ImportFormErrors,
  type ImportRecordInput,
} from "@/types/import-record";
import { cn } from "@/lib/utils";

export function ImportForm() {
  const { addImport } = useImports();
  const [form, setForm] = useState<ImportRecordInput>(EMPTY_IMPORT_INPUT);
  const [errors, setErrors] = useState<ImportFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const foreignPriceValue = Number(form.foreignPrice) || 0;
  const requiresProof = foreignPriceValue > 0;

  function updateField<K extends keyof ImportRecordInput>(key: K, value: ImportRecordInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof ImportFormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof ImportFormErrors];
        return next;
      });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const result = await addImport(form);

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
          toast.error("Please complete all required fields.");
        } else {
          toast.error("Calculation error: Please check input data.", {
            description: result.error,
          });
        }
        return;
      }

      setForm(EMPTY_IMPORT_INPUT);
      setErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Import record calculated and added.", {
        description: "CBAM liability has been computed via the calculation engine.",
      });
    } catch {
      toast.error("Calculation error: Please check input data.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-border/80 bg-charcoal/40">
      <CardHeader>
        <CardTitle className="normal-case tracking-normal text-foreground">
          New Import Record
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Submit import data for CBAM liability calculation. All fields are required.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <ComplianceNotices />

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <FieldGroup label="Material Type" error={errors.materialType} htmlFor="materialType">
              <Select
                value={form.materialType || undefined}
                onValueChange={(value) =>
                  updateField("materialType", value as ImportRecordInput["materialType"])
                }
                disabled={isLoading}
              >
                <SelectTrigger id="materialType" aria-invalid={!!errors.materialType}>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>

            <FieldGroup label="Origin Country" error={errors.originCountry} htmlFor="originCountry">
              <Select
                value={form.originCountry || undefined}
                onValueChange={(value) => updateField("originCountry", value)}
                disabled={isLoading}
              >
                <SelectTrigger id="originCountry" aria-invalid={!!errors.originCountry}>
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
            </FieldGroup>

            <FieldGroup label="Import Date" error={errors.importDate} htmlFor="importDate">
              <Input
                id="importDate"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={form.importDate}
                onChange={(e) => updateField("importDate", e.target.value)}
                aria-invalid={!!errors.importDate}
                disabled={isLoading}
                className={cn(
                  errors.importDate && "border-destructive/50 focus-visible:ring-destructive/50"
                )}
              />
            </FieldGroup>

            <FieldGroup label="Mass (Tonnes)" error={errors.mass} htmlFor="mass">
              <Input
                id="mass"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 320"
                value={form.mass}
                onChange={(e) => updateField("mass", e.target.value)}
                aria-invalid={!!errors.mass}
                disabled={isLoading}
                className={cn(errors.mass && "border-destructive/50 focus-visible:ring-destructive/50")}
              />
            </FieldGroup>

            <FieldGroup
              label="Emission Factor Eᵢ (tCO₂e/t)"
              error={errors.emissionFactor}
              htmlFor="emissionFactor"
            >
              <Input
                id="emissionFactor"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 2.1 (use verified supplier data)"
                value={form.emissionFactor}
                onChange={(e) => updateField("emissionFactor", e.target.value)}
                aria-invalid={!!errors.emissionFactor}
                disabled={isLoading}
                className={cn(
                  errors.emissionFactor && "border-destructive/50 focus-visible:ring-destructive/50"
                )}
              />
            </FieldGroup>

            <FieldGroup
              label="Foreign Carbon Price P_foreign (€/tCO₂e)"
              error={errors.foreignPrice}
              htmlFor="foreignPrice"
            >
              <Input
                id="foreignPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0 if none paid abroad"
                value={form.foreignPrice}
                onChange={(e) => updateField("foreignPrice", e.target.value)}
                aria-invalid={!!errors.foreignPrice}
                disabled={isLoading}
                className={cn(
                  errors.foreignPrice && "border-destructive/50 focus-visible:ring-destructive/50"
                )}
              />
            </FieldGroup>

            <FieldGroup
              label="Proof of Payment"
              error={errors.proofOfPayment}
              htmlFor="proofOfPayment"
            >
              <div className="space-y-2">
                <Input
                  ref={fileInputRef}
                  id="proofOfPayment"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  disabled={isLoading || !requiresProof}
                  onChange={(e) =>
                    updateField("proofOfPayment", e.target.files?.[0] ?? null)
                  }
                  className={cn(
                    "cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary",
                    !requiresProof && "opacity-50",
                    errors.proofOfPayment && "border-destructive/50"
                  )}
                />
                <p className="text-[11px] text-muted-foreground">
                  {requiresProof
                    ? "Required when P_foreign > 0 — upload invoice or certificate of payment."
                    : "Only required if claiming a foreign carbon price deduction."}
                </p>
              </div>
            </FieldGroup>
          </div>

          <div className="flex justify-end border-t border-border/60 pt-5">
            <Button type="submit" disabled={isLoading} className="min-w-[160px]">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating…
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Calculate & Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FieldGroup({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
