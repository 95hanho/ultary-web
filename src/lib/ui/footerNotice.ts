type FooterNoticeListener = (message: string) => void;

const listeners = new Set<FooterNoticeListener>();

/** 하단 메뉴 위에 잠깐 뜨는 알림 */
export function showFooterNotice(message: string) {
  for (const listener of listeners) listener(message);
}

export function subscribeFooterNotice(listener: FooterNoticeListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
