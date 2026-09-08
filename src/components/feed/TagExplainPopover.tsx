'use client';

import type { TagExplain } from '@/lib/mock/tags';
import clsx from 'clsx';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './TagExplainPopover.module.scss';

const VIEW_MARGIN = 10;
const GAP = 10;
const FADE_MS = 200;
const CLOSE_GUARD_MS = 400;

export type TagExplainMode = 'preview' | 'active';

type TagExplainPopoverProps = {
  data: TagExplain;
  anchorRect: DOMRect;
  mode: TagExplainMode;
  closeRequested?: boolean;
  onModeChange: (mode: TagExplainMode) => void;
  onClose: () => void;
  onPopoverEnter?: () => void;
  onPopoverLeave?: () => void;
};

type Placement = 'above' | 'below';

type Coords = {
  top: number;
  left: number;
  placement: Placement;
  caretLeft: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeCoords(el: HTMLElement, anchorRect: DOMRect): Coords {
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceAbove = anchorRect.top - VIEW_MARGIN;
  const spaceBelow = vh - anchorRect.bottom - VIEW_MARGIN;
  const need = height + GAP;

  let placement: Placement = 'above';
  if (spaceAbove >= need) placement = 'above';
  else if (spaceBelow >= need) placement = 'below';
  else placement = spaceAbove >= spaceBelow ? 'above' : 'below';

  const preferredLeft = anchorRect.left + anchorRect.width / 2 - width / 2;
  const left = clamp(preferredLeft, VIEW_MARGIN, vw - VIEW_MARGIN - width);
  const top =
    placement === 'above'
      ? clamp(anchorRect.top - GAP - height, VIEW_MARGIN, vh - VIEW_MARGIN - height)
      : clamp(anchorRect.bottom + GAP, VIEW_MARGIN, vh - VIEW_MARGIN - height);

  const caretLeft = clamp(anchorRect.left + anchorRect.width / 2 - left, 16, width - 16);

  return { top, left, placement, caretLeft };
}

/** 해시태그 설명 팝오버 (피드 캡션 태그 클릭/호버) */
export function TagExplainPopover({
  data,
  anchorRect,
  mode,
  closeRequested = false,
  onModeChange,
  onClose,
  onPopoverEnter,
  onPopoverLeave,
}: TagExplainPopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ignoreCloseUntilRef = useRef(Date.now() + CLOSE_GUARD_MS);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [exiting, setExiting] = useState(false);
  const [show, setShow] = useState(false);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const place = () => setCoords(computeCoords(el, anchorRect));
    place();

    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [anchorRect, data]);

  // 마운트/태그 변경 시에만 페이드 인 (mode 변경 시 깜빡임 방지)
  useLayoutEffect(() => {
    setShow(false);
    setExiting(false);
    ignoreCloseUntilRef.current = Date.now() + CLOSE_GUARD_MS;
    const raf = window.requestAnimationFrame(() => setShow(true));
    return () => window.cancelAnimationFrame(raf);
  }, [data.tag]);

  useEffect(() => {
    if (!closeRequested || exiting) return;
    setExiting(true);
  }, [closeRequested, exiting]);

  useEffect(() => {
    if (!exiting) return;
    const timer = window.setTimeout(() => onClose(), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [exiting, onClose]);

  useEffect(() => {
    const guarded = () => Date.now() < ignoreCloseUntilRef.current;

    const onPointerDown = (e: PointerEvent) => {
      if (guarded()) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if ((target as Element).closest?.('[data-tag-trigger="true"]')) return;
      setExiting(true);
    };

    const onScroll = (e: Event) => {
      if (guarded()) return;
      const target = e.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      setExiting(true);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExiting(true);
    };

    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('scroll', onScroll, true);
      document.addEventListener('keydown', onKey);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const hash = data.tag.startsWith('#') ? data.tag : `#${data.tag}`;
  const opacity = exiting || !show || !coords ? 0 : mode === 'preview' ? 0.55 : 1;

  return createPortal(
    <div className={styles.overlay} aria-hidden={mode === 'preview'}>
      <div
        ref={rootRef}
        role="dialog"
        aria-modal={mode === 'active'}
        aria-label={`${data.title} 태그 설명`}
        className={styles.root}
        style={{
          top: coords?.top ?? 0,
          left: coords?.left ?? 0,
          opacity,
          // 측정 전에는 화면에 안 보이게만 (opacity와 별개로 레이아웃은 유지)
          visibility: coords ? 'visible' : 'hidden',
          ['--caret-left' as string]: `${coords?.caretLeft ?? 50}px`,
        }}
        onMouseEnter={() => {
          if (exiting) return;
          onPopoverEnter?.();
          if (mode === 'preview') onModeChange('active');
        }}
        onMouseLeave={() => {
          if (exiting) return;
          onPopoverLeave?.();
        }}
        onClick={() => {
          if (exiting) return;
          onModeChange('active');
        }}
      >
        <span
          className={clsx(
            styles.caret,
            coords?.placement === 'above' ? styles.caretBelow : styles.caretAbove,
          )}
          aria-hidden
        />

        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>{data.title}</h2>
            <span className={styles.tagLabel}>{hash}</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="닫기"
            onClick={(e) => {
              e.stopPropagation();
              setExiting(true);
            }}
          >
            <X size={24} strokeWidth={1.75} />
          </button>
        </div>

        <div className={styles.body}>
          <Image
            src={data.imageUrl}
            alt=""
            width={200}
            height={200}
            className={styles.image}
          />
          <div className={styles.textWrap}>
            <p className={styles.description}>{data.description}</p>
            {data.linkUrl ? (
              <a
                href={data.linkUrl}
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {data.linkLabel ?? '→관련 링크 보기'}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
