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
  profileSettingsSchema,
  type ProfileSettingsValues,
} from "@/lib/settings-schema";
import { cn } from "@/lib/utils";

export function ProfileSettingsForm() {
  const { settings, isLoading, isSaving, saveProfile } = useUserSettings();

  const form = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      complianceOfficerName: settings.complianceOfficerName,
      email: settings.email,
    },
  });

  useEffect(() => {
    if (!isLoading) {
      form.reset({
        complianceOfficerName: settings.complianceOfficerName,
        email: settings.email,
      });
    }
  }, [settings.complianceOfficerName, settings.email, isLoading, form]);

  async function onSubmit(values: ProfileSettingsValues) {
    try {
      await saveProfile(values);
      toast.success("Profile saved", {
        description: "Your compliance officer details have been updated.",
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
        <CardTitle className="normal-case tracking-normal text-foreground">Profile</CardTitle>
        <p className="text-sm text-muted-foreground">
          Update your compliance officer identity. Your name appears in the dashboard header.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Compliance Officer Name"
              htmlFor="complianceOfficerName"
              error={errors.complianceOfficerName?.message}
            >
              <Input
                id="complianceOfficerName"
                {...form.register("complianceOfficerName")}
                aria-invalid={!!errors.complianceOfficerName}
                disabled={isLoading || isSaving}
                className={cn(errors.complianceOfficerName && "border-destructive/50")}
              />
            </Field>

            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                aria-invalid={!!errors.email}
                disabled={isLoading || isSaving}
                className={cn(errors.email && "border-destructive/50")}
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
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
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
