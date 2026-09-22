'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './LoginRequiredModal.module.scss';

type Props = {
  open: boolean;
  onClose: () => void;
};

/** 공유 피드 게스트용 — 닫기 가능, 액션 시 다시 열림 (auth-access.md) */
export function LoginRequiredModal({ open, onClose }: Props) {
  const pathname = usePathname();
  if (!open) return null;

  const returnUrl = pathname || '/';
  const loginHref = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-labelledby="login-required-title">
      <button type="button" className={styles.dim} aria-label="닫기" onClick={onClose} />
      <div className={styles.panel}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
          ×
        </button>
        <h2 id="login-required-title" className={styles.title}>
          로그인이 필요합니다
        </h2>
        <p className={styles.body}>
          이 게시글을 보려면 로그인하세요. 좋아요·댓글·사진 넘기기 등 기능은 로그인 후 이용할 수
          있습니다.
        </p>
        <div className={styles.actions}>
          <Link href={loginHref} className={styles.primary}>
            로그인
          </Link>
          <button type="button" className={styles.secondary} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
