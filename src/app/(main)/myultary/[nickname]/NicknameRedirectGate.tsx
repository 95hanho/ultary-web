'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { bffEndpoints } from '@/lib/api/endpoints';
import { bffGet } from '@/lib/api/bffFetch';
import { isHttpError, isRecord } from '@/lib/api/error';
import { replaceUltaryNicknameInPath } from '@/lib/myultary/replaceUltaryNicknameInPath';
import type { BffEnvelope } from '@/types/api';

type Props = { requestedNickname: string };

/**
 * /myultary/{이전닉네임}/* → 현재 닉네임 URL로 replace (하위 경로 유지).
 * 공개 resolve API. 404면 페이지가 처리.
 */
export default function NicknameRedirectGate({ requestedNickname }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const ranFor = useRef<string | null>(null);

  useEffect(() => {
    const requested = requestedNickname.trim();
    if (!requested || ranFor.current === requested) return;
    ranFor.current = requested;
    let cancelled = false;

    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.public.resolveNickname, {
          nickname: requested,
        });
        if (cancelled) return;
        const data = res.data;
        if (!isRecord(data) || typeof data.nickname !== 'string') return;
        const current = data.nickname.trim();
        const redirected =
          typeof data.redirected === 'boolean' ? data.redirected : current !== requested;
        if (!redirected || !current || current === requested) return;
        const nextPath = replaceUltaryNicknameInPath(pathname, requested, current);
        if (nextPath !== pathname) {
          router.replace(nextPath);
        }
      } catch (error) {
        if (isHttpError(error) && (error.status === 404 || error.status === 410)) return;
        console.error('[myultary] nickname resolve failed', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestedNickname, pathname, router]);

  return null;
}
