import clsx from 'clsx';
import { nicknameTag } from '@/lib/nickname-tag';
import { highlightMatch } from '@/lib/search/highlight';
import styles from './PetNamesAndNicknameTag.module.scss';

/** 공통 [펫이름들과닉네임태그]. 이름은 전달받은 관리/콘텐츠 순서를 유지한다. */
export function PetNamesAndNicknameTag({
  nickname,
  petNames,
  query = '',
  className,
  tone = 'default',
  onPetSelect,
  onNicknameSelect,
  disabled = false,
}: {
  nickname: string;
  petNames: readonly string[];
  query?: string;
  className?: string;
  tone?: 'default' | 'media';
  onPetSelect?: (index: number) => void;
  onNicknameSelect?: () => void;
  disabled?: boolean;
}) {
  const term = query.trim().replace(/^@+/, '');
  const tag = highlightMatch(nicknameTag(nickname), term, styles.hit);
  return (
    <span className={clsx(styles.root, tone === 'media' && styles.media, className)}>
      {petNames.length ? (
        <span className={styles.names}>
          {petNames.map((name, index) => (
            <span key={index}>
              {index ? ', ' : null}
              {onPetSelect ? (
                <button
                  type="button"
                  className={styles.select}
                  disabled={disabled}
                  onClick={() => onPetSelect(index)}
                >
                  {highlightMatch(name, term, styles.hit)}
                </button>
              ) : (
                highlightMatch(name, term, styles.hit)
              )}
            </span>
          ))}
        </span>
      ) : null}
      {onNicknameSelect ? (
        <button
          type="button"
          className={clsx(styles.tag, styles.select)}
          disabled={disabled}
          onClick={onNicknameSelect}
        >
          {tag}
        </button>
      ) : (
        <span className={styles.tag}>{tag}</span>
      )}
    </span>
  );
}
