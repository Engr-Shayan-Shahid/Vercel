import { ExporterProviders } from "@/components/providers/exporter-providers";

export default function ExporterLayout({ children }: { children: React.ReactNode }) {
  return <ExporterProviders>{children}</ExporterProviders>;
}
