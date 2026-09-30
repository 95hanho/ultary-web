import type { NormalizedCrop } from '@/lib/write/crop-rect';
import { create } from 'zustand';

export type WriteDraftItem = {
  id: string;
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
  petTag: string;
  petId?: number;
  /** 이미지 기준 가로 비율 0~1 */
  x: number;
  /** 이미지 기준 세로 비율 0~1 */
  y: number;
};

type WriteDraftState = {
  items: WriteDraftItem[];
  caption: string;
  /** 사진 설정에서 보고 있던 장. 작성 화면에서 돌아오면 이 장부터 */
  cropIndex: number;
  setItems: (items: WriteDraftItem[]) => void;
  setCropIndex: (cropIndex: number) => void;
  updateCrop: (id: string, croppedDataUrl: string, cropRect: NormalizedCrop | null) => void;
  setCaption: (caption: string) => void;
  addPetTag: (itemId: string, tag: Omit<WritePhotoPetTag, 'id'> & { id?: string }) => void;
  removePetTag: (itemId: string, tagId: string) => void;
  clear: () => void;
};

/** 게시글 작성 중 임시 미디어·본문 (새로고침 시 초기화) */
export const useWriteDraftStore = create<WriteDraftState>((set) => ({
  items: [],
  caption: '',
  cropIndex: 0,
  setItems: (items) => set({ items, cropIndex: 0 }),
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
          petTag: tag.petTag,
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
  clear: () => set({ items: [], caption: '', cropIndex: 0 }),
}));
