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
import { publicPageMetadata } from '@/lib/seo/metadata';
import { SEO_ORIGIN } from '@/lib/seo/site';
import { NO_PROFILE_SRC } from '@/lib/profileImage';

type PageProps = { params: Promise<{ nickname: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const [access, refresh] = await Promise.all([getAccessToken(), getRefreshToken()]);
  // 회원의 차단 접근을 공개 프로필 metadata로 우회하지 않는다. 허용된 화면의 제목은 클라이언트가 설정한다.
  if (access || refresh) return { title: 'Ultary', robots: { index: false, follow: false } };
  const { nickname: encodedNickname } = await params;
  try {
    const nickname = decodeURIComponent(encodedNickname);
    const data = await loadPublicUltary(nickname);
    const title = ultaryTitle(
      data.profile.nickname,
      data.pets.map((pet) => pet.handle),
    );
    const image =
      data.pets.find((pet) => pet.imageUrl && pet.imageUrl !== NO_PROFILE_SRC)?.imageUrl ??
      data.feeds?.find((feed) => feed.imageUrl)?.imageUrl;
    return publicPageMetadata({
      origin: SEO_ORIGIN,
      path: myUltaryPath(data.profile.nickname),
      title,
      description: data.profile.bio || data.profile.nickname + '님의 반려동물과 일상을 만나보세요.',
      image,
    });
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
  const { data: guestData, error: loadError } = await loadPublicUltary(nickname)
    .then((data) => ({ data, error: undefined }))
    .catch((error: unknown) => {
      if (isUnavailablePageError(error)) notFound();
      return { data: null, error };
    });
  if (guestData)
    return <MyUltaryClient key={`${nickname}:guest`} nickname={nickname} guestData={guestData} />;
  return (
    <div style={{ width: '100%', maxWidth: 430, marginInline: 'auto' }}>
      <LogoHeader
        actions={
          <Link href="/login" className={reloadStyles.reload} style={{ marginTop: 0 }}>
            로그인
          </Link>
        }
      />
      <PageLoadError error={loadError} />
    </div>
  );
}
