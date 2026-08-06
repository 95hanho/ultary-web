import type { Metadata } from 'next';
import { Providers } from '@/providers/Providers';
import '@/styles/globals.css';
import '@/styles/custom.scss';

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
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
