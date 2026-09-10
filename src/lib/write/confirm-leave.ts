import { useModalStore } from '@/stores/modal.store';
import { useWriteDraftStore } from '@/stores/write-draft.store';

/** 게시글 작성 중 이탈 확인 (confirm) */
export function confirmLeaveWrite(onLeave: () => void) {
  useModalStore.getState().open({
    variant: 'confirm',
    title: '알림창',
    content: '작성 중인 글이 삭제됩니다. 정말 나가시겠어요?',
    showCloseButton: true,
    cancelButton: {
      label: '계속 작성',
      tone: 'success',
    },
    okButton: {
      label: '나가기',
      tone: 'danger',
      onClick: () => {
        useWriteDraftStore.getState().clear();
        onLeave();
      },
    },
  });
}

/** `/…/write/…` 작성 플로우 경로 여부 */
export function isWriteFlowPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return /\/write(\/|$)/.test(pathname);
}
