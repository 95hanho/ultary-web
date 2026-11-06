'use client';

import { useDevAdminSession } from '@/components/dev/DevTestProvider';

/** 관리자 레이아웃의 세션 여부를 DevTestDock에 전달한다. */
export default function AdminDevSessionBridge({ authed }: { authed: boolean }) {
  useDevAdminSession(authed);
  return null;
}
