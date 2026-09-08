import { getUltaryAccount } from '@/lib/mock/ultary-accounts';
import { notFound } from 'next/navigation';
import MyUltaryClient from '../MyUltaryClient';

type PageProps = {
  params: Promise<{ nickname: string }>;
};

export default async function MyUltaryNicknamePage({ params }: PageProps) {
  const { nickname } = await params;
  const account = getUltaryAccount(nickname);
  if (!account) notFound();

  return <MyUltaryClient nickname={nickname} />;
}
