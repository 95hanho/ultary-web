'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import styles from './ImageCropper.module.scss';

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CropResult = {
  source: { x: number; y: number; width: number; height: number };
  display: CropRect;
  natural: { width: number; height: number };
  displaySize: { width: number; height: number };
  dataUrl: string;
  blob: Blob;
};

type ImageCropperProps = {
  src: string;
  /** square: 정사각형 고정 / free: 직사각형 자유 비율 */
  aspect?: 'square' | 'free';
  className?: string;
  onReadyChange?: (ready: boolean) => void;
  cropperRef?: MutableRefObject<{ getResult: () => Promise<CropResult | null> } | null>;
};

type DragMode = 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se';

const MIN_CROP = 80;
/** 휴대폰 세로·가로 최대 비율 (이보다 길쭉하게 자르지 않음) */
const PHONE_ASPECT = 16 / 9;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function clampCrop(rect: CropRect, maxW: number, maxH: number): CropRect {
  let { x, y, width, height } = rect;
  width = clamp(width, MIN_CROP, maxW);
  height = clamp(height, MIN_CROP, maxH);
  x = clamp(x, 0, maxW - width);
  y = clamp(y, 0, maxH - height);
  return { x, y, width, height };
}

/** free 크롭: 프레임 안 + 휴대폰 비율(9:16~16:9) 제한 */
function clampFreeCrop(rect: CropRect, maxW: number, maxH: number): CropRect {
  let { x, y, width, height } = rect;

  width = Math.max(width, MIN_CROP);
  height = Math.max(height, MIN_CROP);

  if (height / width > PHONE_ASPECT) {
    height = width * PHONE_ASPECT;
  }
  if (width / height > PHONE_ASPECT) {
    width = height * PHONE_ASPECT;
  }

  width = clamp(width, MIN_CROP, maxW);
  height = clamp(height, MIN_CROP, maxH);

  if (height / width > PHONE_ASPECT) {
    height = Math.min(height, width * PHONE_ASPECT);
  }
  if (width / height > PHONE_ASPECT) {
    width = Math.min(width, height * PHONE_ASPECT);
  }

  x = clamp(x, 0, Math.max(0, maxW - width));
  y = clamp(y, 0, Math.max(0, maxH - height));
  return { x, y, width, height };
}

