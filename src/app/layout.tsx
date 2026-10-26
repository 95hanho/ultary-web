import { APP_URL } from '@/lib/env.server';
import { Providers } from '@/providers/Providers';
import '@/styles';
import type { Metadata } from 'next';
import { NO_INDEX, SITE_DESCRIPTION } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'Ultary',
  robots: NO_INDEX,
  metadataBase: new URL(APP_URL),
  description: SITE_DESCRIPTION,
  icons: {
    icon: [{ url: '/images/favicon.png', type: 'image/png' }],
    shortcut: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
  openGraph: {
    title: 'Ultary',
    description: SITE_DESCRIPTION,
    siteName: 'Ultary',
    type: 'website',
    locale: 'ko_KR',
    images: [{ url: '/images/og-image.png', alt: 'Ultary' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ultary',
    description: SITE_DESCRIPTION,
    images: ['/images/og-image.png'],
  },
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
