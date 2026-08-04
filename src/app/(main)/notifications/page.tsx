import { NotificationPanel } from "@/components/notifications/NotificationPanel";

/**
 * 모바일: 전체 페이지로 사용.
 * 데스크톱: 이 URL로 진입하면 모달 셸로 감싸거나 홈으로 리다이렉트하는 식으로 처리.
 * UI 본문은 NotificationPanel을 공유한다.
 */
export default function NotificationsPage() {
  return (
    <main>
      <NotificationPanel />
    </main>
  );
}
