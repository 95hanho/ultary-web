'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError } from '@/lib/api/error';
import type { BffEnvelope } from '@/types/api';
import { formatWhen, TARGET_TYPE } from './adminData';
import { AI_FEATURE, AI_STATUS, AI_ACTION, aiDuration, type AiLog } from './aiLogData';
import styles from './admin.module.scss';

export default function AiLogDetailClient({ aiRequestId }: { aiRequestId: number }) {
  const [refresh, setRefresh] = useState(0);
  const [loaded, setLoaded] = useState<{ id: number; refresh: number; item?: AiLog; error?: string } | null>(null);
  const pending = loaded?.id !== aiRequestId || loaded?.refresh !== refresh;
  const item = pending ? null : loaded?.item;

  useEffect(() => {
    let cancelled = false;
    const path = bffEndpoints.admin.aiLog.replace(':aiRequestId', String(aiRequestId));
    bffGet<BffEnvelope<AiLog>>(path).then((response) => {
      if (!response.data) throw new Error('Missing AI log');
      if (!cancelled) setLoaded({ id: aiRequestId, refresh, item: response.data });
    }).catch((error: unknown) => {
      if (!cancelled) setLoaded({ id: aiRequestId, refresh, error: isHttpError(error) && error.status === 404
        ? 'AI 로그를 찾지 못했습니다.' : 'AI 로그를 불러오지 못했습니다.' });
    });
    return () => { cancelled = true; };
  }, [aiRequestId, refresh]);

  return (
    <div className={styles.detail}>
      <div className={styles.detailScroll} aria-busy={pending}>
        <h1 className={styles.detailHash}>AI 로그 {aiRequestId}</h1>
        {pending ? <p className={styles.detailMeta} role="status">불러오는 중</p> : null}
        {!pending && loaded?.error ? <PageLoadError /> : null}
        {item ? <>
          <p className={styles.detailMeta}>{AI_FEATURE[item.featureType] ?? item.featureType} · {item.createdAt ? formatWhen(item.createdAt) : '시간 기록 없음'}</p>
          <Field label="호출 결과" value={AI_STATUS[item.status] ?? item.status} />
          <Field label="오류 코드" value={item.errorCode} />
          <Field label="오류 원인" value={item.errorMessage} />
          <Field label="소요 시간" value={aiDuration(item.latencyMs)} />
          <Field label="HTTP 상태" value={item.httpStatus} />
          <Field label="Gemini 모델" value={item.modelName} />
          <Field label="회원 번호" value={item.userNo} />
          <Field label="검사 대상" value={item.targetType ? `${TARGET_TYPE[item.targetType] ?? item.targetType} #${item.targetId}` : null} />
          <Field label="게시글 ID" value={item.targetFeedId} />
          <hr className={styles.detailRule} />
          <Field label="작업 ID" value={item.moderationJobId} />
          <Field label="본문 버전" value={item.contentVersion} />
          <Field label="이 호출의 시도 번호" value={item.attemptNo} />
          <Field label="현재 작업 상태" value={item.jobStatus ? AI_STATUS[item.jobStatus] ?? item.jobStatus : null} />
          <Field label="현재 작업의 누적 시도 횟수" value={item.jobAttemptCount} />
          <Field label="조치 결과" value={item.resultAction ? AI_ACTION[item.resultAction] ?? item.resultAction : null} />
          <Field label="다음 검사 예정" value={item.jobStatus === 'PENDING' && item.nextAttemptAt ? formatWhen(item.nextAttemptAt) : null} />
          <p className={styles.aiDetailHint}>호출 결과는 당시 기록이며 작업 상태는 조회 시점의 상태입니다. 이전 로그나 태그 추천에는 작업 정보가 없을 수 있습니다.</p>
        </> : null}
      </div>
      <div className={styles.detailActions}><div className={styles.actionRow}>
        <Link href="/admin/ai/logs" className={styles.backButton}>목록</Link>
        <button type="button" className={styles.pageButton} disabled={pending} onClick={() => setRefresh((value) => value + 1)}>새로고침</button>
      </div></div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return <div className={styles.field}><span className={styles.fieldLabel}>{label}</span>
    <p className={value == null || value === '' ? styles.fieldEmpty : styles.fieldValue}>{value == null || value === '' ? '기록 없음' : value}</p></div>;
}
