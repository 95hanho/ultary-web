import { notFound } from 'next/navigation';
import ReportDetailClient from '../../../ReportDetailClient';

export const metadata = {
  title: '신고 · 울타리 관리',
};

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const id = Number(reportId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <ReportDetailClient reportId={id} />;
}
