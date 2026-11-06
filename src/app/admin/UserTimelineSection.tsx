'use client';
import { useEffect, useRef, useState } from 'react';
import { FullScreenLoading } from '@/components/common/FullScreenLoading';
import { PageLoadError } from '@/components/common/PageLoadError';
import { Profile } from '@/components/my-ultary/Profile';
import { bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { useModalStore } from '@/stores/modal.store';
import type { BffEnvelope } from '@/types/api';
import type { FileSummary } from '@/types/file';
import { formatWhen } from './adminData';
import {
  TIMELINE_TYPE_LABEL,
  type AdminTimelineActionResult,
  type AdminTimelineItem,
} from './adminManagementData';
import { notifyAdminMutationError } from './adminMutationError';
import { adminProfileUrl } from './adminProfileUrl';
import styles from './admin.module.scss';

function thumbUrl(userNo: number, file: FileSummary | undefined) {
  return adminProfileUrl(userNo, file ?? null) || NO_PROFILE_SRC;
}

export default function UserTimelineSection({ userNo }: { userNo: number }) {
  const [refresh, setRefresh] = useState(0);
  const [loaded, setLoaded] = useState<{
    key: string;
    items?: AdminTimelineItem[];
    error?: { value: unknown };
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const key = `${userNo}:${refresh}`;

  useEffect(() => {
    let cancelled = false;
    bffGet<BffEnvelope<{ items: AdminTimelineItem[] }>>(bffEndpoints.admin.userTimeline, {
      userNo,
    })
      .then((res) => {
        if (!cancelled) setLoaded({ key, items: res.data?.items ?? [] });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoaded({ key, error: { value: error } });
      });
    return () => {
      cancelled = true;
    };
  }, [userNo, key]);

  const current = loaded?.key === key ? loaded : null;
  const items = current?.items;

  const feedMissingMedia = (item: AdminTimelineItem) =>
    item.type === 'FEED_DELETED' && !(item.files?.length);

  const runAction = async (item: AdminTimelineItem) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      const res = await bffPostJson<BffEnvelope<AdminTimelineActionResult>>(
        bffEndpoints.admin.userTimelineAction,
        { userNo, type: item.type, id: item.id },
      );
      // 조치 직후 행 제거(버튼 재사용 방지). GET도 조치 완료 건은 더 이상 안 줌.
      setLoaded((prev) =>
        prev?.key === key && prev.items
          ? {
              ...prev,
              items: prev.items.filter((row) => !(row.type === item.type && row.id === item.id)),
            }
          : prev,
      );
      const temp = res.data?.temporaryPassword;
      if (temp) {
        useModalStore.getState().open({
          variant: 'alert',
          title: '임시 비밀번호',
          content: `아래 임시 비밀번호로 초기화했습니다.\n\n${temp}\n\n영문·숫자·특수문자 포함 12자입니다. 회원에게 전달한 뒤 바로 변경하도록 안내해 주세요. 기존 로그인 세션(리프레시)은 모두 폐기되었습니다.`,
        });
      } else if (feedMissingMedia(item)) {
        useModalStore.getState().open({
          variant: 'alert',
          title: '삭제 취소 완료',
          content: `게시글 #${item.id} 삭제를 취소했습니다.\n이 글에는 미디어가 없어 울타리 게시글 그리드에는 나타나지 않습니다. 상세 API로는 조회됩니다.`,
        });
      }
      setRefresh((n) => n + 1);
    } catch (error) {
      notifyAdminMutationError(error, '요청에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const confirmAction = (item: AdminTimelineItem) => {
    let content = `${TIMELINE_TYPE_LABEL[item.type] ?? item.type} 항목을 「${item.actionLabel}」할까요?`;
    if (item.type === 'PASSWORD_CHANGED') {
      content +=
        '\n\n확인 후 임시 비밀번호(영문·숫자·특수문자 포함 12자)가 한 번만 표시됩니다. 기존 로그인 세션은 모두 끊깁니다.';
    } else if (feedMissingMedia(item)) {
      content += `\n\n게시글 #${item.id}에는 미디어가 없습니다. 복구되어도 울타리 그리드에는 보이지 않을 수 있습니다.`;
    } else if (item.type === 'FEED_DELETED') {
      content += `\n\n게시글 #${item.id}`;
    }
    useModalStore.getState().open({
      variant: 'confirm',
      title: item.actionLabel,
      content,
      okButton: { label: item.actionLabel, onClick: () => void runAction(item) },
    });
  };

  return (
    <section>
      <h2 className={styles.memberSectionTitle}>주요 타임라인</h2>
      <FullScreenLoading open={saving} label="조치를 처리하고 있습니다." />
      {!current ? <p role="status">불러오는 중</p> : null}
      {current?.error ? <PageLoadError error={current.error.value} /> : null}
      {items ? (
        items.length ? (
          <ul className={styles.adminTimelineList}>
            {items.map((item) => (
              <li key={`${item.type}-${item.id}-${item.occurredAt}`}>
                <div className={styles.adminTimelineMain}>
                  <div className={styles.adminTimelineMeta}>
                    <strong>{TIMELINE_TYPE_LABEL[item.type] ?? item.type}</strong>
                    {item.type === 'FEED_DELETED' ||
                    item.type === 'STORY_DELETED' ||
                    item.type === 'PET_DELETED' ? (
                      <span>#{item.id}</span>
                    ) : null}
                    <span>{formatWhen(item.occurredAt)}</span>
                  </div>
                  <div className={styles.adminTimelineBody}>
                    {item.files?.length ? (
                      <div className={styles.adminTimelineThumbs}>
                        {item.files.slice(0, 6).map((file) => (
                          <Profile
                            key={file.fileId}
                            size={45}
                            story="none"
                            imageUrl={thumbUrl(userNo, file)}
                          />
                        ))}
                      </div>
                    ) : null}
                    <div className={styles.adminTimelineText}>
                      {item.petNames?.length ? (
                        <p className={styles.adminTimelinePets}>{item.petNames.join(', ')}</p>
                      ) : null}
                      {item.contentPreview ? <p>{item.contentPreview}</p> : null}
                      {item.message ? <p>{item.message}</p> : null}
                      {feedMissingMedia(item) ? (
                        <p className={styles.adminTimelineHint}>
                          미디어 없음 · 복구해도 울타리 그리드에는 안 보일 수 있음
                        </p>
                      ) : null}
                      {item.type === 'PASSWORD_CHANGED' ? (
                        <p className={styles.adminTimelineHint}>
                          클릭 후 임시 비밀번호(영문·숫자·특수문자 12자)가 한 번 표시됩니다. 세션은
                          모두 끊깁니다.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className={styles.adminTimelineAction}>
                  <button
                    type="button"
                    className={styles.pageButton}
                    disabled={saving}
                    onClick={() => confirmAction(item)}
                  >
                    {item.actionLabel}
                  </button>
                  {item.type === 'PASSWORD_CHANGED' ? (
                    <p className={styles.adminTimelineHint}>
                      임시 비밀번호는 확인 직후 화면에만 표시됩니다.
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>표시할 주요 이력이 없습니다.</p>
        )
      ) : null}
    </section>
  );
}
