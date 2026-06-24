"use client";

import { ImportsProvider } from "@/context/imports-context";
import { UserSettingsProvider } from "@/context/user-settings-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Toaster } from "@/components/ui/sonner";

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserSettingsProvider>
      <ImportsProvider>
        <DashboardShell>{children}</DashboardShell>
        <Toaster richColors closeButton position="top-right" />
      </ImportsProvider>
    </UserSettingsProvider>
  );
}
