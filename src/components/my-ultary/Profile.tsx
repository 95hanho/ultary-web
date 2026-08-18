import clsx from 'clsx';
import Image from 'next/image';
import styles from './Profile.module.scss';

/** none: 스토리 없음 · read: 읽음 · unread: 안읽음 */
export type StoryStatus = 'none' | 'read' | 'unread';

export type ProfileProps = {
  imageUrl: string;
  /** 아바타 박스 한 변(px). 모양은 동일하고 크기만 다름 */
  size: number;
  /** 스토리 링 상태 */
  story?: StoryStatus;
  className?: string;
};

/** 공통 프로필 아바타 (닉네임은 부모가 배치) */
export function Profile({
  imageUrl,
  size,
  story = 'none',
  className,
}: ProfileProps) {
  return (
    <span
      className={clsx(
        styles.avatarWrap,
        story === 'unread' && styles.storyUnread,
        story === 'read' && styles.storyRead,
        story === 'none' && styles.storyNone,
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        className={styles.avatar}
      />
    </span>
  );
}
