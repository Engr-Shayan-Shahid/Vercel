"use client";

import { UserSettingsProvider } from "@/context/user-settings-context";
import { ExporterShell } from "@/components/layout/exporter-shell";
import { Toaster } from "@/components/ui/sonner";

export function ExporterProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserSettingsProvider>
      <ExporterShell>{children}</ExporterShell>
      <Toaster richColors closeButton position="top-right" />
    </UserSettingsProvider>
  );
}
