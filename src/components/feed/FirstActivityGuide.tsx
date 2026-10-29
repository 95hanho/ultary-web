'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import type { BffEnvelope } from '@/types/api';
import styles from './FirstActivityGuide.module.scss';

type ActivityProfile = { petCount: number; feedCount: number };
type PetName = { name: string };

export function firstActivityCopy(profile: ActivityProfile, pets: PetName[] = []) {
  if (profile.feedCount !== 0) return null;
  if (profile.petCount === 0) {
    return {
      title: '우리 아이의 이야기를 시작해볼까요?',
      description: '반려동물을 등록하고, 함께하는 일상을 공유해보세요.',
    };
  }
  return {
    title:
      profile.petCount === 1 && pets[0]?.name
        ? `${pets[0].name}의 첫 번째 일상을 기다리고 있어요`
        : '우리 아이들의 첫 번째 일상을 기다리고 있어요',
    description: '함께한 순간을 사진과 이야기로 남겨보세요.',
  };
}

export function FirstActivityGuide({ nickname }: { nickname: string }) {
  const [copy, setCopy] = useState<ReturnType<typeof firstActivityCopy>>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await bffGet<BffEnvelope<ActivityProfile>>(bffEndpoints.myUltary.profile);
        const profile = response.data;
        if (
          !profile ||
          profile.feedCount !== 0 ||
          !Number.isInteger(profile.petCount) ||
          profile.petCount < 0
        )
          return;
        let pets: PetName[] = [];
        if (profile.petCount === 1) {
          const result = await bffGet<BffEnvelope<PetName[]>>(bffEndpoints.pets.root);
          pets = Array.isArray(result.data) ? result.data : [];
        }
        if (!cancelled) setCopy(firstActivityCopy(profile, pets));
      } catch (error) {
        // An optional introduction must not prevent reading the main feed.
        console.warn('[main] first activity guide', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nickname]);

  if (!copy) return null;
  return (
    <section className={styles.card} aria-label="첫 일상 안내">
      <h2 className={styles.title}>{copy.title}</h2>
      <p className={styles.description}>{copy.description}</p>
      <Link href={myUltaryPath(nickname)} className={styles.link}>
        내 울타리로 가기
      </Link>
    </section>
  );
}
