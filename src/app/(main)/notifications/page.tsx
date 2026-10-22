import type { Metadata } from 'next';

export const metadata: Metadata = { title: '알림 - Ultary', robots: { index: false, follow: false } };

import NotificationsClient from './NotificationsClient';

export default function NotificationsPage() {
  return <NotificationsClient />;
}
