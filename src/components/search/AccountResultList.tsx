'use client';
import { nicknameTag } from '@/lib/nickname-tag';

import { PetNamesAndNicknameTag } from '@/components/common/PetNamesAndNicknameTag';
import type { SearchAccount } from '@/lib/mock/search';
import { MediaImage } from '@/components/common/MediaImage';
import styles from './AccountResultList.module.scss';

type AccountResultListProps = {
  accounts: SearchAccount[];
  highlightQuery: string;
  petQuery: string;
  /** 닉네임태그 클릭 — 보통 첫 펫언급 선택 */
  onSelectNickname: (account: SearchAccount) => void;
  /** 개별 펫언급 클릭 */
  onSelectPet: (account: SearchAccount, petId: number) => void;
};

/** 닉네임태그·펫언급 검색 결과 (해시태그 제외) */
export function AccountResultList({
  accounts,
  highlightQuery,
  petQuery,
  onSelectNickname,
  onSelectPet,
}: AccountResultListProps) {
  if (accounts.length === 0) return null;

  return (
    <ul className={styles.list} aria-label="계정 검색 결과">
      {accounts.map((account, i) => {
        return (
          <li key={`${account.id}-${i}`} className={styles.item}>
            <div className={styles.row}>
              <button
                type="button"
                className={styles.imageWrap}
                aria-label={`${nicknameTag(account.nickname)} 선택`}
                onClick={() => onSelectNickname(account)}
              >
                <MediaImage
                  src={account.imageUrl}
                  alt=""
                  width={47}
                  height={47}
                  className={styles.image}
                />
              </button>
              <span className={styles.text}>
                <PetNamesAndNicknameTag
                  nickname={account.nickname}
                  petNames={account.petNames ?? []}
                  query={petQuery || highlightQuery}
                  onNicknameSelect={() => onSelectNickname(account)}
                  onPetSelect={(index) => onSelectPet(account, account.petChoices![index]!.petId)}
                />
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
