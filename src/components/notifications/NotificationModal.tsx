import { NotificationPanel } from "./NotificationPanel";

type NotificationModalProps = {
  open: boolean;
  onClose: () => void;
};

/** 데스크톱 전용 — 라우트 이동 없이 모달로 표시 */
export function NotificationModal({ open, onClose }: NotificationModalProps) {
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true">
      <button type="button" onClick={onClose}>
        닫기
      </button>
      <NotificationPanel />
    </div>
  );
}
