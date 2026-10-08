import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { isRecord } from '@/lib/api/error';
import { readMyReport, type MyReport } from '@/lib/report/openReport';
import type { FeedGridItem } from '@/components/feed/FeedGrid';

export type MyUltaryProfile = {
  userNo: number | null;
  nickname: string;
  bio: string;
  hasStory: boolean;
  /** null이면 Spring이 아직 필드를 안 준 것. 스토리가 있으면 안읽음으로 둔다 */
  hasUnviewed: boolean | null;
  residentCount: number;
  neighborCount: number;
  feedCount: number;
  myReport: MyReport | null;
};

export type StoryRingStatus = 'none' | 'unread' | 'read';

/** hasStory + hasUnviewed → 울타리 스토리 버튼 */
export function storyRingStatus(profile: {
  hasStory: boolean;
  hasUnviewed: boolean | null;
}): StoryRingStatus {
  if (!profile.hasStory) return 'none';
  if (profile.hasUnviewed == null) return 'unread';
  return profile.hasUnviewed ? 'unread' : 'read';
}

export type MyUltaryPetCard = {
  id: string;
  name: string;
  handle: string;
  gender: 'M' | 'F' | '';
  bio: string;
  imageUrl: string;
  isBirthday: boolean;
};

function asFile(raw: unknown) {
  if (!isRecord(raw)) return null;
  const fileId = raw.fileId;
  const filePath = raw.filePath;
  if (typeof fileId !== 'number' || typeof filePath !== 'string') return null;
  return { fileId, filePath };
}

function count(raw: unknown) {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
}

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!isRecord(raw)) return [];
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.content)) return raw.content;
  return [];
}

export function mapMyUltaryProfile(raw: unknown): MyUltaryProfile | null {
  if (!isRecord(raw) || typeof raw.nickname !== 'string' || !raw.nickname.trim()) {
    return null;
  }
  return {
    userNo: typeof raw.userNo === 'number' ? raw.userNo : null,
    nickname: raw.nickname.trim(),
    bio: typeof raw.bio === 'string' ? raw.bio : '',
    hasStory: raw.hasStory === true,
    hasUnviewed: typeof raw.hasUnviewed === 'boolean' ? raw.hasUnviewed : null,
    residentCount: count(raw.residentCount),
    neighborCount: count(raw.neighborCount),
    feedCount: count(raw.feedCount),
    myReport: readMyReport(raw),
  };
}

function genderLabel(raw: unknown): MyUltaryPetCard['gender'] {
  if (raw === 'MALE' || raw === 'M') return 'M';
  if (raw === 'FEMALE' || raw === 'F') return 'F';
  return '';
}

function isBirthdayToday(raw: unknown) {
  if (typeof raw !== 'string' || !raw.trim()) return false;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

export function mapMyPets(raw: unknown, fallbackImage: string): MyUltaryPetCard[] {
  return unwrapList(raw).flatMap((item) => {
    if (!isRecord(item) || typeof item.petId !== 'number') return [];
    const name = typeof item.name === 'string' ? item.name : '';
    const mentionId = typeof item.mentionId === 'string' ? item.mentionId : '';
    return [
      {
        id: String(item.petId),
        name,
        handle: mentionId ? `@${mentionId}` : '',
        gender: genderLabel(item.gender),
        bio: typeof item.bio === 'string' ? item.bio : '',
        imageUrl: resolveFileDisplayUrl(asFile(item.profileFile)) ?? fallbackImage,
        isBirthday: isBirthdayToday(item.birthday),
      },
    ];
  });
}

/** 그리드 응답에서 게시글 id만. 사진 목록은 여기 없고 상세 `media`에 있다 */
export function gridFeedIds(raw: unknown): string[] {
  return unwrapList(raw).flatMap((item) => {
    if (!isRecord(item)) return [];
    const feedId = item.feedId;
    if (typeof feedId !== 'number' && typeof feedId !== 'string') return [];
    return [String(feedId)];
  });
}

export function mapFeedGrid(
  raw: unknown,
  hrefFor: (feedId: string) => string,
): FeedGridItem[] {
  return unwrapList(raw).flatMap((item) => {
    if (!isRecord(item)) return [];
    const feedId = item.feedId;
    if (typeof feedId !== 'number' && typeof feedId !== 'string') return [];
    const id = String(feedId);
    const imageUrl = resolveFileDisplayUrl(
      asFile(item.coverFile) ?? asFile(item.coverThumbnailFile),
    );
    if (!imageUrl) return [];
    const mediaCount = count(item.mediaCount);
    return [
      {
        id,
        imageUrl,
        isMulti: mediaCount > 1,
        href: hrefFor(id),
      },
    ];
  });
}
