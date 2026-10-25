'use client';

import { useEffect, useState } from 'react';
import { Feed, type FeedData } from '@/components/feed/Feed';
import { PageLoadError } from '@/components/common/PageLoadError';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { toFeedData } from '@/lib/feed/toFeedData';
import { toFeedComments } from '@/lib/feed/toComments';
import { tagExplainFromResponse } from '@/lib/tag/explain';
import type { BffEnvelope } from '@/types/api';
import type { MockComment } from '@/lib/mock/comments';
import type { TagExplain } from '@/lib/mock/tags';
import styles from './admin.module.scss';

type Preview = { feed: FeedData; comments: MockComment[]; tags: TagExplain[] };

function mediaUrl(url: string, basePath: string) {
  return url.replace(/^\/api\/files\/(\d+)\/content$/, `${basePath}/files/$1/content`);
}

export default function ReportFeedPreview({ reportId, aiRequestId, commentId, replyId }: (
  { reportId: number; aiRequestId?: never } | { aiRequestId: number; reportId?: never }
) & { commentId: number | null; replyId: number | null }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [failure, setFailure] = useState<{ error: unknown } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const basePath = aiRequestId != null ? `/api/admin/ai/logs/${aiRequestId}` : `/api/admin/reports/${reportId}`;
    void bffGet<BffEnvelope<{ feed: unknown; comments: unknown[]; tags: unknown[] }>>(
      aiRequestId != null ? bffEndpoints.admin.aiLogPreview : bffEndpoints.admin.reportPreview,
      aiRequestId != null ? { aiRequestId } : { reportId },
    ).then(response => {
      if (cancelled) return;
      if (!response.data) throw new Error('대상 원문을 불러오지 못했습니다.');
      const feed = toFeedData(response.data.feed, String(aiRequestId ?? reportId));
      setPreview({
        feed: { ...feed, images: feed.images.map(url => mediaUrl(url, basePath)), profileUrl: mediaUrl(feed.profileUrl, basePath) },
        comments: toFeedComments(response.data.comments).map(comment => ({ ...comment,
          profileUrl: mediaUrl(comment.profileUrl, basePath),
          replies: comment.replies.map(reply => ({ ...reply, profileUrl: mediaUrl(reply.profileUrl, basePath) })),
        })),
        tags: response.data.tags.flatMap(raw => {
          const tag = tagExplainFromResponse(raw);
          return tag ? [{ ...tag, imageUrl: tag.imageUrl ? mediaUrl(tag.imageUrl, basePath) : undefined }] : [];
        }),
      });
    }).catch(error => { if (!cancelled) setFailure({ error }); });
    return () => { cancelled = true; };
  }, [reportId, aiRequestId]);

  if (failure) return <PageLoadError error={failure.error} />;
  if (!preview) return <p className={styles.empty}>대상 원문을 불러오는 중</p>;
  return <Feed {...preview.feed} readOnly previewComments={preview.comments} tagExplanations={preview.tags}
    focusCommentId={commentId == null ? undefined : String(commentId)}
    focusReplyId={replyId == null ? undefined : String(replyId)} />;
}
