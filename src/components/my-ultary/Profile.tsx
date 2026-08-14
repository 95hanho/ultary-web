import clsx from 'clsx';
import Image from 'next/image';
import styles from './Profile.module.scss';

export type ProfileProps = {
  imageUrl: string;
  /** 아바타 박스 한 변(px). 모양은 동일하고 크기만 다름 */
  size: number;
  /** 스토리 미확인 등 초록 그라데이션 테두리 */
  active?: boolean;
  className?: string;
};

/** 공통 프로필 아바타 (닉네임은 부모가 배치) */
export function Profile({
  imageUrl,
  size,
  active = false,
  className,
}: ProfileProps) {
  return (
    <span
      className={clsx(styles.avatarWrap, active && styles.active, className)}
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
