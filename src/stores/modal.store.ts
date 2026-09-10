import { create } from 'zustand';
import type { ReactNode } from 'react';

/** 모달 종류 */
export type ModalVariant = 'action' | 'alert' | 'confirm';

/** 액션시트 메뉴 항목 */
export type ModalActionItem = {
  label: string;
  onClick?: () => void;
};

/** confirm 하단 버튼 */
export type ModalButtonConfig = {
  label?: string;
  onClick?: () => void;
  /** 숨김 */
  hidden?: boolean;
  /** success=grass-500, danger=red-500 */
  tone?: 'default' | 'primary' | 'danger' | 'success';
};

export type ModalOpenOptions = {
  variant?: ModalVariant;
  title?: string;
  content?: ReactNode;
  /** action 시트 메뉴 */
  items?: ModalActionItem[];
  okButton?: ModalButtonConfig;
  cancelButton?: ModalButtonConfig;
  /** 우상단 X — 기본 false(action), alert/confirm에서 true 가능 */
  showCloseButton?: boolean;
  /** 딤 클릭 시 닫기 — 기본 true */
  closeOnDimClick?: boolean;
  /** 닫힐 때 (X / 딤 / close() 공통) */
  onClose?: () => void;
};

type ModalState = {
  isOpen: boolean;
  variant: ModalVariant;
  title: string;
  content: ReactNode;
  items: ModalActionItem[];
  okButton: ModalButtonConfig;
  cancelButton: ModalButtonConfig;
  showCloseButton: boolean;
  closeOnDimClick: boolean;
  onCloseCallback: (() => void) | null;
  open: (options: ModalOpenOptions) => void;
  close: () => void;
  /** ok 실행 후 닫기 */
  confirmOk: () => void;
  /** cancel 실행 후 닫기 */
  confirmCancel: () => void;
};

const defaultOk: ModalButtonConfig = {
  label: '확인',
  hidden: false,
  tone: 'danger',
};

const defaultCancel: ModalButtonConfig = {
  label: '취소',
  hidden: false,
  tone: 'success',
};

export const useModalStore = create<ModalState>((set, get) => ({
  isOpen: false,
  variant: 'action',
  title: '',
  content: null,
  items: [],
  okButton: { ...defaultOk },
  cancelButton: { ...defaultCancel },
  showCloseButton: false,
  closeOnDimClick: true,
  onCloseCallback: null,

  open: (options) => {
    const variant = options.variant ?? (options.items?.length ? 'action' : 'confirm');
    set({
      isOpen: true,
      variant,
      title: options.title ?? '',
      content: options.content ?? null,
      items: options.items ?? [],
      okButton: {
        ...defaultOk,
        ...options.okButton,
        label: options.okButton?.label ?? defaultOk.label,
      },
      cancelButton: {
        ...defaultCancel,
        ...options.cancelButton,
        label: options.cancelButton?.label ?? defaultCancel.label,
      },
      showCloseButton: options.showCloseButton ?? variant !== 'action',
      closeOnDimClick: options.closeOnDimClick ?? true,
      onCloseCallback: options.onClose ?? null,
    });
  },

  close: () => {
    const { onCloseCallback } = get();
    set({
      isOpen: false,
      title: '',
      content: null,
      items: [],
      okButton: { ...defaultOk },
      cancelButton: { ...defaultCancel },
      onCloseCallback: null,
    });
    onCloseCallback?.();
  },

  confirmOk: () => {
    const { okButton, close } = get();
    if (okButton.hidden) return;
    okButton.onClick?.();
    close();
  },

  confirmCancel: () => {
    const { cancelButton, close } = get();
    if (cancelButton.hidden) return;
    cancelButton.onClick?.();
    close();
  },
}));
