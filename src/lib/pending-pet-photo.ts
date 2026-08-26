const STORAGE_KEY = 'ultary:pending-pet-photo';

export type PendingPetPhoto = {
  petId: string;
  dataUrl: string;
  fileName: string;
  mimeType: string;
};

/** 파일 선택 직후 크롭 페이지로 넘길 임시 이미지 */
export function setPendingPetPhoto(photo: PendingPetPhoto) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(photo));
}

export function getPendingPetPhoto(): PendingPetPhoto | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingPetPhoto;
  } catch {
    return null;
  }
}

export function clearPendingPetPhoto() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('이미지를 읽을 수 없습니다.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('이미지를 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });
}
