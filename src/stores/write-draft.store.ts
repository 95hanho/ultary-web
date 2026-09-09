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
};

type WriteDraftState = {
  items: WriteDraftItem[];
  caption: string;
  setItems: (items: WriteDraftItem[]) => void;
  updateCrop: (id: string, croppedDataUrl: string) => void;
  setCaption: (caption: string) => void;
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
  clear: () => set({ items: [], caption: '' }),
}));
