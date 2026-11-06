'use client';

import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { useModalStore } from '@/stores/modal.store';
import type { BffEnvelope, MeResponse } from '@/types/api';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const PASSWORD_PATH = '/settings/mypage/password';
const MODAL_TITLE = '비밀번호 재설정이 필요합니다';

function isPasswordPath(pathname: string) {
  return pathname === PASSWORD_PATH || pathname.startsWith(`${PASSWORD_PATH}/`);
}

function closeForceModalQuietly() {
  const modal = useModalStore.getState();
  if (modal.isOpen && modal.title === MODAL_TITLE) {
    useModalStore.setState({
      isOpen: false,
      title: '',
      content: null,
      items: [],
      onCloseCallback: null,
    });
  }
}

/**
 * mustChangePassword=true 이면 비밀번호 변경 화면 외에서
 * 닫을 수 없는 안내 모달을 유지한다.
 */
export function MustChangePasswordGate() {
  const pathname = usePathname();
  const router = useRouter();
  const needRef = useRef(false);
  const allowingNav = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const openModal = () => {
      useModalStore.getState().open({
        variant: 'confirm',
        title: MODAL_TITLE,
        content: '관리자에 의해 비밀번호가 초기화되었습니다. 새 비밀번호로 변경해 주세요.',
        showCloseButton: false,
        closeOnDimClick: false,
        closeOnEscape: false,
        cancelButton: { hidden: true },
        okButton: {
          label: '비밀번호 변경하기',
          tone: 'primary',
          onClick: () => {
            allowingNav.current = true;
            router.push(PASSWORD_PATH);
          },
        },
        onClose: () => {
          queueMicrotask(() => {
            if (cancelled || allowingNav.current) return;
            if (needRef.current && !isPasswordPath(window.location.pathname)) {
              openModal();
            }
          });
        },
      });
    };

    void bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me)
      .then((res) => {
        if (cancelled) return;
        const need = Boolean(res.data?.mustChangePassword);
        needRef.current = need;
        if (!need) {
          allowingNav.current = false;
          closeForceModalQuietly();
          return;
        }
        if (isPasswordPath(pathname)) {
          allowingNav.current = false;
          closeForceModalQuietly();
          return;
        }
        allowingNav.current = false;
        openModal();
      })
      .catch(() => {
        /* 비로그인·오류는 무시 */
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
