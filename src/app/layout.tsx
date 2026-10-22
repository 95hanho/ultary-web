import { APP_URL } from '@/lib/env.server';
import { Providers } from '@/providers/Providers';
import '@/styles';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ultary',
  metadataBase: new URL(APP_URL),
  description: '반려동물과 함께하는 일상을 나누는 공간, 울타리.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="relative flex min-h-full flex-col">
        <div className="relative z-[1] flex min-h-full flex-1 flex-col">
          <Providers>{children}</Providers>
        </div>

        {/* ≤430: 기존처럼 뷰포트 기준 스케일 / >430: 430 기준 타일 고정 후 좌우 반복 */}
        <div className="ultary-bg" aria-hidden />
      </body>
    </html>
  );
}
