'use client';
import { useRef, useState } from 'react';
import { FullScreenLoading } from '@/components/common/FullScreenLoading';
import { bffPostJson } from '@/lib/api/bffFetch';
import { useModalStore } from '@/stores/modal.store';
import type { BffEnvelope } from '@/types/api';
import type { ReportItem } from './adminData';
import { ACTION_URL, actionOptions, mergeReport, actionError } from './reportStatusActions';
import styles from './admin.module.scss';
export default function ReportStatusControl({
  item,
  onChange,
}: {
  item: ReportItem;
  onChange: (item: ReportItem) => void;
}) {
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const change = async (next: string) => {
    if (busy.current || next === item.status || !ACTION_URL[next]) return;
    busy.current = true;
    setSaving(true);
    try {
      const response = await bffPostJson<BffEnvelope<unknown>>(ACTION_URL[next], {
        reportId: item.reportId,
      });
      window.dispatchEvent(new Event('admin-status-changed'));
      onChange(mergeReport(item, response.data, next));
    } catch (error) {
      useModalStore
        .getState()
        .open({
          variant: 'alert',
          title: '알림창',
          content: actionError(error),
          showCloseButton: true,
        });
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return (
    <>
    <FullScreenLoading open={saving} label="신고 상태를 변경하고 있습니다. 잠시만 기다려 주세요." />
    <select
      className={styles.statusSelect}
      aria-label="신고 처리"
      value={item.status}
      disabled={saving}
      onChange={(event) => void change(event.target.value)}
    >
      {actionOptions(item, item.status).map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    </>
  );
}
