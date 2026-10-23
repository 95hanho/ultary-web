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

function mediaUrl(url: string, reportId: number) {
  return url.replace(/^\/api\/files\/(\d+)\/content$/, `/api/admin/reports/${reportId}/files/$1/content`);
}

export default function ReportFeedPreview({ reportId, commentId, replyId }: {
  reportId: number; commentId: number | null; replyId: number | null;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [failure, setFailure] = useState<{ error: unknown } | null>(null);
  useEffect(() => {
    let cancelled = false;
    void bffGet<BffEnvelope<{ feed: unknown; comments: unknown[]; tags: unknown[] }>>(
      bffEndpoints.admin.reportPreview, { reportId },
    ).then(response => {
      if (cancelled) return;
      if (!response.data) throw new Error('신고 대상 원문을 불러오지 못했습니다.');
      const feed = toFeedData(response.data.feed, String(reportId));
      setPreview({
        feed: { ...feed, images: feed.images.map(url => mediaUrl(url, reportId)), profileUrl: mediaUrl(feed.profileUrl, reportId) },
        comments: toFeedComments(response.data.comments).map(comment => ({ ...comment,
          profileUrl: mediaUrl(comment.profileUrl, reportId),
          replies: comment.replies.map(reply => ({ ...reply, profileUrl: mediaUrl(reply.profileUrl, reportId) })),
        })),
        tags: response.data.tags.flatMap(raw => {
          const tag = tagExplainFromResponse(raw);
          return tag ? [{ ...tag, imageUrl: tag.imageUrl ? mediaUrl(tag.imageUrl, reportId) : undefined }] : [];
        }),
      });
    }).catch(error => { if (!cancelled) setFailure({ error }); });
    return () => { cancelled = true; };
  }, [reportId]);

  if (failure) return <PageLoadError error={failure.error} />;
  if (!preview) return <p className={styles.empty}>신고 대상 원문을 불러오는 중</p>;
  return <Feed {...preview.feed} readOnly previewComments={preview.comments} tagExplanations={preview.tags}
    focusCommentId={commentId == null ? undefined : String(commentId)}
    focusReplyId={replyId == null ? undefined : String(replyId)} />;
}
