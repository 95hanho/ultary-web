'use client';

import type { SearchAccount } from '@/lib/mock/search';
import { highlightMatch, sortPetTagsByMatch } from '@/lib/search/highlight';
import Image from 'next/image';
import styles from './AccountResultList.module.scss';

type AccountResultListProps = {
  accounts: SearchAccount[];
  highlightQuery: string;
  petQuery: string;
  /** 닉네임 클릭 — 보통 첫 펫언급 선택 */
  onSelectNickname: (account: SearchAccount) => void;
  /** 개별 펫언급 클릭 */
  onSelectPetTag: (account: SearchAccount, petTag: string) => void;
};

/** 닉네임·펫언급 검색 결과 (해시태그 제외) */
export function AccountResultList({
  accounts,
  highlightQuery,
  petQuery,
  onSelectNickname,
  onSelectPetTag,
}: AccountResultListProps) {
  if (accounts.length === 0) return null;

  return (
    <ul className={styles.list} aria-label="계정 검색 결과">
      {accounts.map((account, i) => {
        const tags = sortPetTagsByMatch(account.petTags, petQuery || highlightQuery);
        return (
          <li key={`${account.id}-${i}`} className={styles.item}>
            <div className={styles.row}>
              <button
                type="button"
                className={styles.imageWrap}
                aria-label={`${account.nickname} 선택`}
                onClick={() => onSelectNickname(account)}
              >
                <Image
                  src={account.imageUrl}
                  alt=""
                  width={47}
                  height={47}
                  className={styles.image}
                />
              </button>
              <span className={styles.text}>
                <button
                  type="button"
                  className={styles.nickBtn}
                  onClick={() => onSelectNickname(account)}
                >
                  {highlightMatch(account.nickname, highlightQuery, styles.hit)}
                </button>
                <span className={styles.tags}>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={styles.petBtn}
                      onClick={() => onSelectPetTag(account, tag)}
                    >
                      {highlightMatch(tag, petQuery || highlightQuery, styles.hit)}
                    </button>
                  ))}
                </span>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
