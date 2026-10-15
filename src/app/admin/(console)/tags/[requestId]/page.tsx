import { notFound } from 'next/navigation';
import TagDetailClient from '../../../TagDetailClient';

export const metadata = {
  title: '태그요청 · 울타리 관리',
};

export default async function AdminTagDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const id = Number(requestId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <TagDetailClient requestId={id} />;
}
