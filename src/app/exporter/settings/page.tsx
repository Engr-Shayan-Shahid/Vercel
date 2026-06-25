import type { Metadata } from "next";

import { SettingsPageContent } from "@/components/settings/settings-page-content";

export const metadata: Metadata = {
  title: "Settings — CBAMVault Exporter",
};

export default function ExporterSettingsPage() {
  return <SettingsPageContent />;
}
