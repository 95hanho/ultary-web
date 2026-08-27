import Image from 'next/image';
import Link from 'next/link';
import styles from './FeedGrid.module.scss';

const MultiIcon = '/images/icon/multi.svg';

export type FeedGridItem = {
  id: string;
  imageUrl: string;
  isMulti?: boolean;
  href: string;
};

type FeedGridProps = {
  posts: FeedGridItem[];
  className?: string;
};

/** 3열 게시글 썸네일 그리드 */
export function FeedGrid({ posts, className }: FeedGridProps) {
  return (
    <ul className={`${styles.grid}${className ? ` ${className}` : ''}`}>
      {posts.map((post) => (
        <li key={post.id} className={styles.item}>
          <Link href={post.href} className={styles.link} aria-label="게시글 보기">
            <Image
              src={post.imageUrl}
              alt=""
              width={200}
              height={200}
              className={styles.img}
            />
            {post.isMulti ? (
              <span className={styles.multiBadge} aria-hidden>
                <Image src={MultiIcon} alt="" width={18} height={18} />
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
