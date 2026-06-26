import { ReportDetailPageContent } from "@/components/emissions/report-detail-page-content";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EmissionsReportDetailPage({ params }: Props) {
  const { id } = await params;
  return <ReportDetailPageContent reportId={id} />;
}
