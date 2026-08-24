import { Feed, type FeedData } from '@/components/feed/Feed';
import styles from './FeedList.module.scss';

type FeedListProps = {
  feeds: FeedData[];
};

/** 게시글 카드 목록 — 메인 / 마이울타리 게시글 */
export function FeedList({ feeds }: FeedListProps) {
  return (
    <section className={styles.feeds} aria-label="게시글">
      {feeds.map((feed) => (
        <Feed key={feed.id} {...feed} />
      ))}
    </section>
  );
}
