import type { Metadata } from 'next';
import AdminMenuClient from './AdminMenuClient';

export const metadata: Metadata = {
  title: '울타리 관리',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminMenuClient />;
}
