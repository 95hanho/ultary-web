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
  /** 사진 위 펫언급 태그 (좌표 0~1) */
  petTags?: WritePhotoPetTag[];
};

export type WritePhotoPetTag = {
  id: string;
  /** `@choco_01` */
  petTag: string;
  /** 이미지 기준 가로 비율 0~1 */
  x: number;
  /** 이미지 기준 세로 비율 0~1 */
  y: number;
};

type WriteDraftState = {
  items: WriteDraftItem[];
  caption: string;
  setItems: (items: WriteDraftItem[]) => void;
  updateCrop: (id: string, croppedDataUrl: string) => void;
  setCaption: (caption: string) => void;
  addPetTag: (itemId: string, tag: Omit<WritePhotoPetTag, 'id'> & { id?: string }) => void;
  removePetTag: (itemId: string, tagId: string) => void;
  clear: () => void;
};

/** 게시글 작성 중 임시 미디어·본문 (새로고침 시 초기화) */
export const useWriteDraftStore = create<WriteDraftState>((set) => ({
  items: [],
  caption: '',
  setItems: (items) => set({ items }),
  updateCrop: (id, croppedDataUrl) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, croppedDataUrl } : item,
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
  clear: () => set({ items: [], caption: '' }),
}));
