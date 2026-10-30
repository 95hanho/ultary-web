import { notFound } from 'next/navigation';
import UserDetailClient from '../../../UserDetailClient';
export default async function AdminUserPage({ params }: { params: Promise<{ userNo: string }> }) {
  const { userNo } = await params;
  const id = Number(userNo);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  return <UserDetailClient userNo={id} />;
}
