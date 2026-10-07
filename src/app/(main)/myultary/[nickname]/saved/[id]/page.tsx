import { FeedCollectionClient } from '@/components/my-ultary/FeedCollectionClient';

/** 예전 저장 탭 주소. 지금은 울타리 고정 목록이다 */
export default function MyUltarySavedPage() {
  return <FeedCollectionClient kind="pinned" />;
}
