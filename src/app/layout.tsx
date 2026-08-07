import { Providers } from '@/providers/Providers';
import '@/styles';
import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Ultary',
  description: 'Ultary web',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="relative flex min-h-full flex-col">
        <Providers>{children}</Providers>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 overflow-hidden">
          <div className="relative left-1/2 w-[120%] -translate-x-1/2">
            <Image
              src="/images/ultary_bg_bt.png"
              alt=""
              width={1054}
              height={702}
              priority
              className="h-auto w-full"
              style={{ height: 'auto' }}
            />
          </div>
        </div>
      </body>
    </html>
  );
}
