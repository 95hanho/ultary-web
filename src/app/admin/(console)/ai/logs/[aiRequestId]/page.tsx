import { notFound } from 'next/navigation';
import AiLogDetailClient from '../../../../AiLogDetailClient';

export const metadata = { title: 'Ultary' };

export default async function AdminAiLogDetailPage({ params }: { params: Promise<{ aiRequestId: string }> }) {
  const { aiRequestId } = await params;
  const id = Number(aiRequestId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  return <AiLogDetailClient aiRequestId={id} />;
}
