'use client';

import { AccountSearchList } from '@/components/common/AccountSearchList';
import { PageHeader } from '@/components/common/PageHeader';
import { useRankedAccounts, type RankedAccount } from '@/lib/search/useRankedAccounts';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './PhotoTagAccountSearch.module.scss';

export type PetMentionSelection = { petId: number; petTag: string };
type Props = {
  open: boolean;
  mode: 'STORY_TAG' | 'FEED_TAG';
  onSelect: (pet: PetMentionSelection) => void;
  onClose: () => void;
};

export function PhotoTagAccountSearch({ open, ...props }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted || !open) return null;
  return createPortal(<PhotoTagSearchContents {...props} />, document.body);
}

function PhotoTagSearchContents({ mode, onSelect, onClose }: Omit<Props, 'open'>) {
  const [query, setQuery] = useState('');
  const { items, status } = useRankedAccounts(mode, true, query);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const pick = (account: RankedAccount, tag?: string) => {
    const term = query.trim().replace(/^@+/, '').toLowerCase();
    const pet = tag
      ? account.pets.find((pet) => pet.petTag === tag)
      : (account.pets.find((pet) => term && pet.petTag.slice(1).toLowerCase().includes(term)) ??
        account.pets[0]);
    if (pet) onSelect(pet);
  };

  return (
    <div className={styles.shell} role="dialog" aria-modal="true" aria-label="사진 태그 검색">
      <div className={styles.inner}>
        <PageHeader title={mode === 'STORY_TAG' ? '언급 태그' : '사진 태그'} onBack={onClose} />
        <AccountSearchList
          items={items}
          query={query}
          onQueryChange={setQuery}
          status={status}
          serverSearch
          autoFocus
          onSelect={(account) => pick(account)}
          onSelectPetTag={pick}
        />
      </div>
    </div>
  );
}
