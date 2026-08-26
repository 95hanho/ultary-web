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
  size: number;
};

export type CropResult = {
  source: { x: number; y: number; size: number };
  display: CropRect;
  natural: { width: number; height: number };
  displaySize: { width: number; height: number };
  dataUrl: string;
  blob: Blob;
};

type ImageCropperProps = {
  src: string;
  className?: string;
  onReadyChange?: (ready: boolean) => void;
  cropperRef?: MutableRefObject<{ getResult: () => Promise<CropResult | null> } | null>;
};

type DragMode = 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se';

const MIN_CROP = 80;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** 정사각형 크롭 영역 (이동·리사이즈). 초기: (0,0) + min(w,h) */
export function ImageCropper({ src, className, onReadyChange, cropperRef }: ImageCropperProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    origin: CropRect;
  } | null>(null);
  const didInitCrop = useRef(false);

  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, size: 0 });
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
        const size = Math.min(width, height) * (2 / 3);
        setCrop({ x: 0, y: 0, size });
        didInitCrop.current = true;
      } else {
        setCrop((prev) => {
          const size = clamp(prev.size, MIN_CROP, Math.min(width, height));
          return {
            x: clamp(prev.x, 0, width - size),
            y: clamp(prev.y, 0, height - size),
            size,
          };
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
    setCrop({ x: 0, y: 0, size: 0 });
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
  }, [src, applyMeasure, onReadyChange]);

  const getResult = useCallback(async (): Promise<CropResult | null> => {
    if (!ready || !crop.size || !natural.width || !displaySize.width) return null;

    const scaleX = natural.width / displaySize.width;
    const scaleY = natural.height / displaySize.height;
    const sourceSize = Math.round(crop.size * scaleX);
    const sourceX = Math.round(crop.x * scaleX);
    const sourceY = Math.round(crop.y * scaleY);

    const canvas = document.createElement('canvas');
    canvas.width = sourceSize;
    canvas.height = sourceSize;
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

    ctx.beginPath();
    const r = Math.min(5 * (sourceSize / crop.size), sourceSize / 2);
    const s = sourceSize;
    ctx.moveTo(r, 0);
    ctx.arcTo(s, 0, s, s, r);
    ctx.arcTo(s, s, 0, s, r);
    ctx.arcTo(0, s, 0, 0, r);
    ctx.arcTo(0, 0, s, 0, r);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      sourceSize,
      sourceSize,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    );
    if (!blob) return null;

    return {
      source: { x: sourceX, y: sourceY, size: sourceSize },
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
        setCrop({
          x: clamp(origin.x + dx, 0, maxW - origin.size),
          y: clamp(origin.y + dy, 0, maxH - origin.size),
          size: origin.size,
        });
        return;
      }

      let nextX = origin.x;
      let nextY = origin.y;
      let nextSize = origin.size;

      if (dragMode === 'resize-se') {
        nextSize = origin.size + Math.max(dx, dy);
      } else if (dragMode === 'resize-nw') {
        nextSize = origin.size - Math.max(dx, dy);
      } else if (dragMode === 'resize-ne') {
        nextSize = origin.size + Math.max(dx, -dy);
      } else if (dragMode === 'resize-sw') {
        nextSize = origin.size + Math.max(-dx, dy);
      }

      nextSize = clamp(nextSize, MIN_CROP, Math.min(maxW, maxH));

      if (dragMode === 'resize-nw') {
        nextX = origin.x + origin.size - nextSize;
        nextY = origin.y + origin.size - nextSize;
      } else if (dragMode === 'resize-ne') {
        nextY = origin.y + origin.size - nextSize;
      } else if (dragMode === 'resize-sw') {
        nextX = origin.x + origin.size - nextSize;
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
      nextX = clamp(nextX, 0, maxW - nextSize);
      nextY = clamp(nextY, 0, maxH - nextSize);

      setCrop({ x: nextX, y: nextY, size: nextSize });
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
    <div ref={frameRef} className={`${styles.frame} ${className ?? ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} src={src} alt="" className={styles.image} draggable={false} />

      {ready && crop.size > 0 ? (
        <div
          className={styles.overlay}
          style={{ width: displaySize.width, height: displaySize.height }}
        >
          <div
            className={styles.cropBox}
            style={{
              left: crop.x,
              top: crop.y,
              width: crop.size,
              height: crop.size,
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
