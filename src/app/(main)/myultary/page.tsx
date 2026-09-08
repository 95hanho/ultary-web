import { MY_NICKNAME } from '@/lib/mock/ultary-accounts';
import { redirect } from 'next/navigation';

/** /myultary → 내 울타리로 이동 */
export default function MyUltaryIndexPage() {
  redirect(`/myultary/${MY_NICKNAME}`);
}
