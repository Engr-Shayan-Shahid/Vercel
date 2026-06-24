"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { SettingsSaveButton } from "@/components/settings/settings-save-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUserSettings } from "@/context/user-settings-context";
import {
  notificationSettingsSchema,
  type NotificationSettingsValues,
} from "@/lib/settings-schema";

const NOTIFICATION_OPTIONS = [
  {
    key: "newEuRegulationAlerts" as const,
    label: "New EU Regulation Alerts",
    description: "Receive alerts when EU CBAM implementing rules are updated.",
  },
  {
    key: "quarterlyReportReminders" as const,
    label: "Quarterly Report Reminders",
    description: "Reminders before quarterly emissions report deadlines.",
  },
  {
    key: "securityAlerts" as const,
    label: "Security Alerts",
    description: "Important account and data security notifications.",
  },
];

export function NotificationSettingsForm() {
  const { settings, isLoading, isSaving, saveNotifications } = useUserSettings();

  const form = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      newEuRegulationAlerts: settings.newEuRegulationAlerts,
      quarterlyReportReminders: settings.quarterlyReportReminders,
      securityAlerts: settings.securityAlerts,
    },
  });

  useEffect(() => {
    if (!isLoading) {
      form.reset({
        newEuRegulationAlerts: settings.newEuRegulationAlerts,
        quarterlyReportReminders: settings.quarterlyReportReminders,
        securityAlerts: settings.securityAlerts,
      });
    }
  }, [
    settings.newEuRegulationAlerts,
    settings.quarterlyReportReminders,
    settings.securityAlerts,
    isLoading,
    form,
  ]);

  async function onSubmit(values: NotificationSettingsValues) {
    try {
      await saveNotifications(values);
      toast.success("Notifications saved", {
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      toast.error("Save failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  return (
    <Card className="border-border/80 bg-charcoal/40">
      <CardHeader>
        <CardTitle className="normal-case tracking-normal text-foreground">
          Notifications
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Control which CBAM compliance alerts you receive.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="divide-y divide-border/60 rounded-lg border border-border/60">
            {NOTIFICATION_OPTIONS.map(({ key, label, description }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4 px-4 py-4 first:rounded-t-lg last:rounded-b-lg"
              >
                <div className="space-y-1">
                  <Label htmlFor={key} className="text-sm font-medium text-foreground">
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Controller
                  control={form.control}
                  name={key}
                  render={({ field }) => (
                    <Switch
                      id={key}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading || isSaving}
                      aria-label={label}
                    />
                  )}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t border-border/60 pt-5">
            <SettingsSaveButton isSaving={isSaving} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
