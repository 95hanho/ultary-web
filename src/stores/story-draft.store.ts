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
  petName: string;
  x: number;
  y: number;
};

type StoryDraftState = {
  subjectPetIds: number[];
  setSubjectPetIds: (ids: number[]) => void;
  /** 수정 중인 스토리. 없으면 신규 등록 */
  editingStoryId: number | null;
  /** 수정 시 미디어를 안 바꿨으면 재업로드 없이 이 fileId 사용 */
  existingFileId: number | null;
  sourceUrl: string | null;
  /** 이미지 크롭 결과 */
  croppedDataUrl: string | null;
  /** 원본 위 크롭 박스 (표시 영역 기준 0~1). 다시 들어오면 이 위치로 복원 */
  cropRect: NormalizedCrop | null;
  kind: 'image' | 'video' | null;
  fileName: string;
  texts: StoryTextBox[];
  petTags: StoryPetTag[];
  setMedia: (payload: { sourceUrl: string; kind: 'image' | 'video'; fileName: string }) => void;
  setCrop: (croppedDataUrl: string, cropRect: NormalizedCrop | null) => void;
  beginEditing: (payload: {
    storyId: number;
    fileId: number;
    sourceUrl: string;
    kind: 'image' | 'video';
    fileName: string;
    subjectPetIds: number[];
    texts: StoryTextBox[];
    petTags: StoryPetTag[];
  }) => void;
  clearEdits: () => void;
  setTexts: (texts: StoryTextBox[]) => void;
  upsertText: (box: StoryTextBox) => void;
  removeText: (id: string) => void;
  addPetTag: (tag: Omit<StoryPetTag, 'id'> & { id?: string }) => void;
  removePetTag: (id: string) => void;
  movePetTag: (id: string, x: number, y: number) => void;
  clear: () => void;
};

export const useStoryDraftStore = create<StoryDraftState>((set) => ({
  subjectPetIds: [],
  setSubjectPetIds: (subjectPetIds) => set({ subjectPetIds }),
  editingStoryId: null,
  existingFileId: null,
  sourceUrl: null,
  croppedDataUrl: null,
  cropRect: null,
  kind: null,
  fileName: '',
  texts: [],
  petTags: [],
  setMedia: ({ sourceUrl, kind, fileName }) =>
    set((state) => ({
      subjectPetIds: state.editingStoryId ? state.subjectPetIds : [],
      editingStoryId: state.editingStoryId,
      existingFileId: null,
      sourceUrl,
      kind,
      fileName,
      croppedDataUrl: null,
      cropRect: null,
      texts: state.editingStoryId ? state.texts : [],
      petTags: state.editingStoryId ? state.petTags : [],
    })),
  setCrop: (croppedDataUrl, cropRect) =>
    set((state) => ({
      croppedDataUrl,
      cropRect,
      existingFileId: state.editingStoryId ? null : state.existingFileId,
    })),
  beginEditing: ({
    storyId,
    fileId,
    sourceUrl,
    kind,
    fileName,
    subjectPetIds,
    texts,
    petTags,
  }) =>
    set({
      editingStoryId: storyId,
      existingFileId: fileId,
      sourceUrl,
      croppedDataUrl: kind === 'image' ? sourceUrl : null,
      cropRect: null,
      kind,
      fileName,
      subjectPetIds,
      texts,
      petTags,
    }),
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
          petName: tag.petName,
          x: tag.x,
          y: tag.y,
        },
      ],
    })),
  removePetTag: (id) => set((state) => ({ petTags: state.petTags.filter((t) => t.id !== id) })),
  movePetTag: (id, x, y) =>
    set((state) => ({
      petTags: state.petTags.map((tag) =>
        tag.id === id
          ? {
              ...tag,
              x: Math.min(1, Math.max(0, x)),
              y: Math.min(1, Math.max(0, y)),
            }
          : tag,
      ),
    })),
  clear: () =>
    set({
      subjectPetIds: [],
      editingStoryId: null,
      existingFileId: null,
      sourceUrl: null,
      croppedDataUrl: null,
      cropRect: null,
      kind: null,
      fileName: '',
      texts: [],
      petTags: [],
    }),
}));
