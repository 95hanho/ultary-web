/** 표시 이미지 기준 크롭 영역 (0~1) */
export type NormalizedCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function normalizedCropOf(
  display: { x: number; y: number; width: number; height: number },
  displaySize: { width: number; height: number },
): NormalizedCrop | null {
  if (displaySize.width <= 0 || displaySize.height <= 0) return null;
  if (display.width <= 0 || display.height <= 0) return null;
  return {
    x: display.x / displaySize.width,
    y: display.y / displaySize.height,
    width: display.width / displaySize.width,
    height: display.height / displaySize.height,
  };
}
