import type { Metadata } from 'next';
import AdminMenuClient from './AdminMenuClient';

export const metadata: Metadata = {
  title: 'Ultary',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminMenuClient />;
}
