'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { httpErrorStatus, isHttpError } from '@/lib/api/error';
import type { BffEnvelope } from '@/types/api';
import { formatWhen, TARGET_TYPE } from './adminData';
import { AI_FEATURE, AI_STATUS, AI_ACTION, aiDuration, type AiLog } from './aiLogData';
import styles from './admin.module.scss';
import AiReviewControl from './AiReviewControl';
import ReportFeedPreview from './ReportFeedPreview';

export default function AiLogDetailClient({ aiRequestId }: { aiRequestId: number }) {
  const [refresh, setRefresh] = useState(0);
  const [loaded, setLoaded] = useState<{
    id: number;
    refresh: number;
    item?: AiLog;
    error?: string;
    status?: number;
  } | null>(null);
  const pending = loaded?.id !== aiRequestId || loaded?.refresh !== refresh;
  const item = pending ? null : loaded?.item;
  const firstCreatedAt = item?.attempts?.[0]?.createdAt ?? item?.createdAt;
  const hasPreview = item?.targetId != null && ['FEED', 'COMMENT', 'REPLY'].includes(item.targetType ?? '');

  useEffect(() => {
    let cancelled = false;
    const path = bffEndpoints.admin.aiLog.replace(':aiRequestId', String(aiRequestId));
    bffGet<BffEnvelope<AiLog>>(path)
      .then((response) => {
        if (!response.data) throw new Error('Missing AI log');
        if (!cancelled) setLoaded({ id: aiRequestId, refresh, item: response.data });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setLoaded({
            id: aiRequestId,
            refresh,
            status: httpErrorStatus(error),
            error:
              isHttpError(error) && error.status === 404
                ? 'AI 로그를 찾지 못했습니다.'
                : 'AI 로그를 불러오지 못했습니다.',
          });
      });
    return () => {
      cancelled = true;
    };
  }, [aiRequestId, refresh]);

  return (
    <div className={styles.detail}>
      <div className={styles.detailScroll} aria-busy={pending}>
        <h1 className={styles.detailHash}>AI 로그 {aiRequestId}</h1>
        {pending ? (
          <p className={styles.detailMeta} role="status">
            불러오는 중
          </p>
        ) : null}
        {!pending && loaded?.error ? <PageLoadError status={loaded?.status} /> : null}
        {item ? (
          <>
            <div className={hasPreview ? styles.reportDetailColumns : undefined}>
              <div className={styles.aiDetailTableWrap}>
                <table className={styles.aiSummaryTable}>
                  <caption>요청 정보</caption>
                  <tbody>
                    <Field label="기능" value={AI_FEATURE[item.featureType] ?? item.featureType} />
                    <Field label="최초 호출날짜" value={firstCreatedAt ? formatWhen(firstCreatedAt) : null} />
                    <Field label="회원" value={item.userNo != null ? `${item.userNickname ?? '알 수 없는 사용자'}(${item.userNo})` : null} />
                    <Field label="휴대폰 번호" value={item.userPhone} />
                    <Field label="이메일" value={item.userEmail} />
                    <Field
                      label="검사 대상"
                      value={
                        item.targetType
                          ? `${TARGET_TYPE[item.targetType] ?? item.targetType} #${item.targetId}`
                          : null
                      }
                    />
                    <Field label="검사 당시 내용" value={item.inspectionContent} />
                    {item.moderationJobId != null && item.status === 'FAILED' ? (
                      <>
                        <Field
                          label="관리자 처리"
                          value={
                            { PENDING: '확인 대기', KEPT: '유지', DELETED: '삭제조치' }[
                              item.adminReviewStatus ?? 'PENDING'
                            ]
                          }
                        />
                        <Field
                          label="관리자 처리일"
                          value={item.adminReviewedAt ? formatWhen(item.adminReviewedAt) : null}
                        />
                      </>
                    ) : null}
                    <Field label="작업 ID" value={item.moderationJobId} />
                    <Field label="본문 버전" value={item.contentVersion} />
                    <Field
                      label="현재 작업 상태"
                      value={item.jobStatus ? (AI_STATUS[item.jobStatus] ?? item.jobStatus) : null}
                    />
                    <Field label="전체 시도 횟수" value={item.attemptCount} />
                    <Field
                      label="조치 결과"
                      value={item.resultAction ? (AI_ACTION[item.resultAction] ?? item.resultAction) : null}
                    />
                    <Field
                      label="다음 검사 예정"
                      value={
                        item.jobStatus === 'PENDING' && item.nextAttemptAt
                          ? formatWhen(item.nextAttemptAt)
                          : null
                      }
                    />
                  </tbody>
                </table>
              </div>
              {hasPreview ? (
                <aside className={styles.reportPreviewColumn} aria-label="AI 검사 대상 피드 미리보기">
                  <div className={styles.reportFeedPreview}>
                    <ReportFeedPreview key={`${item.aiRequestId}:${refresh}:${item.adminReviewStatus}:${item.adminReviewedAt}`}
                      aiRequestId={item.aiRequestId}
                      commentId={item.targetType === 'COMMENT' ? item.targetId : null}
                      replyId={item.targetType === 'REPLY' ? item.targetId : null} />
                  </div>
                </aside>
              ) : null}
            </div>
            <hr className={styles.detailRule} />
            <div className={styles.aiDetailTableWrap}>
              <table className={styles.dataTable + ' ' + styles.aiAttemptsTable}>
                <caption>전체 시도 내역</caption>
                <thead><tr>
                  <th scope="col">시도</th><th scope="col">호출결과</th><th scope="col">오류 코드</th>
                  <th scope="col">오류 원인</th><th scope="col">HTTP 상태</th><th scope="col">소요 시간</th>
                  <th scope="col">모델</th><th scope="col">호출날짜</th>
                </tr></thead>
                <tbody>{(item.attempts ?? [item]).map((attempt, index) => (
                  <tr key={attempt.aiRequestId}>
                    <td>{attempt.attemptNo ?? index + 1}회</td>
                    <td><span className={styles.badge + ' ' + (attempt.status === 'FAILED' ? styles.toneNo : styles.toneOk)}>
                      {AI_STATUS[attempt.status] ?? attempt.status}
                    </span></td>
                    <td>{attempt.errorCode ?? '–'}</td><td>{attempt.errorMessage ?? '–'}</td>
                    <td>{attempt.httpStatus ?? '–'}</td><td>{aiDuration(attempt.latencyMs)}</td>
                    <td>{attempt.modelName ?? '–'}</td><td>{attempt.createdAt ? formatWhen(attempt.createdAt) : '–'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
      <div className={styles.detailActions}>
        <div className={styles.actionRow}>
          <Link href="/admin/ai/logs" className={styles.backButton}>
            목록
          </Link>
          <button
            type="button"
            className={styles.pageButton}
            disabled={pending}
            onClick={() => setRefresh((value) => value + 1)}
          >
            새로고침
          </button>
          {item?.moderationJobId != null && item.status === 'FAILED' ? (
            <AiReviewControl
              item={item}
              onChange={(next) => setLoaded({ id: aiRequestId, refresh, item: next })}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>
        {value == null || value === '' ? '기록 없음' : value}
      </td>
    </tr>
  );
}
