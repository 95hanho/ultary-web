'use client';

import { useEffect, useState } from 'react';
import { Profile } from '@/components/my-ultary/Profile';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { BffEnvelope } from '@/types/api';
import type { Pet } from '@/types/pet';
import type { FeedDetailResponse } from '@/types/feed';
import styles from './SubjectPetPicker.module.scss';

export function SubjectPetPicker({
  value,
  onChange,
  disabled = false,
  editFeedId,
}: {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  editFeedId?: string;
}) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function loadPets() {
      if (!editFeedId) return bffGet<BffEnvelope<Pet[]>>(bffEndpoints.pets.root);
      const response = await bffGet<BffEnvelope<FeedDetailResponse>>(bffEndpoints.feeds.detail, {
        feedId: editFeedId,
      });
      if (!response.data) throw new Error('게시글 정보를 불러오지 못했습니다.');
      return bffGet<BffEnvelope<Pet[]>>(bffEndpoints.users.pets, { userNo: response.data.userNo });
    }
    loadPets()
      .then((response) => {
        if (!Array.isArray(response.data)) throw new Error('Invalid pets');
        if (!cancelled) {
          setPets(response.data);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [retry, editFeedId]);
  const selectedNames = pets
    .filter((pet) => value.includes(pet.petId))
    .map((pet) => pet.name)
    .join(',');
  return (
    <section className={styles.root} aria-label="펫 선택">
      <div className={styles.heading}>
        <h2 className={styles.title}>펫 선택</h2>
        {selectedNames ? <strong className={styles.selectedNames}>{selectedNames}</strong> : null}
      </div>
      {status === 'loading' ? (
        <p className={styles.note} role="status">
          반려동물을 불러오는 중입니다.
        </p>
      ) : null}
      {status === 'error' ? (
        <button
          type="button"
          className={styles.retry}
          onClick={() => {
            setStatus('loading');
            setRetry((previous) => previous + 1);
          }}
        >
          반려동물을 불러오지 못했습니다. 다시 시도
        </button>
      ) : null}
      {status === 'ready' && !pets.length ? (
        <p className={styles.note}>등록된 반려동물이 없습니다.</p>
      ) : null}
      <div className={styles.list}>
        {pets.map((pet) => {
          const selected = value.includes(pet.petId);
          return (
            <button
              key={pet.petId}
              type="button"
              className={styles.item}
              aria-pressed={selected}
              disabled={disabled || (!selected && value.length >= 20)}
              onClick={() =>
                onChange(selected ? value.filter((id) => id !== pet.petId) : [...value, pet.petId])
              }
            >
              <Profile
                className={styles.avatar}
                size={80}
                imageUrl={resolveFileDisplayUrl(pet.profileFile) ?? NO_PROFILE_SRC}
                story={selected ? 'unread' : 'read'}
              />
              <span className={styles.name}>{pet.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
