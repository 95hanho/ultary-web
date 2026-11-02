'use client';

import Image from 'next/image';
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import styles from './login.module.scss';

const HIDDEN_UNTIL_KEY = 'ultary:login-intro:hidden-until';
const DAY_MS = 24 * 60 * 60 * 1000;

function shouldShowIntro() {
  if (!window.matchMedia('(max-width: 1023px)').matches) return false;
  try {
    return !(Number(window.localStorage.getItem(HIDDEN_UNTIL_KEY)) > Date.now());
  } catch {
    return true;
  }
}

function subscribeIntroPreference(onChange: () => void) {
  const mobile = window.matchMedia('(max-width: 1023px)');
  mobile.addEventListener('change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    mobile.removeEventListener('change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** 모바일에서만 안내를 표시하고 PC의 로그인 배치는 유지한다. */
export function MobileLoginIntro() {
  const eligible = useSyncExternalStore(subscribeIntroPreference, shouldShowIntro, () => false);
  const [dismissed, setDismissed] = useState(false);
  const visible = eligible && !dismissed;
  const dismissRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setDismissed(true), 5000);
    dismissRef.current?.focus({ preventScroll: true });
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
    };
  }, [visible]);

  const hideForToday = () => {
    try {
      window.localStorage.setItem(HIDDEN_UNTIL_KEY, String(Date.now() + DAY_MS));
    } catch {
      // 저장이 제한되어도 현재 안내는 즉시 닫는다.
    }
    setDismissed(true);
  };

  if (!visible) return null;

  return (
    <section className={styles.mobileIntro} role="dialog" aria-modal="true" aria-label="울타리 소개" data-login-intro>
      <button
        ref={dismissRef}
        type="button"
        className={styles.introDismiss}
        aria-label="소개 닫고 로그인하기"
        onClick={() => setDismissed(true)}
      >
        <span className={styles.introVisual}>
          <Image
            src="/images/img/login_intro.png"
            alt="우리 집 반려동물이 주인공인 곳. 함께한 하루를 기록하고, 다른 집 친구들의 일상도 만나보세요."
            width={1201}
            height={1310}
            sizes="(max-width: 1023px) 100vw, 1px"
            priority
            className={styles.mobileIntroImage}
          />
          <span className={styles.introHint}>Click!!!</span>
        </span>
      </button>
      <button type="button" className={styles.introSkip} onClick={hideForToday}>
        오늘 하루 안보기
      </button>
    </section>
  );
}
