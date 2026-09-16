'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { MOCK_MANAGED_PETS, type ManagedPet } from '@/lib/mock/pets';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { readFileAsDataUrl, setPendingPetPhoto } from '@/lib/pending-pet-photo';
import { useModalStore } from '@/stores/modal.store';
import clsx from 'clsx';
import { GripVertical, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './pets.module.scss';

const SettingFillIcon = '/images/icon/Setting_fill.svg';
const RETURN_HREF = '/settings/pets';

type FormMode = 'create' | 'edit';

type PetFormState = {
  name: string;
  tag: string;
  bio: string;
  birth: string;
};

type DragSession = {
  id: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  startClientX: number;
  startClientY: number;
  moved: boolean;
};

function emptyForm(): PetFormState {
  return { name: '', tag: '', bio: '', birth: '' };
}

function formFromPet(pet: ManagedPet): PetFormState {
  return {
    name: pet.name,
    tag: pet.tag,
    bio: pet.bio,
    birth: pet.birth,
  };
}

function reorderByIndex(list: ManagedPet[], from: number, to: number) {
  if (from === to || from < 0 || to < 0) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** 설정 > 반려동물 관리 */
export default function PetsManageClient() {
  const router = useRouter();
  const openModal = useModalStore((s) => s.open);
  const [pets, setPets] = useState<ManagedPet[]>(MOCK_MANAGED_PETS);
  const [drag, setDrag] = useState<DragSession | null>(null);
  const [photoTargetPetId, setPhotoTargetPetId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PetFormState>(emptyForm);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const petsRef = useRef(pets);
  const dragRef = useRef<DragSession | null>(null);
  const suppressClickRef = useRef(false);

  petsRef.current = pets;
  dragRef.current = drag;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!drag) return;

    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    const onMove = (e: PointerEvent) => {
      const session = dragRef.current;
      if (!session) return;

      const nextSession: DragSession = {
        ...session,
        x: e.clientX - session.offsetX,
        y: e.clientY - session.offsetY,
        moved:
          session.moved ||
          Math.abs(e.clientX - session.startClientX) > 4 ||
          Math.abs(e.clientY - session.startClientY) > 4,
      };
      dragRef.current = nextSession;
      setDrag(nextSession);

      const currentPets = petsRef.current;
      const from = currentPets.findIndex((p) => p.id === session.id);
      if (from < 0) return;

      let insertAt = currentPets.length - 1;
      for (let i = 0; i < currentPets.length; i += 1) {
        const el = itemRefs.current.get(currentPets[i].id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          insertAt = i;
          break;
        }
        insertAt = i;
      }

      if (insertAt !== from) {
        setPets(reorderByIndex(currentPets, from, insertAt));
      }
    };

    const onUp = () => {
      const session = dragRef.current;
      if (session?.moved) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
        console.log(
          '[settings-pets] reorder',
          petsRef.current.map((p) => p.id),
        );
      }
      dragRef.current = null;
      setDrag(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag]);

  const openCreate = () => {
    setFormMode('create');
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (pet: ManagedPet) => {
    if (suppressClickRef.current || dragRef.current) return;
    setFormMode('edit');
    setEditingId(pet.id);
    setForm(formFromPet(pet));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const openPhotoPicker = (petId: string) => {
    setPhotoTargetPetId(petId);
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const petId = photoTargetPetId;
    e.target.value = '';
    if (!file || !petId) return;
    if (!file.type.startsWith('image/')) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPendingPetPhoto({
        petId,
        dataUrl,
        fileName: file.name,
        mimeType: file.type,
        returnHref: RETURN_HREF,
      });
      router.push(`${myUltaryPath()}/pets/${petId}/photo`);
    } catch (err) {
      console.error('[settings-pets] file read failed', err);
    }
  };

  const startDrag = (e: ReactPointerEvent<HTMLButtonElement>, pet: ManagedPet) => {
    e.preventDefault();
    e.stopPropagation();
    const row = itemRefs.current.get(pet.id);
    if (!row) return;
    const rect = row.getBoundingClientRect();
    const session: DragSession = {
      id: pet.id,
      width: rect.width,
      height: rect.height,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      x: rect.left,
      y: rect.top,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
    };
    dragRef.current = session;
    setDrag(session);
  };

  const handleDelete = () => {
    if (!editingId) return;
    const target = pets.find((p) => p.id === editingId);
    openModal({
      variant: 'confirm',
      title: '알림창',
      content: `${target?.name ?? '반려동물'}을(를) 정말 삭제할까요?`,
      showCloseButton: true,
      okButton: {
        label: '삭제',
        tone: 'danger',
        onClick: () => {
          console.log('[settings-pets] delete', { petId: editingId });
          setPets((prev) => prev.filter((p) => p.id !== editingId));
          closeForm();
        },
      },
      cancelButton: {
        label: '취소',
        tone: 'success',
      },
    });
  };

  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      mode: formMode,
      petId: editingId,
      name: form.name.trim(),
      tag: form.tag.trim().replace(/^@/, ''),
      bio: form.bio.trim(),
      birth: form.birth.trim(),
    };
    console.log('[settings-pets] submit', payload);

    if (formMode === 'create') {
      const id = `pet-${Date.now()}`;
      setPets((prev) => [
        ...prev,
        {
          id,
          name: payload.name || '이름없음',
          tag: payload.tag || `pet_${prev.length + 1}`,
          gender: 'M',
          bio: payload.bio,
          birth: payload.birth || '2020-01-01',
          imageUrl: '/images/mock/profile.jpg',
        },
      ]);
    } else if (editingId) {
      setPets((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                tag: payload.tag || p.tag,
                bio: payload.bio,
                birth: payload.birth || p.birth,
              }
            : p,
        ),
      );
    }
    closeForm();
  };

  const draggingPet = drag ? pets.find((p) => p.id === drag.id) : null;

  const renderPetBody = (pet: ManagedPet, index: number, opts?: { ghost?: boolean }) => (
    <>
      <span className={styles.index}>{index + 1}</span>
      <div className={styles.photoWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pet.imageUrl} alt="" className={styles.photo} />
        {!opts?.ghost ? (
          <button
            type="button"
            className={styles.gearBtn}
            aria-label={`${pet.name} 프로필 사진 설정`}
            onClick={(e) => {
              e.stopPropagation();
              openPhotoPicker(pet.id);
            }}
          >
            <Image src={SettingFillIcon} alt="" width={25} height={25} />
          </button>
        ) : (
          <span className={styles.gearBtn} aria-hidden>
            <Image src={SettingFillIcon} alt="" width={25} height={25} />
          </span>
        )}
      </div>
      <div className={styles.info}>
        <div>
          <p className={styles.nameLine}>
            <span className={styles.name}>{pet.name}</span>({pet.gender})
          </p>
          <p className={styles.tag}>@{pet.tag}</p>
        </div>
        <div>
          <p className={styles.meta}>소개글 : {pet.bio}</p>
          <p className={styles.meta}>출생 : {pet.birth}</p>
        </div>
      </div>
      {!opts?.ghost ? (
        <button
          type="button"
          className={styles.dragHandle}
          aria-label={`${pet.name} 순서 변경`}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => startDrag(e, pet)}
        >
          <GripVertical size={24} strokeWidth={2.4} aria-hidden />
        </button>
      ) : (
        <span className={styles.dragHandle} aria-hidden>
          <GripVertical size={24} strokeWidth={2.4} />
        </span>
      )}
    </>
  );

  return (
    <div className={styles.shell}>
      <PageHeader title="반려동물 관리" backHref="/settings" />

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <button type="button" className={styles.addBtn} onClick={openCreate}>
            <Plus size={18} strokeWidth={2.6} aria-hidden />
            추가
          </button>
        </div>

        <div ref={listRef} className={styles.list}>
          {pets.map((pet, index) => {
            const isDragging = drag?.id === pet.id;
            return (
              <div
                key={pet.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(pet.id, el);
                  else itemRefs.current.delete(pet.id);
                }}
                className={clsx(styles.item, isDragging && styles.itemPlaceholder)}
                onClick={() => openEdit(pet)}
              >
                {isDragging ? (
                  <div className={styles.placeholderInner} aria-hidden />
                ) : (
                  renderPetBody(pet, index)
                )}
              </div>
            );
          })}
        </div>
      </main>

      <FooterMenu />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={handlePhotoChange}
      />

      {mounted && drag && draggingPet
        ? createPortal(
            <div
              className={styles.dragGhost}
              style={{
                width: drag.width,
                height: drag.height,
                transform: `translate3d(${drag.x}px, ${drag.y}px, 0)`,
              }}
              aria-hidden
            >
              <div className={clsx(styles.item, styles.itemGhost)}>
                {renderPetBody(
                  draggingPet,
                  pets.findIndex((p) => p.id === draggingPet.id),
                  { ghost: true },
                )}
              </div>
            </div>,
            document.body,
          )
        : null}

      {mounted && formOpen
        ? createPortal(
            <div
              className={styles.dim}
              role="presentation"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeForm();
              }}
            >
              <div
                className={styles.panel}
                role="dialog"
                aria-modal="true"
                aria-labelledby="pet-form-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.panelHeader}>
                  <h2 id="pet-form-title" className={styles.panelTitle}>
                    {formMode === 'create' ? '반려동물 등록' : '반려동물 수정'}
                  </h2>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    aria-label="닫기"
                    onClick={closeForm}
                  >
                    <X size={18} strokeWidth={2} />
                  </button>
                </div>

                <form className={styles.panelBody} onSubmit={handleSubmitForm}>
                  <div className={styles.fields}>
                    <div className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>이름</span>
                      {formMode === 'edit' ? (
                        <span className={styles.fieldValue}>{form.name}</span>
                      ) : (
                        <input
                          className={styles.fieldInput}
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="이름을 입력해주세요."
                        />
                      )}
                    </div>
                    <label className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>펫 태그</span>
                      <input
                        className={styles.fieldInput}
                        value={form.tag}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            tag: e.target.value.replace(/^@/, ''),
                          }))
                        }
                        placeholder="태그명을 입력해주세요."
                      />
                    </label>
                    <label className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>소개글</span>
                      <input
                        className={styles.fieldInput}
                        value={form.bio}
                        onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                        placeholder="소개글을 입력해주세요."
                      />
                    </label>
                    <label className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>출생</span>
                      <input
                        type="date"
                        className={clsx(styles.fieldInput, styles.fieldInputBirth)}
                        value={form.birth}
                        onChange={(e) => setForm((f) => ({ ...f, birth: e.target.value }))}
                      />
                    </label>
                    {formMode === 'edit' ? (
                      <div className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>기타</span>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={handleDelete}
                        >
                          삭제
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.panelFooter}>
                    <button type="submit" className={styles.submitBtn}>
                      {formMode === 'create' ? '등록' : '수정'}
                    </button>
                    <button type="button" className={styles.cancelBtn} onClick={closeForm}>
                      취소
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
