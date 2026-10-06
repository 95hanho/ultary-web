import { Feed, type FeedData } from '@/components/feed/Feed';
import styles from './FeedList.module.scss';

type FeedListProps = {
  feeds: FeedData[];
  label?: string;
  showAuthor?: boolean;
  /** 0이 첫 장. 단건 게시글에서 공유된 사진부터 연다 */
  initialMediaIndex?: number;
};

/** 게시글 카드 목록 — 메인 / 마이울타리 게시글 */
export function FeedList({
  feeds,
  label = '게시글',
  showAuthor = true,
  initialMediaIndex = 0,
}: FeedListProps) {
  return (
    <section className={styles.feeds} aria-label={label}>
      {feeds.map((feed) => (
        <Feed
          key={feed.id}
          {...feed}
          showAuthor={showAuthor}
          initialMediaIndex={initialMediaIndex}
        />
      ))}
    </section>
  );
}
