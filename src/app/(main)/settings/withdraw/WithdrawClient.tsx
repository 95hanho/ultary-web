'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { bffDelete } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { useModalStore } from '@/stores/modal.store';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import styles from './withdraw.module.scss';

const NOTICES = [
  {
    title: '계정 정보가 삭제됩니다',
    body: '탈퇴가 완료되면 프로필·연락처·로그인 정보가 삭제되며, 동일 계정으로 복구할 수 없습니다.',
  },
  {
    title: '작성한 콘텐츠를 볼 수 없습니다',
    body: '마이울타리·게시글·스토리·댓글 등 내가 남긴 기록은 삭제되거나 더 이상 확인할 수 없습니다.',
  },
  {
    title: '반려동물 정보도 함께 삭제됩니다',
    body: '등록한 반려동물 프로필과 사진, 관련 기록이 모두 삭제됩니다.',
  },
  {
    title: '관계·알림 설정이 해제됩니다',
    body: '이웃·주민 관계와 알림·공개 범위 설정이 모두 초기화됩니다.',
  },
  {
    title: '탈퇴 후 즉시 로그아웃됩니다',
    body: '탈퇴가 처리되면 바로 로그아웃되며, 서비스 이용을 원하시면 새로 가입해 주셔야 합니다.',
  },
] as const;

/** 설정 > 회원탈퇴 */
export default function WithdrawClient() {
  const router = useRouter();
  const openModal = useModalStore((s) => s.open);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirmNotices() {
    setError(null);
    openModal({
      variant: 'confirm',
      title: '정말 탈퇴하시겠어요?',
      content: '탈퇴하면 계정과 활동 기록을 되돌릴 수 없습니다.',
      okButton: {
        label: '탈퇴하기',
        tone: 'danger',
        onClick: () => {
          startTransition(async () => {
            try {
              await bffDelete(bffEndpoints.auth.withdraw);
              router.replace('/login');
              router.refresh();
            } catch (err) {
              console.error('[withdraw]', err);
              setError('회원탈퇴 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.');
            }
          });
        },
      },
      cancelButton: { label: '취소', tone: 'success' },
    });
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="회원탈퇴" backHref="/settings" />

      <main className={styles.main}>
        <section className={styles.noticeBox} aria-label="회원탈퇴 주의사항">
          <h2 className={styles.noticeHeading}>탈퇴 전 꼭 확인해 주세요</h2>
          <p className={styles.noticeLead}>
            아래 내용을 모두 확인한 뒤에만 탈퇴를 진행해 주세요.
          </p>
          <ul className={styles.noticeList}>
            {NOTICES.map((item) => (
              <li key={item.title} className={styles.noticeItem}>
                <p className={styles.noticeTitle}>{item.title}</p>
                <p className={styles.noticeBody}>{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <button
          type="button"
          className={styles.confirmBtn}
          disabled={pending}
          onClick={handleConfirmNotices}
        >
          {pending ? '처리 중…' : '모두 확인하였습니다.'}
        </button>
        {error ? <p className={styles.error}>{error}</p> : null}
      </main>

      <FooterMenu />
    </div>
  );
}
