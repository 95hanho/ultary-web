import type { FeedVisibility } from '@/types/enums';
import type { NormalizedCrop } from '@/lib/write/crop-rect';
import { create } from 'zustand';

export type WriteDraftItem = {
  id: string;
  /** Existing slot in edit mode. File stays fixed; display order can change. */
  feedMediaId?: number;
  kind: 'image' | 'video';
  fileName: string;
  mimeType: string;
  /** 원본 (data URL 또는 blob URL) */
  sourceUrl: string;
  /** 이미지 크롭 결과 data URL */
  croppedDataUrl?: string;
  /** 원본 위 크롭 박스 (표시 영역 기준 0~1) */
  cropRect?: NormalizedCrop | null;
  /** 사진 위 펫언급 태그 (좌표 0~1) */
  petTags?: WritePhotoPetTag[];
};

export type WritePhotoPetTag = {
  id: string;
  /** `@choco_01` */
  petName: string;
  petId?: number;
  /** 이미지 기준 가로 비율 0~1 */
  x: number;
  /** 이미지 기준 세로 비율 0~1 */
  y: number;
};

type WriteDraftState = {
  subjectPetIds: number[];
  setSubjectPetIds: (ids: number[]) => void;
  items: WriteDraftItem[];
  caption: string;
  visibility: FeedVisibility | null;
  setVisibility: (visibility: FeedVisibility) => void;
  editingFeedId: string | null;
  beginEditing: (
    feedId: string,
    items: WriteDraftItem[],
    caption: string,
    visibility: FeedVisibility,
    subjectPetIds?: number[],
  ) => void;
  /** 사진 설정에서 보고 있던 장. 작성 화면에서 돌아오면 이 장부터 */
  cropIndex: number;
  setItems: (items: WriteDraftItem[]) => void;
  /** 작성/수정 화면에서 사진 썸네일 순서 변경. editingFeedId 유지 */
  reorderItems: (fromIndex: number, toIndex: number) => void;
  setCropIndex: (cropIndex: number) => void;
  updateCrop: (id: string, croppedDataUrl: string, cropRect: NormalizedCrop | null) => void;
  setCaption: (caption: string) => void;
  addPetTag: (itemId: string, tag: Omit<WritePhotoPetTag, 'id'> & { id?: string }) => void;
  removePetTag: (itemId: string, tagId: string) => void;
  movePetTag: (itemId: string, tagId: string, x: number, y: number) => void;
  clear: () => void;
};

/** 게시글 작성 중 임시 미디어·본문 (새로고침 시 초기화) */
export const useWriteDraftStore = create<WriteDraftState>((set) => ({
  subjectPetIds: [],
  setSubjectPetIds: (subjectPetIds) => set({ subjectPetIds }),
  items: [],
  caption: '',
  visibility: 'PUBLIC',
  setVisibility: (visibility) => set({ visibility }),
  editingFeedId: null,
  beginEditing: (feedId, items, caption, visibility, subjectPetIds = []) =>
    set({ subjectPetIds, editingFeedId: feedId, items, caption, visibility, cropIndex: 0 }),
  cropIndex: 0,
  setItems: (items) =>
    set((state) => ({
      items,
      cropIndex: 0,
      editingFeedId: null,
      subjectPetIds: state.editingFeedId ? [] : state.subjectPetIds,
      visibility: state.editingFeedId ? 'PUBLIC' : state.visibility,
      caption: state.editingFeedId ? '' : state.caption,
    })),
  reorderItems: (fromIndex, toIndex) =>
    set((state) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.items.length ||
        toIndex >= state.items.length
      ) {
        return state;
      }
      const next = [...state.items];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return state;
      next.splice(toIndex, 0, moved);
      return { items: next };
    }),
  setCropIndex: (cropIndex) => set({ cropIndex }),
  updateCrop: (id, croppedDataUrl, cropRect) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, croppedDataUrl, cropRect } : item,
      ),
    })),
  setCaption: (caption) => set({ caption }),
  addPetTag: (itemId, tag) =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== itemId) return item;
        const next: WritePhotoPetTag = {
          id: tag.id ?? `pt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          petName: tag.petName,
          petId: tag.petId,
          x: tag.x,
          y: tag.y,
        };
        return { ...item, petTags: [...(item.petTags ?? []), next] };
      }),
    })),
  removePetTag: (itemId, tagId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id !== itemId
          ? item
          : { ...item, petTags: (item.petTags ?? []).filter((t) => t.id !== tagId) },
      ),
    })),
  movePetTag: (itemId, tagId, x, y) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id !== itemId
          ? item
          : {
              ...item,
              petTags: (item.petTags ?? []).map((tag) =>
                tag.id === tagId
                  ? {
                      ...tag,
                      x: Math.min(1, Math.max(0, x)),
                      y: Math.min(1, Math.max(0, y)),
                    }
                  : tag,
              ),
            },
      ),
    })),
  clear: () =>
    set({
      subjectPetIds: [],
      items: [],
      caption: '',
      visibility: 'PUBLIC',
      cropIndex: 0,
      editingFeedId: null,
    }),
}));
