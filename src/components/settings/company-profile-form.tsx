"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { EU_MEMBER_STATES } from "@/lib/eu-countries";
import type { OrganizationSettings } from "@/lib/organization-store";
import { companyProfileSchema, type CompanyProfileValues } from "@/lib/settings-schema";
import { cn } from "@/lib/utils";

interface CompanyProfileFormProps {
  organization: OrganizationSettings | null;
  isLoading: boolean;
  canEdit: boolean;
  onSaved: (organization: OrganizationSettings) => void;
}

export function CompanyProfileForm({
  organization,
  isLoading,
  canEdit,
  onSaved,
}: CompanyProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CompanyProfileValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyLegalName: "",
      eoriNumber: "",
      vatTaxId: "",
      registeredCountry: "",
      contactEmail: "",
    },
  });

  useEffect(() => {
    if (organization) {
      form.reset({
        companyLegalName: organization.companyLegalName,
        eoriNumber: organization.eoriNumber,
        vatTaxId: organization.vatTaxId,
        registeredCountry: organization.registeredCountry,
        contactEmail: organization.contactEmail,
      });
    }
  }, [organization, form]);

  async function onSubmit(values: CompanyProfileValues) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save company profile.");

      onSaved(data.organization);
      toast.success("Company profile saved", {
        description: "Your organization details have been updated.",
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
    <Card className="border-border/80 bg-charcoal/40">
      <CardHeader>
        <CardTitle className="normal-case tracking-normal text-foreground">
          Company Profile
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Legal identifiers used on CBAM declarations and customs filings.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Company name"
              htmlFor="companyLegalName"
              error={errors.companyLegalName?.message}
              className="sm:col-span-2"
            >
              <Input
                id="companyLegalName"
                {...form.register("companyLegalName")}
                disabled={disabled}
                className={cn(errors.companyLegalName && "border-destructive/50")}
              />
            </Field>

            <Field
              label="EORI number"
              htmlFor="eoriNumber"
              error={errors.eoriNumber?.message}
              hint="17 alphanumeric characters (EU EORI format)."
            >
              <Input
                id="eoriNumber"
                {...form.register("eoriNumber")}
                disabled={disabled}
                maxLength={17}
                className={cn("font-mono uppercase", errors.eoriNumber && "border-destructive/50")}
              />
            </Field>

            <Field label="VAT number" htmlFor="vatTaxId" error={errors.vatTaxId?.message}>
              <Input
                id="vatTaxId"
                {...form.register("vatTaxId")}
                disabled={disabled}
                className={cn(errors.vatTaxId && "border-destructive/50")}
              />
            </Field>

            <Field
              label="Registered country"
              htmlFor="registeredCountry"
              error={errors.registeredCountry?.message}
            >
              <Select
                value={form.watch("registeredCountry")}
                onValueChange={(value) =>
                  form.setValue("registeredCountry", value, { shouldValidate: true })
                }
                disabled={disabled}
              >
                <SelectTrigger id="registeredCountry">
                  <SelectValue placeholder="Select EU member state" />
                </SelectTrigger>
                <SelectContent>
                  {EU_MEMBER_STATES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Primary contact email"
              htmlFor="contactEmail"
              error={errors.contactEmail?.message}
            >
              <Input
                id="contactEmail"
                type="email"
                {...form.register("contactEmail")}
                disabled={disabled}
                className={cn(errors.contactEmail && "border-destructive/50")}
              />
            </Field>
          </div>

          {!canEdit && (
            <p className="text-xs text-muted-foreground">
              Only organization owners can edit company profile settings.
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
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
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
