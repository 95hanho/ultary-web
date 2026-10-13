import type { NormalizedCrop } from '@/lib/write/crop-rect';
import { create } from 'zustand';

type TagRequestDraft = {
  sourceUrl: string;
  fileName: string;
  croppedDataUrl: string | null;
  cropRect: NormalizedCrop | null;
};

type TagRequestDraftState = {
  draft: TagRequestDraft | null;
  setSource: (sourceUrl: string, fileName: string) => void;
  setCrop: (croppedDataUrl: string, cropRect: NormalizedCrop | null) => void;
  clear: () => void;
};

/** 해시태그 요청 작성 중 사진. 새로고침하면 사라진다 */
export const useTagRequestDraft = create<TagRequestDraftState>((set) => ({
  draft: null,
  setSource: (sourceUrl, fileName) =>
    set({
      draft: { sourceUrl, fileName, croppedDataUrl: null, cropRect: null },
    }),
  setCrop: (croppedDataUrl, cropRect) =>
    set((state) =>
      state.draft ? { draft: { ...state.draft, croppedDataUrl, cropRect } } : state,
    ),
  clear: () => set({ draft: null }),
}));
