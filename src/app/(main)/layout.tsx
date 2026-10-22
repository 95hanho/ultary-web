import { getAccessToken, getRefreshToken } from '@/lib/auth/cookies';
import { LiveSocket } from '@/components/ws/LiveSocket';

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggedIn = Boolean(await getAccessToken() || await getRefreshToken());
  return (
    <div className="relative z-10 flex min-h-full flex-1 flex-col">
      {loggedIn ? <LiveSocket /> : null}
      {children}
    </div>
  );
}
