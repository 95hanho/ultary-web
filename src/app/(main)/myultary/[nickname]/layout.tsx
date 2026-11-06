import NicknameRedirectGate from './NicknameRedirectGate';

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ nickname: string }>;
};

/** 직전 닉네임(7일) URL이면 현재 닉네임 경로로 클라이언트 replace */
export default async function MyUltaryNicknameLayout({ children, params }: LayoutProps) {
  const { nickname: encoded } = await params;
  let nickname: string;
  try {
    nickname = decodeURIComponent(encoded);
  } catch {
    nickname = encoded;
  }
  return (
    <>
      <NicknameRedirectGate requestedNickname={nickname} />
      {children}
    </>
  );
}
