import { Suspense } from 'react';
import MyPageClient from './MyPageClient';

export default function MyPagePage() {
  return (
    <Suspense fallback={null}>
      <MyPageClient />
    </Suspense>
  );
}
