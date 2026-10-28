import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { MediaImage } from '@/components/common/MediaImage';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { SubjectPet } from '@/types/pet';
import { Profile, type StoryStatus } from './Profile';
import styles from './PetProfileGroup.module.scss';

/** 한 콘텐츠의 펫 프로필: 관리 순서 카드 스택 또는 하나의 링 안에 가로 배치. */
export function PetProfileGroup({
  pets,
  fallbackImage,
  size,
  story = 'read',
  layout = 'row',
}: {
  pets: readonly SubjectPet[];
  fallbackImage: string;
  size: number;
  story?: StoryStatus;
  layout?: 'row' | 'stack';
}) {
  if (!pets.length) return <Profile imageUrl={fallbackImage} size={size} story={story} />;
  if (layout === 'stack')
    return (
      <span className={styles.stack} style={{ width: size + 24, height: size + 12 }}>
        {pets.map((pet, index) => (
          <span
            key={pet.petId}
            className={styles.card}
            style={{
              left: index === 0 ? 12 : index % 2 ? 0 : 24,
              top: index === 0 ? 12 : index === 1 ? 6 : 0,
              zIndex: pets.length - index,
            }}
          >
            <Profile
              imageUrl={resolveFileDisplayUrl(pet.profileFile) ?? NO_PROFILE_SRC}
              size={size}
              story={index === 0 ? story : 'read'}
            />
          </span>
        ))}
      </span>
    );
  return (
    <span
      className={clsx(styles.row, story === 'unread' ? styles.storyUnread : styles.storyRead)}
      style={{ '--pet-size': `${size - 10}px` } as CSSProperties}
    >
      {pets.map((pet) => (
        <MediaImage
          key={pet.petId}
          src={resolveFileDisplayUrl(pet.profileFile) ?? NO_PROFILE_SRC}
          alt=""
          width={size - 10}
          height={size - 10}
          className={styles.photo}
        />
      ))}
    </span>
  );
}
