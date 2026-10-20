import WriteComposeClient from './WriteComposeClient';
import { notFound } from 'next/navigation';

export default async function WriteComposePage({ searchParams }: { searchParams: Promise<{ editFeedId?: string | string[] }> }) {
  const { editFeedId } = await searchParams;
  if (editFeedId !== undefined && (typeof editFeedId !== 'string' || !/^\d+$/.test(editFeedId) || !Number.isSafeInteger(Number(editFeedId)) || Number(editFeedId) <= 0)) notFound();
  return <WriteComposeClient editFeedId={editFeedId} />;
}
