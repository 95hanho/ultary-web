import type { NormalizedCrop } from '@/lib/write/crop-rect';
import { create } from 'zustand';

export type StoryTextBox = {
  id: string;
  x: number;
  y: number;
  text: string;
  bold: boolean;
  underline: boolean;
  strike: boolean;
  color: string;
  /** 12 | 16 | 20 | 24 */
  fontSize: number;
};

export type StoryPetTag = {
  id: string;
  petId: number;
  petTag: string;
  x: number;
  y: number;
};

type StoryDraftState = {
  sourceUrl: string | null;
  /** 이미지 크롭 결과 */
  croppedDataUrl: string | null;
  /** 원본 위 크롭 박스 (표시 영역 기준 0~1). 다시 들어오면 이 위치로 복원 */
  cropRect: NormalizedCrop | null;
  kind: 'image' | 'video' | null;
  fileName: string;
  texts: StoryTextBox[];
  petTags: StoryPetTag[];
  setMedia: (payload: {
    sourceUrl: string;
    kind: 'image' | 'video';
    fileName: string;
  }) => void;
  setCrop: (croppedDataUrl: string, cropRect: NormalizedCrop | null) => void;
  clearEdits: () => void;
  setTexts: (texts: StoryTextBox[]) => void;
  upsertText: (box: StoryTextBox) => void;
  removeText: (id: string) => void;
  addPetTag: (tag: Omit<StoryPetTag, 'id'> & { id?: string }) => void;
  removePetTag: (id: string) => void;
  clear: () => void;
};

export const useStoryDraftStore = create<StoryDraftState>((set) => ({
  sourceUrl: null,
  croppedDataUrl: null,
  cropRect: null,
  kind: null,
  fileName: '',
  texts: [],
  petTags: [],
  setMedia: ({ sourceUrl, kind, fileName }) =>
    set({
      sourceUrl,
      kind,
      fileName,
      croppedDataUrl: null,
      cropRect: null,
      texts: [],
      petTags: [],
    }),
  setCrop: (croppedDataUrl, cropRect) => set({ croppedDataUrl, cropRect }),
  clearEdits: () => set({ texts: [], petTags: [] }),
  setTexts: (texts) => set({ texts }),
  upsertText: (box) =>
    set((state) => {
      const idx = state.texts.findIndex((t) => t.id === box.id);
      if (idx === -1) return { texts: [...state.texts, box] };
      const next = [...state.texts];
      next[idx] = box;
      return { texts: next };
    }),
  removeText: (id) => set((state) => ({ texts: state.texts.filter((t) => t.id !== id) })),
  addPetTag: (tag) =>
    set((state) => ({
      petTags: [
        ...state.petTags,
        {
          id: tag.id ?? `st-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          petId: tag.petId,
          petTag: tag.petTag,
          x: tag.x,
          y: tag.y,
        },
      ],
    })),
  removePetTag: (id) => set((state) => ({ petTags: state.petTags.filter((t) => t.id !== id) })),
  clear: () =>
    set({
      sourceUrl: null,
      croppedDataUrl: null,
      cropRect: null,
      kind: null,
      fileName: '',
      texts: [],
      petTags: [],
    }),
}));
