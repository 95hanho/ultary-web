import { getUltaryAccount } from '@/lib/mock/ultary-accounts';
import { notFound } from 'next/navigation';
import TaggedClient from './TaggedClient';

type PageProps = {
  params: Promise<{ nickname: string }>;
};

export default async function MyUltaryTaggedPage({ params }: PageProps) {
  const { nickname } = await params;
  const account = getUltaryAccount(nickname);
  if (!account) notFound();

  return <TaggedClient nickname={nickname} />;
}
