"use client";

import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { SettingsSaveButton } from "@/components/settings/settings-save-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserSettings } from "@/context/user-settings-context";
import {
  organizationSettingsSchema,
  type OrganizationSettingsValues,
} from "@/lib/settings-schema";
import { cn } from "@/lib/utils";

export function OrganizationSettingsForm() {
  const { settings, isLoading, isSaving, saveOrganization } = useUserSettings();

  const form = useForm<OrganizationSettingsValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      companyLegalName: settings.companyLegalName,
      eoriNumber: settings.eoriNumber,
      vatTaxId: settings.vatTaxId,
    },
  });

  useEffect(() => {
    if (!isLoading) {
      form.reset({
        companyLegalName: settings.companyLegalName,
        eoriNumber: settings.eoriNumber,
        vatTaxId: settings.vatTaxId,
      });
    }
  }, [
    settings.companyLegalName,
    settings.eoriNumber,
    settings.vatTaxId,
    isLoading,
    form,
  ]);

  async function onSubmit(values: OrganizationSettingsValues) {
    try {
      await saveOrganization(values);
      toast.success("Organization saved", {
        description: "CBAM organization details have been updated.",
      });
    } catch (error) {
      toast.error("Save failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  const errors = form.formState.errors;

  return (
    <Card className="border-border/80 bg-charcoal/40">
      <CardHeader>
        <CardTitle className="normal-case tracking-normal text-foreground">
          Organization
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Essential CBAM declarant identifiers for EU customs and emissions reporting.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-5">
            <Field
              label="Company Legal Name"
              htmlFor="companyLegalName"
              error={errors.companyLegalName?.message}
            >
              <Input
                id="companyLegalName"
                {...form.register("companyLegalName")}
                aria-invalid={!!errors.companyLegalName}
                disabled={isLoading || isSaving}
                className={cn(errors.companyLegalName && "border-destructive/50")}
              />
            </Field>

            <Field
              label="EORI Number"
              htmlFor="eoriNumber"
              error={errors.eoriNumber?.message}
              hint="Must be exactly 17 alphanumeric characters (EU EORI format)."
            >
              <Input
                id="eoriNumber"
                {...form.register("eoriNumber")}
                aria-invalid={!!errors.eoriNumber}
                disabled={isLoading || isSaving}
                maxLength={17}
                className={cn("font-mono uppercase", errors.eoriNumber && "border-destructive/50")}
              />
            </Field>

            <Field label="VAT/Tax ID" htmlFor="vatTaxId" error={errors.vatTaxId?.message}>
              <Input
                id="vatTaxId"
                {...form.register("vatTaxId")}
                aria-invalid={!!errors.vatTaxId}
                disabled={isLoading || isSaving}
                className={cn(errors.vatTaxId && "border-destructive/50")}
              />
            </Field>
          </div>

          <div className="flex justify-end border-t border-border/60 pt-5">
            <SettingsSaveButton isSaving={isSaving} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
