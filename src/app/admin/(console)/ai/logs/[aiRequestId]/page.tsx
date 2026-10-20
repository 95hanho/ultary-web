import { notFound } from 'next/navigation';
import AiLogDetailClient from '../../../../AiLogDetailClient';

export const metadata = { title: 'AI 로그 상세 · 울타리 관리' };

export default async function AdminAiLogDetailPage({ params }: { params: Promise<{ aiRequestId: string }> }) {
  const { aiRequestId } = await params;
  const id = Number(aiRequestId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  return <AiLogDetailClient aiRequestId={id} />;
}