/** 크롭 영역 (이동·리사이즈). aspect=square면 정사각 유지 */
export function ImageCropper({
  src,
  aspect = 'square',
  className,
  onReadyChange,
  cropperRef,
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    origin: CropRect;
  } | null>(null);
  const didInitCrop = useRef(false);
  const aspectRef = useRef(aspect);
  aspectRef.current = aspect;

  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [ready, setReady] = useState(false);

  const applyMeasure = useCallback(
    (resetCrop: boolean) => {
      const img = imgRef.current;
      if (!img || !img.naturalWidth) return false;

      const width = img.clientWidth;
      const height = img.clientHeight;
      if (width < 1 || height < 1) return false;

      setDisplaySize({ width, height });
      setNatural({ width: img.naturalWidth, height: img.naturalHeight });

      if (resetCrop || !didInitCrop.current) {
        if (aspectRef.current === 'square') {
          const size = Math.min(width, height) * (2 / 3);
          setCrop({ x: 0, y: 0, width: size, height: size });
        } else {
          setCrop(
            clampFreeCrop(
              {
                x: 0,
                y: 0,
                width: width * (2 / 3),
                height: height * (2 / 3),
              },
              width,
              height,
            ),
          );
        }
        didInitCrop.current = true;
      } else {
        setCrop((prev) => {
          if (aspectRef.current === 'square') {
            const size = clamp(Math.min(prev.width, prev.height), MIN_CROP, Math.min(width, height));
            return clampCrop({ x: prev.x, y: prev.y, width: size, height: size }, width, height);
          }
          return clampFreeCrop(prev, width, height);
        });
      }

      setReady(true);
      onReadyChange?.(true);
      return true;
    },
    [onReadyChange],
  );

  useEffect(() => {
    didInitCrop.current = false;
    setReady(false);
    setCrop({ x: 0, y: 0, width: 0, height: 0 });
    onReadyChange?.(false);

    const img = imgRef.current;
    if (!img) return;

    let cancelled = false;
    const tryMeasure = (reset: boolean) => {
      if (cancelled) return;
      if (!applyMeasure(reset)) {
        requestAnimationFrame(() => {
          if (!cancelled) applyMeasure(reset);
        });
      }
    };

    const onLoad = () => tryMeasure(true);

    if (img.complete && img.naturalWidth > 0) {
      tryMeasure(true);
    } else {
      img.addEventListener('load', onLoad);
    }

    const ro = new ResizeObserver(() => tryMeasure(false));
    ro.observe(img);

    return () => {
      cancelled = true;
      img.removeEventListener('load', onLoad);
      ro.disconnect();
    };
  }, [src, aspect, applyMeasure, onReadyChange]);

  const getResult = useCallback(async (): Promise<CropResult | null> => {
    if (!ready || !crop.width || !crop.height || !natural.width || !displaySize.width) {
      return null;
    }

    const scaleX = natural.width / displaySize.width;
    const scaleY = natural.height / displaySize.height;
    const sourceW = Math.round(crop.width * scaleX);
    const sourceH = Math.round(crop.height * scaleY);
    const sourceX = Math.round(crop.x * scaleX);
    const sourceY = Math.round(crop.y * scaleY);

    const canvas = document.createElement('canvas');
    canvas.width = sourceW;
    canvas.height = sourceH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const image = new window.Image();
    image.src = src;
    await new Promise<void>((resolve, reject) => {
      if (image.complete && image.naturalWidth > 0) {
        resolve();
        return;
      }
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('crop image load failed'));
    });

    const displayScale = sourceW / crop.width;
    const r = Math.min(5 * displayScale, sourceW / 2, sourceH / 2);
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(sourceW, 0, sourceW, sourceH, r);
    ctx.arcTo(sourceW, sourceH, 0, sourceH, r);
    ctx.arcTo(0, sourceH, 0, 0, r);
    ctx.arcTo(0, 0, sourceW, 0, r);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    );
    if (!blob) return null;

    return {
      source: { x: sourceX, y: sourceY, width: sourceW, height: sourceH },
      display: { ...crop },
      natural: { ...natural },
      displaySize: { ...displaySize },
      dataUrl: canvas.toDataURL('image/png'),
      blob,
    };
  }, [ready, crop, natural, displaySize, src]);

  useEffect(() => {
    if (!cropperRef) return;
    cropperRef.current = { getResult };
    return () => {
      cropperRef.current = null;
    };
  }, [cropperRef, getResult]);

  const onPointerDown = (mode: DragMode) => (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...crop },
    };

    const onMove = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;
      const { origin, mode: dragMode } = drag;
      const maxW = displaySize.width;
      const maxH = displaySize.height;
      if (!maxW || !maxH) return;

      if (dragMode === 'move') {
        setCrop(
          clampCrop(
            {
              x: origin.x + dx,
              y: origin.y + dy,
              width: origin.width,
              height: origin.height,
            },
            maxW,
            maxH,
          ),
        );
        return;
      }

      const lockSquare = aspectRef.current === 'square';

      if (lockSquare) {
        let nextX = origin.x;
        let nextY = origin.y;
        let nextSize = origin.width;

        if (dragMode === 'resize-se') {
          nextSize = origin.width + Math.max(dx, dy);
        } else if (dragMode === 'resize-nw') {
          nextSize = origin.width - Math.max(dx, dy);
        } else if (dragMode === 'resize-ne') {
          nextSize = origin.width + Math.max(dx, -dy);
        } else if (dragMode === 'resize-sw') {
          nextSize = origin.width + Math.max(-dx, dy);
        }

        nextSize = clamp(nextSize, MIN_CROP, Math.min(maxW, maxH));

        if (dragMode === 'resize-nw') {
          nextX = origin.x + origin.width - nextSize;
          nextY = origin.y + origin.height - nextSize;
        } else if (dragMode === 'resize-ne') {
          nextY = origin.y + origin.height - nextSize;
        } else if (dragMode === 'resize-sw') {
          nextX = origin.x + origin.width - nextSize;
        }

        if (nextX < 0) {
          nextSize += nextX;
          nextX = 0;
        }
        if (nextY < 0) {
          nextSize += nextY;
          nextY = 0;
        }
        if (nextX + nextSize > maxW) nextSize = maxW - nextX;
        if (nextY + nextSize > maxH) nextSize = maxH - nextY;

        nextSize = Math.max(MIN_CROP, nextSize);
        setCrop(
          clampCrop({ x: nextX, y: nextY, width: nextSize, height: nextSize }, maxW, maxH),
        );
        return;
      }

      let nextX = origin.x;
      let nextY = origin.y;
      let nextW = origin.width;
      let nextH = origin.height;

      if (dragMode === 'resize-se') {
        nextW = origin.width + dx;
        nextH = origin.height + dy;
      } else if (dragMode === 'resize-nw') {
        nextW = origin.width - dx;
        nextH = origin.height - dy;
        nextX = origin.x + dx;
        nextY = origin.y + dy;
      } else if (dragMode === 'resize-ne') {
        nextW = origin.width + dx;
        nextH = origin.height - dy;
        nextY = origin.y + dy;
      } else if (dragMode === 'resize-sw') {
        nextW = origin.width - dx;
        nextH = origin.height + dy;
        nextX = origin.x + dx;
      }

      if (nextW < MIN_CROP) {
        if (dragMode === 'resize-nw' || dragMode === 'resize-sw') {
          nextX = origin.x + origin.width - MIN_CROP;
        }
        nextW = MIN_CROP;
      }
      if (nextH < MIN_CROP) {
        if (dragMode === 'resize-nw' || dragMode === 'resize-ne') {
          nextY = origin.y + origin.height - MIN_CROP;
        }
        nextH = MIN_CROP;
      }

      if (nextX < 0) {
        nextW += nextX;
        nextX = 0;
      }
      if (nextY < 0) {
        nextH += nextY;
        nextY = 0;
      }
      if (nextX + nextW > maxW) nextW = maxW - nextX;
      if (nextY + nextH > maxH) nextH = maxH - nextY;

      setCrop(clampFreeCrop({ x: nextX, y: nextY, width: nextW, height: nextH }, maxW, maxH));
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  return (
    <div className={`${styles.frame} ${className ?? ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} src={src} alt="" className={styles.image} draggable={false} />

      {ready && crop.width > 0 && crop.height > 0 ? (
        <div
          className={styles.overlay}
          style={{ width: displaySize.width, height: displaySize.height }}
        >
          <div
            className={styles.cropBox}
            style={{
              left: crop.x,
              top: crop.y,
              width: crop.width,
              height: crop.height,
            }}
            onPointerDown={onPointerDown('move')}
          >
            <span
              className={`${styles.handle} ${styles.handleNw}`}
              onPointerDown={onPointerDown('resize-nw')}
            />
            <span
              className={`${styles.handle} ${styles.handleNe}`}
              onPointerDown={onPointerDown('resize-ne')}
            />
            <span
              className={`${styles.handle} ${styles.handleSw}`}
              onPointerDown={onPointerDown('resize-sw')}
            />
            <span
              className={`${styles.handle} ${styles.handleSe}`}
              onPointerDown={onPointerDown('resize-se')}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
