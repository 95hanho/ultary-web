'use client';
import { useRef, useState } from 'react';
import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { FullScreenLoading } from '@/components/common/FullScreenLoading';
import { useModalStore } from '@/stores/modal.store';
import type { AdminUser } from './adminManagementData';
import { nicknameTag } from '@/lib/nickname-tag';
import { notifyAdminMutationError } from './adminMutationError';
import styles from './admin.module.scss';

export default function UserStatusControl({
  user,
  onChange,
}: {
  user: AdminUser;
  onChange: () => void;
}) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  if (user.status === 'WITHDRAWN') return <span className={styles.tableMuted}>탈퇴 회원</span>;
  const suspend = user.status === 'ACTIVE';
  const label = suspend ? '정지' : '정지 해제';
  const submit = async () => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      await bffPostJson(
        suspend ? bffEndpoints.admin.userSuspend : bffEndpoints.admin.userUnsuspend,
        { userNo: user.userNo, reason: reason.trim() },
      );
      setReason('');
      window.dispatchEvent(new Event('admin-status-changed'));
      onChange();
    } catch (error) {
      notifyAdminMutationError(error, '요청에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return (
    <div className={styles.userStatusControl}>
      <FullScreenLoading open={saving} label="회원 상태를 변경하고 있습니다." />
      <input
        aria-label={`${nicknameTag(user.nickname)} ${label} 사유`}
        placeholder={suspend ? '정지 사유를 입력해주세요.' : '정지 해제 사유를 입력해주세요.'}
        value={reason}
        maxLength={500}
        onChange={(e) => setReason(e.target.value)}
        disabled={saving}
      />
      <button
        type="button"
        className={styles.pageButton}
        disabled={saving || !reason.trim()}
        onClick={() => {
          useModalStore
            .getState()
            .open({
              variant: 'confirm',
              title: `회원 ${label}`,
              content: `${nicknameTag(user.nickname)} 회원을 ${label}할까요?\n사유: ${reason.trim()}`,
              okButton: { label, onClick: () => void submit() },
            });
        }}
      >
        {label}
      </button>
    </div>
  );
}
