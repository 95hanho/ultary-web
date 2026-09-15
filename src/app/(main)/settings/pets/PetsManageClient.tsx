'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { MOCK_MANAGED_PETS, type ManagedPet } from '@/lib/mock/pets';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { readFileAsDataUrl, setPendingPetPhoto } from '@/lib/pending-pet-photo';
import { useModalStore } from '@/stores/modal.store';
import clsx from 'clsx';
import { GripVertical, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
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

/** 설정 > 반려동물 관리 */
export default function PetsManageClient() {
  const router = useRouter();
  const openModal = useModalStore((s) => s.open);
  const [pets, setPets] = useState<ManagedPet[]>(MOCK_MANAGED_PETS);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [photoTargetPetId, setPhotoTargetPetId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PetFormState>(emptyForm);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openCreate = () => {
    setFormMode('create');
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (pet: ManagedPet) => {
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

  const reorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setPets((prev) => {
      const from = prev.findIndex((p) => p.id === fromId);
      const to = prev.findIndex((p) => p.id === toId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const onDragStart = (e: DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const onDragOver = (e: DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) setDragOverId(id);
  };

  const onDrop = (e: DragEvent, id: string) => {
    e.preventDefault();
    const fromId = e.dataTransfer.getData('text/plain') || dragId;
    if (fromId) reorder(fromId, id);
    setDragId(null);
    setDragOverId(null);
  };

  const onDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
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
                name: payload.name || p.name,
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

  return (
    <div className={styles.shell}>
      <PageHeader title="반려동물 관리" backHref="/settings" />

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <button type="button" className={styles.addBtn} onClick={openCreate}>
            추가+
          </button>
        </div>

        <div className={styles.list}>
          {pets.map((pet, index) => (
            <div
              key={pet.id}
              className={clsx(
                styles.item,
                dragId === pet.id && styles.itemDragging,
                dragOverId === pet.id && dragId !== pet.id && styles.itemDragOver,
              )}
              onClick={() => openEdit(pet)}
              onDragOver={(e) => onDragOver(e, pet.id)}
              onDrop={(e) => onDrop(e, pet.id)}
            >
              <span className={styles.index}>{index + 1}</span>

              <div className={styles.photoWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pet.imageUrl} alt="" className={styles.photo} />
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

              <button
                type="button"
                className={styles.dragHandle}
                aria-label={`${pet.name} 순서 변경`}
                draggable
                onClick={(e) => e.stopPropagation()}
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragStart(e, pet.id);
                }}
                onDragEnd={onDragEnd}
              >
                <GripVertical size={18} strokeWidth={2.2} aria-hidden />
              </button>
            </div>
          ))}
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
                    <label className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>이름</span>
                      <input
                        className={styles.fieldInput}
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="이름을 입력해주세요."
                      />
                    </label>
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
                        className={styles.fieldInput}
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
