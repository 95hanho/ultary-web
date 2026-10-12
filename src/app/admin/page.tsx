import type { Metadata } from 'next';
import AdminMainClient from './AdminMainClient';

export const metadata: Metadata = {
  title: '울타리 관리',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminMainClient />;
}
