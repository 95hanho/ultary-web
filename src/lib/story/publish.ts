import type { StoryPetTag, StoryTextBox } from '@/stores/story-draft.store';

const TEXT_SIZES = new Set([12, 16, 20, 24]);
const COLOR = /^#[0-9a-fA-F]{6}$/;

export type StoryTextPayload = {
  content: string;
  fontSize: number;
  bold: boolean;
  underline: boolean;
  strikethrough: boolean;
  color: string;
  posX: number;
  posY: number;
};

export type StoryMentionPayload = {
  petId: number;
  posX: number;
  posY: number;
};

function toPercent(value: number): number {
  const percent = Math.round(value * 10000) / 100;
  return Math.min(100, Math.max(0, percent));
}

/** 편집 좌표 0~1 → 스토리 등록 texts / mentions (각 최대 20) */
export function toStoryOverlayPayload(texts: StoryTextBox[], petTags: StoryPetTag[]) {
  const textPayload: StoryTextPayload[] = texts
    .map((box) => {
      const content = box.text.trim().slice(0, 200);
      if (!content) return null;
      return {
        content,
        fontSize: TEXT_SIZES.has(box.fontSize) ? box.fontSize : 16,
        bold: box.bold,
        underline: box.underline,
        strikethrough: box.strike,
        color: COLOR.test(box.color) ? box.color : '#ffffff',
        posX: toPercent(box.x),
        posY: toPercent(box.y),
      };
    })
    .filter((item): item is StoryTextPayload => item != null)
    .slice(0, 20);

  const mentionPayload: StoryMentionPayload[] = petTags
    .filter((tag) => typeof tag.petId === 'number')
    .slice(0, 20)
    .map((tag) => ({
      petId: tag.petId,
      posX: toPercent(tag.x),
      posY: toPercent(tag.y),
    }));

  return { texts: textPayload, mentions: mentionPayload };
}
