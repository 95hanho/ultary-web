import type { Metadata } from 'next';
import Link from 'next/link';
import MyUltaryClient from '../MyUltaryClient';
import { getAccessToken, getRefreshToken } from '@/lib/auth/cookies';
import { loadPublicUltary } from '@/lib/myultary/publicProfile';
import { ultaryTitle } from '@/lib/myultary/title';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { LogoHeader } from '@/components/common/LogoHeader';
import { PageLoadError } from '@/components/common/PageLoadError';
import reloadStyles from '@/components/common/PageLoadError.module.scss';
import { notFound } from 'next/navigation';
import { isUnavailablePageError } from '@/lib/api/page-load-error';

type PageProps = { params: Promise<{ nickname: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { nickname: encodedNickname } = await params;
  try {
    const nickname = decodeURIComponent(encodedNickname);
    const data = await loadPublicUltary(nickname);
    const title = ultaryTitle(data.profile.nickname, data.pets.map(pet => pet.handle));
    return { title, description: data.profile.bio || `${data.profile.nickname}님의 반려동물과 일상을 만나보세요.`,
      alternates: { canonical: myUltaryPath(data.profile.nickname) },
      openGraph: { title, type: 'profile', url: myUltaryPath(data.profile.nickname) },
      robots: { index: true, follow: true } };
  } catch {
    return { title: 'Ultary', robots: { index: false, follow: false } };
  }
}

export default async function MyUltaryNicknamePage({ params }: PageProps) {
  const { nickname: encodedNickname } = await params;
  let nickname: string;
  try {
    nickname = decodeURIComponent(encodedNickname);
  } catch {
    notFound();
  }
  const [access, refresh] = await Promise.all([getAccessToken(), getRefreshToken()]);
  if (access || refresh) return <MyUltaryClient key={`${nickname}:member`} nickname={nickname} />;
  const guestData = await loadPublicUltary(nickname).catch((error: unknown) => {
    if (isUnavailablePageError(error)) notFound();
    return null;
  });
  if (guestData) return <MyUltaryClient key={`${nickname}:guest`} nickname={nickname} guestData={guestData} />;
  return <div style={{ width: '100%', maxWidth: 430, marginInline: 'auto' }}>
      <LogoHeader actions={<Link href="/login" className={reloadStyles.reload} style={{ marginTop: 0 }}>로그인</Link>} />
      <PageLoadError />
    </div>;
}
