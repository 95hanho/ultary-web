'use client';
import { useRef, useState } from 'react';
import { FullScreenLoading } from '@/components/common/FullScreenLoading';
import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import type { BffEnvelope } from '@/types/api';
import type { AiLog } from './aiLogData';
import { notifyAdminMutationError } from './adminMutationError';
import styles from './admin.module.scss';
export default function AiReviewControl({
  item,
  onChange,
}: {
  item: AiLog;
  onChange: (item: AiLog) => void;
}) {
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const change = async (status: string) => {
    if (busy.current || status === item.adminReviewStatus) return;
    busy.current = true;
    setSaving(true);
    try {
      const response = await bffPostJson<BffEnvelope<AiLog>>(
        `${bffEndpoints.admin.aiLogs}/${item.aiRequestId}/review`,
        { status },
      );
      window.dispatchEvent(new Event('admin-status-changed'));
      if (response.data) onChange(response.data);
    } catch (error) {
      notifyAdminMutationError(error);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return (
    <>
    <FullScreenLoading open={saving} label="AI 오류 처리 상태를 변경하고 있습니다. 잠시만 기다려 주세요." />
    <select
      className={styles.statusSelect}
      aria-label="AI 오류 처리"
      value={item.adminReviewStatus ?? 'PENDING'}
      disabled={saving}
      onChange={(event) => void change(event.target.value)}
    >
      <option value="PENDING">확인 대기</option>
      <option value="KEPT">유지</option>
      <option value="DELETED">삭제조치</option>
    </select>
    </>
  );
}
