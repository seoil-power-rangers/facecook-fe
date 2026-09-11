import { ReportScreen } from "@ui/신고/ReportScreen";

export default async function ProfileReportPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return <ReportScreen userId={userId} />;
}
