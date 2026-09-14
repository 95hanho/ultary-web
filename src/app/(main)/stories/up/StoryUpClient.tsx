'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { PhotoTagAccountSearch } from '@/components/search/PhotoTagAccountSearch';
import {
  useStoryDraftStore,
  type StoryTextBox,
} from '@/stores/story-draft.store';
import { useModalStore } from '@/stores/modal.store';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import styles from './story-up.module.scss';

type EditorMode = 'text' | 'tag';

const MAX_STORY_TEXTS = 2;
const DEFAULT_TEXT_COLOR = '#ffffff';

const TEXT_COLORS = [
  '#ffffff',
  '#000000',
  '#ff0000',
  '#ffa600',
  '#e1ff00',
  '#00ff44',
  '#0015ff',
  '#e01eea',
] as const;

function newTextId() {
  return `txt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function textDecorationOf(box: StoryTextBox) {
  return (
    [box.underline ? 'underline' : null, box.strike ? 'line-through' : null]
      .filter(Boolean)
      .join(' ') || 'none'
  );
}

/** 스토리 업 — 텍스트 작성 / 태그 달기 */
export default function StoryUpClient() {
  const router = useRouter();
  const sourceUrl = useStoryDraftStore((s) => s.sourceUrl);
  const croppedDataUrl = useStoryDraftStore((s) => s.croppedDataUrl);
  const kind = useStoryDraftStore((s) => s.kind);
  const texts = useStoryDraftStore((s) => s.texts);
  const petTags = useStoryDraftStore((s) => s.petTags);
  const upsertText = useStoryDraftStore((s) => s.upsertText);
  const removeText = useStoryDraftStore((s) => s.removeText);
  const addPetTag = useStoryDraftStore((s) => s.addPetTag);
  const removePetTag = useStoryDraftStore((s) => s.removePetTag);
  const clear = useStoryDraftStore((s) => s.clear);
  const openModal = useModalStore((s) => s.open);

  const displayUrl =
    kind === 'image' ? (croppedDataUrl ?? sourceUrl) : sourceUrl;

  const [mode, setMode] = useState<EditorMode>('text');
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [colorOpen, setColorOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pendingPoint = useRef<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textToolsRef = useRef<HTMLDivElement>(null);
  const activeTextIdRef = useRef<string | null>(null);
  const dragSession = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const suppressStageClick = useRef(false);

  const activeText = texts.find((t) => t.id === activeTextId) ?? null;
  activeTextIdRef.current = activeTextId;

  const deactivateTextEditing = () => {
    const id = activeTextIdRef.current;
    if (!id) return;
    const current = useStoryDraftStore.getState().texts.find((t) => t.id === id);
    if (current && !current.text.trim()) {
      removeText(id);
    }
    setActiveTextId(null);
    setColorOpen(false);
  };

  useEffect(() => {
    if (!useStoryDraftStore.getState().sourceUrl) {
      router.replace('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTextId && mode === 'text') {
      inputRef.current?.focus();
    }
  }, [activeTextId, mode]);

  /** 작성 중: 해당 박스·포맷 툴 외 클릭은 비활성화만, 다른 기능은 막음 */
  useEffect(() => {
    if (!activeTextId || mode !== 'text') return;

    const onPointerDownCapture = (e: globalThis.PointerEvent) => {
      if (dragSession.current) return;
      const target = e.target;
      if (!(target instanceof Node)) return;

      const activeBox = document.querySelector(`[data-story-text-id="${activeTextId}"]`);
      if (activeBox?.contains(target)) return;
      if (textToolsRef.current?.contains(target)) return;

      e.preventDefault();
      e.stopPropagation();
      deactivateTextEditing();
    };

    document.addEventListener('pointerdown', onPointerDownCapture, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDownCapture, true);
    };
    // deactivateTextEditing는 최신 removeText를 쓰도록 의존에 포함
  }, [activeTextId, mode, removeText]);

  useEffect(() => {
    const onMove = (e: globalThis.PointerEvent) => {
      const session = dragSession.current;
      const stage = stageRef.current;
      if (!session || !stage) return;
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dx = (e.clientX - session.startClientX) / rect.width;
      const dy = (e.clientY - session.startClientY) / rect.height;
      const box = useStoryDraftStore.getState().texts.find((t) => t.id === session.id);
      if (!box) return;
      suppressStageClick.current = true;
      upsertText({
        ...box,
        x: Math.min(1, Math.max(0, session.originX + dx)),
        y: Math.min(1, Math.max(0, session.originY + dy)),
      });
    };

    const onUp = () => {
      dragSession.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [upsertText]);

  const handleBack = () => {
    router.push('/stories/up/crop');
  };

  const handleSubmit = () => {
    console.log('[story-up] submit', {
      kind,
      texts,
      petTags,
    });
    clear();
    router.push('/');
  };

  const pointFromEvent = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  };

  const handleStageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (suppressStageClick.current) {
      suppressStageClick.current = false;
      return;
    }

    // 작성 중 바깥 클릭은 capture에서 처리됨. 여기 오면 비활성 상태.
    if (activeTextId && mode === 'text') {
      deactivateTextEditing();
      return;
    }

    const point = pointFromEvent(e.clientX, e.clientY);
    if (!point) return;

    if (mode === 'tag') {
      pendingPoint.current = point;
      setActiveTextId(null);
      setColorOpen(false);
      setSearchOpen(true);
      return;
    }

    if (texts.length >= MAX_STORY_TEXTS) {
      openModal({
        variant: 'alert',
        title: '알림창',
        content: '텍스트는 최대 2개까지 추가할 수 있어요.',
        showCloseButton: true,
      });
      return;
    }

    const id = newTextId();
    const box: StoryTextBox = {
      id,
      x: point.x,
      y: point.y,
      text: '',
      bold: false,
      underline: false,
      strike: false,
      color: DEFAULT_TEXT_COLOR,
    };
    upsertText(box);
    setActiveTextId(id);
    setColorOpen(false);
  };

  const patchActive = (patch: Partial<StoryTextBox>) => {
    const current = useStoryDraftStore
      .getState()
      .texts.find((t) => t.id === activeTextId);
    if (!current) return;
    upsertText({ ...current, ...patch });
  };

  const startTextDrag = (box: StoryTextBox, e: PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (mode !== 'text') return;
    setActiveTextId(box.id);
    setColorOpen(false);
    dragSession.current = {
      id: box.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: box.x,
      originY: box.y,
    };
  };

  const handleSelectPet = (petTag: string) => {
    const point = pendingPoint.current;
    if (!point) {
      setSearchOpen(false);
      return;
    }
    addPetTag({ petTag, x: point.x, y: point.y });
    pendingPoint.current = null;
    setSearchOpen(false);
  };

  if (!displayUrl || !kind) {
    return (
      <div className={styles.shell}>
        <PageHeader title="스토리 업" onBack={() => router.back()} />
        <main className={styles.main}>
          <p className={styles.empty}>스토리 미디어를 불러오는 중…</p>
        </main>
        <FooterMenu />
      </div>
    );
  }

  const showFormat = mode === 'text' && Boolean(activeText);

  return (
    <div className={styles.shell}>
      <PageHeader title="스토리 업" onBack={handleBack} onSubmit={handleSubmit} submitLabel="게시" />

      <main className={styles.main}>
        <div className={styles.scroll}>
          <div className={styles.stageWrap}>
            <div
              ref={stageRef}
              className={styles.stage}
              role="presentation"
              onClick={handleStageClick}
            >
              {kind === 'video' ? (
                <video
                  className={styles.photo}
                  src={displayUrl}
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayUrl} alt="" className={styles.photo} draggable={false} />
              )}

              {petTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={styles.petTagBox}
                  style={{ left: `${tag.x * 100}%`, top: `${tag.y * 100}%` }}
                  aria-label={`${tag.petTag} 삭제`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removePetTag(tag.id);
                  }}
                >
                  {tag.petTag}
                </button>
              ))}

              {texts.map((box) => {
                const isActive = box.id === activeTextId && mode === 'text';
                const textStyle = {
                  color: box.color,
                  fontWeight: box.bold ? 700 : 400,
                  textDecoration: textDecorationOf(box),
                } as const;

                return (
                  <div
                    key={box.id}
                    data-story-text-id={box.id}
                    className={clsx(styles.textBox, isActive && styles.textBoxActive)}
                    style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (mode !== 'text') return;
                      if (activeTextId && activeTextId !== box.id) return;
                      setActiveTextId(box.id);
                      setColorOpen(false);
                    }}
                  >
                    <div
                      className={styles.textDragHandle}
                      aria-label="텍스트 이동"
                      onPointerDown={(e) => startTextDrag(box, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className={styles.textBody}>
                      <span
                        className={clsx(
                          styles.textMeasure,
                          isActive && styles.textMeasureHidden,
                        )}
                        style={textStyle}
                        aria-hidden={isActive}
                      >
                        {box.text || ' '}
                      </span>
                      {isActive ? (
                        <input
                          ref={inputRef}
                          className={styles.textInput}
                          style={{
                            ...textStyle,
                            caretColor: box.color,
                          }}
                          value={box.text}
                          onChange={(e) => patchActive({ text: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              if (!box.text.trim()) removeText(box.id);
                              setActiveTextId(null);
                              setColorOpen(false);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="스토리 텍스트"
                        />
                      ) : null}
                    </div>
                    {isActive ? (
                      <button
                        type="button"
                        className={styles.textDeleteBtn}
                        aria-label="텍스트 삭제"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeText(box.id);
                          setActiveTextId(null);
                          setColorOpen(false);
                        }}
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.toolbarDock}>
          <div ref={textToolsRef} className={styles.textTools}>
            {showFormat && colorOpen ? (
              <div className={styles.colorPalette} role="listbox" aria-label="글자 색상">
                {TEXT_COLORS.map((color) => {
                  const active = activeText?.color.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      className={clsx(styles.colorSwatch, active && styles.colorSwatchActive)}
                      style={{ background: color }}
                      aria-label={color}
                      aria-selected={active}
                      onClick={() => {
                        patchActive({ color });
                        setColorOpen(false);
                      }}
                    />
                  );
                })}
              </div>
            ) : null}

            <div className={styles.formatSlot}>
              {showFormat ? (
                <div className={styles.formatBar}>
                  <button
                    type="button"
                    className={clsx(styles.formatBtn, activeText?.bold && styles.formatBtnActive)}
                    aria-pressed={activeText?.bold}
                    onClick={() => patchActive({ bold: !activeText?.bold })}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className={clsx(
                      styles.formatBtn,
                      styles.formatUnderline,
                      activeText?.underline && styles.formatBtnActive,
                    )}
                    aria-pressed={activeText?.underline}
                    onClick={() => patchActive({ underline: !activeText?.underline })}
                  >
                    U
                  </button>
                  <button
                    type="button"
                    className={clsx(
                      styles.formatBtn,
                      styles.formatStrike,
                      activeText?.strike && styles.formatBtnActive,
                    )}
                    aria-pressed={activeText?.strike}
                    onClick={() => patchActive({ strike: !activeText?.strike })}
                  >
                    S
                  </button>
                  <button
                    type="button"
                    className={clsx(styles.formatBtn, colorOpen && styles.formatBtnActive)}
                    aria-label="색상 선택"
                    aria-pressed={colorOpen}
                    onClick={() => setColorOpen((v) => !v)}
                  >
                    <span
                      className={styles.colorToggleDot}
                      style={{ background: activeText?.color ?? DEFAULT_TEXT_COLOR }}
                    />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.modeToggle}>
            <button
              type="button"
              className={clsx(
                styles.modeBtn,
                styles.modeBtnText,
                mode === 'text' && styles.modeBtnActive,
              )}
              aria-pressed={mode === 'text'}
              onClick={() => {
                setMode('text');
                setSearchOpen(false);
              }}
            >
              T
            </button>
            <button
              type="button"
              className={clsx(
                styles.modeBtn,
                styles.modeBtnTag,
                mode === 'tag' && styles.modeBtnActive,
              )}
              aria-pressed={mode === 'tag'}
              onClick={() => {
                setMode('tag');
                setActiveTextId(null);
                setColorOpen(false);
              }}
            >
              @
            </button>
          </div>
        </div>
      </main>

      <FooterMenu />

      <PhotoTagAccountSearch
        open={searchOpen}
        onSelect={handleSelectPet}
        onClose={() => {
          pendingPoint.current = null;
          setSearchOpen(false);
        }}
      />
    </div>
  );
}
