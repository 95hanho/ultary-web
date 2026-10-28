'use client';
import { nicknameTag } from '@/lib/nickname-tag';

import { PetNamesAndNicknameTag } from './PetNamesAndNicknameTag';
import { PageLoadError } from '@/components/common/PageLoadError';

import { MediaImage } from '@/components/common/MediaImage';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import clsx from 'clsx';
import { useId } from 'react';
import Image from 'next/image';
import styles from './AccountSearchList.module.scss';

export type AccountSearchItem = {
  userNo: number | string;
  nickname: string;
  imageUrl: string;
  petTags?: string[];
  pets?: { petId: number; name: string }[];
  petNames?: string[];
};

type Props<T extends AccountSearchItem> = {
  items: T[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (item: T) => void;
  onSelectPet?: (item: T, petId: number) => void;
  selectedUserNo?: number | string | null;
  status?: 'idle' | 'loading' | 'ready' | 'error';
  /** Server search should filter before limiting; keep its order unchanged. */
  serverSearch?: boolean;
  selection?: 'radio' | 'none';
  isDisabled?: (item: T) => boolean;
  getNote?: (item: T) => string | undefined;
  disabled?: boolean;
  autoFocus?: boolean;
  showSearch?: boolean;
  emptyMessage?: string;
};

/** Search + account list. Callers own data loading, ranking and selection behavior. */
export function AccountSearchList<T extends AccountSearchItem>({
  items,
  query,
  onQueryChange,
  onSelect,
  onSelectPet,
  selectedUserNo,
  status = 'ready',
  serverSearch = false,
  selection = 'none',
  isDisabled,
  getNote,
  disabled = false,
  autoFocus = false,
  showSearch = true,
  emptyMessage,
}: Props<T>) {
  const selectionName = useId();
  const term = query.trim().replace(/^@+/, '').toLowerCase();
  const visible =
    serverSearch || !term
      ? items
      : items.filter(
          (item) =>
            item.nickname.toLowerCase().includes(term) ||
            item.petNames?.some((name) => name.toLowerCase().includes(term)),
        );

  return (
    <div className={styles.root}>
      {showSearch ? (
        <div className={styles.searchRow}>
          <label className={styles.searchBar}>
            <Image src="/images/icon/Search.svg" alt="" width={20} height={20} />
            <input
              type="search"
              autoFocus={autoFocus}
              className={styles.searchInput}
              placeholder="검색"
              aria-label="닉네임태그·펫 이름 검색"
              value={query}
              disabled={disabled}
              onChange={(event) => onQueryChange(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                className={styles.clearQuery}
                aria-label="검색어 지우기"
                disabled={disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onQueryChange('')}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path
                    d="M3 3l8 8M11 3L3 11"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : null}
          </label>
        </div>
      ) : null}
      <div className={styles.results} aria-busy={status === 'loading'}>
        {status === 'loading' ? (
          <p className={styles.status} role="status">
            불러오는 중
          </p>
        ) : null}
        {status === 'error' ? <PageLoadError /> : null}
        {status === 'ready' && !visible.length ? (
          <p className={styles.status}>
            {emptyMessage ?? (term ? '검색 결과가 없어요' : '목록이 비어 있어요')}
          </p>
        ) : null}
        {status === 'ready' ? (
          <ul className={styles.list}>
            {visible.map((item) => {
              const blocked = disabled || Boolean(isDisabled?.(item));
              const note = getNote?.(item);
              if (onSelectPet) {
                return (
                  <li key={item.userNo} className={styles.petRow}>
                    <button
                      type="button"
                      className={styles.petAvatar}
                      disabled={blocked}
                      aria-label={`${nicknameTag(item.nickname)} 선택`}
                      onClick={() => onSelect(item)}
                    >
                      <MediaImage
                        src={item.imageUrl || NO_PROFILE_SRC}
                        alt=""
                        width={47}
                        height={47}
                        className={styles.avatarImg}
                      />
                    </button>
                    <span className={styles.text}>
                      <PetNamesAndNicknameTag
                        nickname={item.nickname}
                        petNames={item.petNames ?? []}
                        query={term}
                        disabled={blocked}
                        onNicknameSelect={() => onSelect(item)}
                        onPetSelect={(index) => onSelectPet(item, item.pets![index]!.petId)}
                      />
                      {note ? <span className={styles.note}>{note}</span> : null}
                    </span>
                  </li>
                );
              }
              const content = (
                <>
                  <span className={styles.avatar}>
                    <MediaImage
                      src={item.imageUrl || NO_PROFILE_SRC}
                      alt=""
                      width={47}
                      height={47}
                      className={styles.avatarImg}
                    />
                  </span>
                  <span className={styles.text}>
                    <PetNamesAndNicknameTag
                      nickname={item.nickname}
                      petNames={item.petNames ?? []}
                      query={term}
                      disabled={blocked}
                    />
                    {note ? <span className={styles.note}>{note}</span> : null}
                  </span>
                </>
              );
              return (
                <li key={item.userNo}>
                  {selection === 'radio' ? (
                    <label className={clsx(styles.row, blocked && styles.rowDisabled)}>
                      {content}
                      <input
                        type="radio"
                        name={selectionName}
                        className={styles.radio}
                        checked={selectedUserNo === item.userNo}
                        disabled={blocked}
                        onChange={() => onSelect(item)}
                        aria-label={`${nicknameTag(item.nickname)} 선택`}
                      />
                    </label>
                  ) : (
                    <button
                      type="button"
                      className={styles.row}
                      disabled={blocked}
                      onClick={() => onSelect(item)}
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
