import AdminDevSessionBridge from './AdminDevSessionBridge';
import AdminLoginClient from './AdminLoginClient';
import { hasAdminSession } from '@/lib/auth/admin-session';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authed = await hasAdminSession();

  return (
    <div className="relative z-10 flex min-h-full flex-1 flex-col">
      <AdminDevSessionBridge authed={authed} />
      {authed ? children : <AdminLoginClient />}
    </div>
  );
}
