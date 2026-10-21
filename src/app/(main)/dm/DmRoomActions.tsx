'use client';

import { bffDelete } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { useModalStore } from '@/stores/modal.store';
import { Ellipsis, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './dm.module.scss';

export function DmRoomActions({
  roomId,
  nickname,
  onDeleted,
}: {
  roomId: string;
  nickname: string;
  onDeleted: (roomId: string) => void;
}) {
  const openModal = useModalStore((state) => state.open);
  const [place, setPlace] = useState<{ top: number; left: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!place) return;
    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const outside = (event: PointerEvent) => {
      const target = event.target;
      if (
        !(target instanceof Node) ||
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      )
        return;
      setPlace(null);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Tab') {
        setPlace(null);
        if (event.key === 'Escape') buttonRef.current?.focus();
      }
    };
    const close = () => setPlace(null);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [place]);

  function askDelete() {
    if (deletingRef.current) return;
    setPlace(null);
    openModal({
      variant: 'confirm',
      title: '알림창',
      showCloseButton: true,
      content: '이 채팅방을 내 대화 목록에서 삭제할까요?',
      okButton: {
        label: '삭제',
        tone: 'danger',
        onClick: () => {
          if (deletingRef.current) return;
          deletingRef.current = true;
          setDeleting(true);
          void (async () => {
            try {
              await bffDelete(bffEndpoints.dm.room, { roomId });
              onDeleted(roomId);
            } catch {
              openModal({
                variant: 'alert',
                title: '알림창',
                content: '채팅방을 삭제하지 못했습니다. 다시 시도해 주세요.',
                showCloseButton: true,
              });
            } finally {
              deletingRef.current = false;
              setDeleting(false);
            }
          })();
        },
      },
    });
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.roomMoreBtn}
        aria-label={`${nickname} 채팅방 더보기`}
        aria-haspopup="menu"
        aria-expanded={place != null}
        disabled={deleting}
        onClick={() => {
          if (place) {
            setPlace(null);
            return;
          }
          const rect = buttonRef.current?.getBoundingClientRect();
          if (!rect) return;
          setPlace({
            top:
              rect.bottom + 62 > window.innerHeight - 80
                ? Math.max(8, rect.top - 62)
                : rect.bottom + 4,
            left: Math.max(8, Math.min(rect.right - 130, window.innerWidth - 138)),
          });
        }}
      >
        <Ellipsis size={25} strokeWidth={2} />
      </button>
      {place
        ? createPortal(
            <div
              ref={menuRef}
              className={styles.roomMoreMenu}
              style={place}
              role="menu"
              aria-label={`${nickname} 채팅방 메뉴`}
            >
              <button
                type="button"
                role="menuitem"
                className={styles.roomDeleteBtn}
                onClick={askDelete}
              >
                <Trash2 size={22} strokeWidth={1.75} />
                <span>삭제</span>
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
