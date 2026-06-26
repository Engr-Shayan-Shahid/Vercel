"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Shield } from "lucide-react";
import { toast } from "sonner";

import { SettingsSaveButton } from "@/components/settings/settings-save-button";
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
import { Switch } from "@/components/ui/switch";
import { DEFAULT_ETS_PRICE } from "@/lib/cbam-constants";
import { getEtsPriceSync } from "@/lib/ets-price";
import type { OrganizationSettings } from "@/lib/organization-store";
import {
  complianceSettingsSchema,
  getCurrentQuarter,
  type ComplianceSettingsValues,
} from "@/lib/settings-schema";
import { cn } from "@/lib/utils";

interface ComplianceSettingsFormProps {
  organization: OrganizationSettings | null;
  isLoading: boolean;
  canEdit: boolean;
  onSaved: (organization: OrganizationSettings) => void;
}

export function ComplianceSettingsForm({
  organization,
  isLoading,
  canEdit,
  onSaved,
}: ComplianceSettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const envEtsPrice = getEtsPriceSync();

  const form = useForm<ComplianceSettingsValues>({
    resolver: zodResolver(complianceSettingsSchema),
    defaultValues: {
      etsPriceOverride: "",
      defaultCalculationMethod: "actual",
      reportingPeriodMode: "auto",
      reportingYear: getCurrentQuarter().year,
      reportingQuarter: getCurrentQuarter().quarter,
    },
  });

  const reportingMode = form.watch("reportingPeriodMode");
  const calculationMethod = form.watch("defaultCalculationMethod");

  useEffect(() => {
    if (organization) {
      form.reset({
        etsPriceOverride:
          organization.etsPriceOverride != null
            ? String(organization.etsPriceOverride)
            : "",
        defaultCalculationMethod: organization.defaultCalculationMethod,
        reportingPeriodMode: organization.reportingPeriodMode,
        reportingYear: organization.reportingYear ?? getCurrentQuarter().year,
        reportingQuarter:
          organization.reportingQuarter ?? getCurrentQuarter().quarter,
      });
    }
  }, [organization, form]);

  async function onSubmit(values: ComplianceSettingsValues) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save compliance settings.");

      onSaved(data.organization);
      toast.success("Compliance settings saved", {
        description: "Calculation preferences have been updated.",
      });
    } catch (error) {
      toast.error("Save failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const errors = form.formState.errors;
  const disabled = isLoading || isSaving || !canEdit;

  return (
    <div className="space-y-6">
      <Card className="border-border/80 bg-charcoal/40">
        <CardHeader>
          <CardTitle className="normal-case tracking-normal text-foreground">
            Compliance Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure how CBAM liability is calculated for your organization.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* ETS Price Override */}
            <section className="space-y-3">
              <Label htmlFor="etsPriceOverride">ETS price override (€/tCO₂e)</Label>
              <Input
                id="etsPriceOverride"
                type="number"
                step="0.01"
                min="0"
                placeholder={`Env default: €${envEtsPrice}`}
                {...form.register("etsPriceOverride")}
                disabled={disabled}
                className={cn("max-w-xs", errors.etsPriceOverride && "border-destructive/50")}
              />
              <p className="text-[11px] text-muted-foreground">
                Leave blank to use the platform default (€{envEtsPrice} from{" "}
                <code className="text-[10px]">CBAM_ETS_PRICE</code> or €{DEFAULT_ETS_PRICE}).
                Override applies to this organization&apos;s calculations only.
              </p>
              {errors.etsPriceOverride && (
                <p className="text-xs text-destructive">{errors.etsPriceOverride.message}</p>
              )}
            </section>

            {/* Calculation method toggle */}
            <section className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Default calculation method
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {calculationMethod === "actual"
                      ? "Using actual verified emissions from suppliers."
                      : "Falling back to EU default values when supplier data is missing."}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <span className={calculationMethod === "actual" ? "text-foreground" : ""}>
                    Actual emissions
                  </span>
                  <Switch
                    checked={calculationMethod === "default_fallback"}
                    onCheckedChange={(checked) =>
                      form.setValue(
                        "defaultCalculationMethod",
                        checked ? "default_fallback" : "actual",
                        { shouldValidate: true }
                      )
                    }
                    disabled={disabled}
                    aria-label="Toggle default calculation method"
                  />
                  <span
                    className={
                      calculationMethod === "default_fallback" ? "text-foreground" : ""
                    }
                  >
                    Default values
                  </span>
                </div>
              </div>
            </section>

            {/* Reporting period */}
            <section className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">Reporting period</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Choose how quarterly reporting periods are determined.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    form.setValue("reportingPeriodMode", "auto", { shouldValidate: true })
                  }
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    reportingMode === "auto"
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60 hover:border-border"
                  )}
                >
                  <p className="text-sm font-medium text-foreground">Auto-detect from imports</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Period is inferred from import dates in your logs.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    form.setValue("reportingPeriodMode", "manual", { shouldValidate: true })
                  }
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    reportingMode === "manual"
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60 hover:border-border"
                  )}
                >
                  <p className="text-sm font-medium text-foreground">Manual select</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lock reports to a specific quarter and year.
                  </p>
                </button>
              </div>

              {reportingMode === "manual" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reportingYear">Year</Label>
                    <Input
                      id="reportingYear"
                      type="number"
                      value={form.watch("reportingYear") ?? ""}
                      onChange={(e) =>
                        form.setValue(
                          "reportingYear",
                          e.target.value ? Number(e.target.value) : undefined,
                          { shouldValidate: true }
                        )
                      }
                      disabled={disabled}
                    />
                    {errors.reportingYear && (
                      <p className="text-xs text-destructive">{errors.reportingYear.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportingQuarter">Quarter</Label>
                    <Select
                      value={form.watch("reportingQuarter")}
                      onValueChange={(value) =>
                        form.setValue("reportingQuarter", value as "Q1" | "Q2" | "Q3" | "Q4", {
                          shouldValidate: true,
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger id="reportingQuarter">
                        <SelectValue placeholder="Select quarter" />
                      </SelectTrigger>
                      <SelectContent>
                        {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => (
                          <SelectItem key={q} value={q}>
                            {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.reportingQuarter && (
                      <p className="text-xs text-destructive">
                        {errors.reportingQuarter.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {!canEdit && (
              <p className="text-xs text-muted-foreground">
                Only organization owners can edit compliance settings.
              </p>
            )}

            {canEdit && (
              <div className="flex justify-end border-t border-border/60 pt-5">
                <SettingsSaveButton isSaving={isSaving} />
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Data retention — info only */}
      <Card className="border-border/60 bg-muted/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-medium normal-case tracking-normal text-foreground">
              Data retention
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3 rounded-lg border border-border/40 bg-charcoal/30 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="space-y-2">
              <p>
                Import logs, emissions reports, and audit records are retained for the duration
                of your subscription plus 7 years, in line with EU customs record-keeping
                requirements.
              </p>
              <p>
                Under GDPR, you may request export or deletion of personal data by contacting{" "}
                <span className="text-foreground">privacy@cbamvault.com</span>. Deletion of
                compliance records may be restricted where retention is legally required.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
