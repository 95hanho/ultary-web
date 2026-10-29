type Provider = 'GOOGLE' | 'KAKAO';
export type SocialLinkResult = { linked?: Provider; error?: string };

const CHANNEL_PREFIX = 'ultary-social-link:';
const FLOW_PATTERN = /^[a-f0-9-]{36}$/i;

/** 원래 마이페이지의 방문 기록을 유지한 채 별도 창에서 연동한다. */
export function openSocialLinkWindow(
  href: string,
  provider: Provider,
  onResult: (result: SocialLinkResult) => void,
): (() => void) | null {
  const flow = crypto.randomUUID();
  const channel = new BroadcastChannel(CHANNEL_PREFIX + flow);
  const popup = window.open('about:blank', `ultary-social-link-${flow}`, 'popup,width=520,height=720');
  if (!popup) {
    channel.close();
    return null;
  }

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    channel.close();
    window.clearTimeout(timeout);
    if (!popup.closed) popup.close();
  };
  const timeout = window.setTimeout(dispose, 10 * 60 * 1000);
  channel.onmessage = ({ data }: MessageEvent<unknown>) => {
    if (disposed || !data || typeof data !== 'object') return;
    const result = data as SocialLinkResult & { type?: unknown };
    if (result.type !== 'social-link-result') return;
    if (result.linked !== provider && typeof result.error !== 'string') return;
    dispose();
    onResult({ linked: result.linked === provider ? provider : undefined, error: result.error });
  };

  const returnUrl = new URL('/settings/mypage', window.location.origin);
  returnUrl.searchParams.set('socialLinkFlow', flow);
  const authorizeUrl = new URL(href, window.location.origin);
  authorizeUrl.searchParams.set('returnUrl', returnUrl.pathname + returnUrl.search);
  // 통신은 같은 출처의 BroadcastChannel로 한다. 제공자의 COOP로 opener가 없어져도 전달된다.
  try {
    popup.opener = null;
    popup.location.replace(authorizeUrl.toString());
  } catch (error) {
    dispose();
    throw error;
  }
  return dispose;
}

/** OAuth 콜백으로 돌아온 창이 결과를 원래 마이페이지에 전달한다. */
export function completeSocialLinkWindow(flow: string | null, result: SocialLinkResult): boolean {
  if (!flow || !FLOW_PATTERN.test(flow) || (!result.linked && !result.error)) return false;
  const channel = new BroadcastChannel(CHANNEL_PREFIX + flow);
  channel.postMessage({ type: 'social-link-result', ...result });
  channel.close();
  window.close();
  return true;
}
