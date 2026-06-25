"use client";

import { useState } from "react";

import { ExporterSidebar } from "@/components/layout/exporter-sidebar";
import { ExporterHeader } from "@/components/layout/exporter-header";

interface ExporterShellProps {
  children: React.ReactNode;
}

export function ExporterShell({ children }: ExporterShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-deep-black">
      <ExporterSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <ExporterHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
