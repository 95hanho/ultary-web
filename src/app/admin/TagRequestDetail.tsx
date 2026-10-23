'use client';

import { MediaImage } from '@/components/common/MediaImage';
import Link from 'next/link';
import styles from './admin.module.scss';
import TagStatusControl from './TagStatusControl';
import type { TagRequest } from './tagRequestData';
export { readTagRequest, type TagRequest } from './tagRequestData';

const TAG_STATUS: Record<string, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '거절',
};

const STATUS_TONE: Record<string, string> = {
  PENDING: 'toneWait',
  APPROVED: 'toneOk',
  REJECTED: 'toneNo',
};

export default function TagRequestDetail({
  item,
  listHref,
  onChange,
}: {
  item: TagRequest;
  listHref: string;
  onChange: (item: TagRequest) => void;
}) {
  return (
    <div className={styles.detail}>
      <div className={styles.detailScroll}>
        <p className={styles.detailHash}>
          #{item.hashtag}
          <span className={`${badgeClass(item.status)} ${styles.detailTitleBadge}`}>
            {TAG_STATUS[item.status] ?? item.status}
          </span>
        </p>
        <p className={styles.detailMeta}>
          {item.tagId != null ? `태그 ${item.tagId}` : '태그 번호 없음'}
          {item.requesterUserNo != null
            ? ` · ${memberLabel(item.requesterUserNo, item.requesterNickname)}`
            : ''}
        </p>
        <p className={styles.detailMeta}>
          요청 {formatWhen(item.createdAt)}
          {item.reviewedAt ? ` · 검토 ${formatWhen(item.reviewedAt)}` : ''}
        </p>
        {item.imageUrls.length > 0 ? (
          <div className={styles.detailImages}>
            {item.imageUrls.map((url) => (
              <span key={url} className={styles.detailImage}>
                <MediaImage
                  src={url}
                  alt=""
                  width={120}
                  height={120}
                  className={styles.detailImageImg}
                />
              </span>
            ))}
          </div>
        ) : (
          <p className={styles.detailMeta}>이미지 없음</p>
        )}
        <Field label="제목" value={item.title} />
        <Field label="태그 피드 수" value={`${item.feedCount}개`} />
        <Field label="소개" value={item.content} />
        <Field label="링크" value={item.link} href={item.link} />
        {item.status === 'REJECTED' ? (
          <>
            <hr className={styles.detailRule} />
            <Field label="거절 메시지" value={item.rejectMessage} />
          </>
        ) : null}
      </div>
      <div className={styles.detailActions}>
        <div className={styles.actionRow}>
          <Link href={listHref} className={styles.backButton}>
            목록
          </Link>
          <TagStatusControl item={item} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, href }: { label: string; value: string; href?: string }) {
  const text = value.trim();
  const link = href && /^https?:\/\//i.test(href.trim()) ? href.trim() : '';
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {text ? (
        link ? (
          <p className={styles.fieldValue}>
            <a className={styles.fieldLink} href={link} target="_blank" rel="noreferrer">
              {text}
            </a>
          </p>
        ) : (
          <p className={styles.fieldValue}>{text}</p>
        )
      ) : (
        <p className={styles.fieldEmpty}>없음</p>
      )}
    </div>
  );
}

function badgeClass(status: string) {
  const tone = STATUS_TONE[status];
  return tone ? `${styles.badge} ${styles[tone]}` : styles.badge;
}

function memberLabel(userNo: number, nickname: string | null) {
  return nickname ? `no.${userNo}(${nickname})` : `no.${userNo}`;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hh}:${mm}`;
}
