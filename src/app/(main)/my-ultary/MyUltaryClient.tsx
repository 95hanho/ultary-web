'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { Profile } from '@/components/my-ultary/Profile';
import Image from 'next/image';
import styles from './my-ultary.module.scss';

type AssetItem = {
  src: string;
  label: string;
  note?: string;
};

type TogglePair = {
  name: string;
  off: AssetItem;
  on: AssetItem;
};

/** 헤더 */
const HEADER_ASSETS: AssetItem[] = [
  { src: '/images/icon/ultary_logo.png', label: 'ultary_logo.png', note: '헤더 로고' },
  { src: '/images/icon/Add_round.svg', label: 'Add_round.svg', note: '헤더 +' },
  { src: '/images/icon/Setting_line.svg', label: 'Setting_line.svg', note: '헤더 설정' },
];

/** 프로필 / 소개 / 생일 */
const PROFILE_ASSETS: AssetItem[] = [
  { src: '/images/icon/Edit.svg', label: 'Edit.svg', note: '소개글 수정(본인만)' },
  { src: '/images/icon/cake.svg', label: 'cake.svg', note: '생일 배지/문구' },
];

/** 펫 캐러셀 / 상세 */
const PET_ASSETS: AssetItem[] = [
  { src: '/images/icon/arrow_left.svg', label: 'arrow_left.svg', note: '펫 캐러셀 이전' },
  { src: '/images/icon/arrow_right.svg', label: 'arrow_right.svg', note: '펫 캐러셀 다음' },
  { src: '/images/icon/Setting_fill.svg', label: 'Setting_fill.svg', note: '펫 설정(본인만)' },
];

/** 우측 세로 탭 on/off */
const SIDE_TAB_PAIRS: TogglePair[] = [
  {
    name: '탭1 책',
    off: { src: '/images/icon/Book_open_alt-off.svg', label: 'Book_open_alt-off.svg' },
    on: { src: '/images/icon/Book_open_alt-on.svg', label: 'Book_open_alt-on.svg' },
  },
  {
    name: '탭2 목록',
    off: { src: '/images/icon/Order.svg', label: 'Order.svg' },
    on: { src: '/images/icon/Order_on.svg', label: 'Order_on.svg' },
  },
  {
    name: '탭3 주민/그룹',
    off: { src: '/images/icon/Group_light.svg', label: 'Group_light.svg' },
    on: { src: '/images/icon/Group_light_on.svg', label: 'Group_light_on.svg' },
  },
  {
    name: '탭4 핀/저장',
    off: { src: '/images/icon/Pin.svg', label: 'Pin.svg' },
    on: { src: '/images/icon/Pin_on.svg', label: 'Pin_on.svg' },
  },
];

/** 피드 그리드 */
const FEED_ASSETS: AssetItem[] = [
  { src: '/images/icon/multi.svg', label: 'multi.svg', note: '다중 이미지 표시' },
];

/** 배경 / 목업 이미지 */
const MEDIA_ASSETS: AssetItem[] = [
  { src: '/images/ultary_bg_bt.png', label: 'ultary_bg_bt.png', note: '하단 울타리 배경' },
  { src: '/images/mock/profile.jpg', label: 'mock/profile.jpg', note: '프로필/펫 목업' },
  { src: '/images/mock/post_ex.jpg', label: 'mock/post_ex.jpg', note: '피드 그리드 목업' },
  { src: '/images/mock/feed.jpg', label: 'mock/feed.jpg', note: '피드 목업 후보' },
];

/** FooterMenu on/off */
const FOOTER_PAIRS: TogglePair[] = [
  {
    name: '홈',
    off: { src: '/images/icon/Home.svg', label: 'Home.svg' },
    on: { src: '/images/icon/Home_fill.svg', label: 'Home_fill.svg' },
  },
  {
    name: '검색',
    off: { src: '/images/icon/Search.svg', label: 'Search.svg' },
    on: { src: '/images/icon/Search_fill.svg', label: 'Search_fill.svg' },
  },
  {
    name: '알림',
    off: { src: '/images/icon/Bell.svg', label: 'Bell.svg' },
    on: { src: '/images/icon/Bell_fill.svg', label: 'Bell_fill.svg' },
  },
  {
    name: '메시지',
    off: { src: '/images/icon/Message.svg', label: 'Message.svg' },
    on: { src: '/images/icon/Message_fill.svg', label: 'Message_fill.svg' },
  },
];

function AssetGrid({ title, items }: { title: string; items: AssetItem[] }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <ul className={styles.grid}>
        {items.map((item) => (
          <li key={item.src} className={styles.card}>
            <div className={styles.preview}>
              <Image
                src={item.src}
                alt={item.label}
                width={40}
                height={40}
                className={styles.previewImg}
              />
            </div>
            <p className={styles.fileName}>{item.label}</p>
            {item.note ? <p className={styles.note}>{item.note}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ToggleGrid({ title, pairs }: { title: string; pairs: TogglePair[] }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <ul className={styles.toggleList}>
        {pairs.map((pair) => (
          <li key={pair.name} className={styles.toggleCard}>
            <p className={styles.toggleName}>{pair.name}</p>
            <div className={styles.toggleRow}>
              <div className={styles.toggleItem}>
                <div className={styles.preview}>
                  <Image
                    src={pair.off.src}
                    alt={pair.off.label}
                    width={40}
                    height={40}
                    className={styles.previewImg}
                  />
                </div>
                <span className={styles.toggleBadge}>off</span>
                <p className={styles.fileName}>{pair.off.label}</p>
              </div>
              <div className={styles.toggleItem}>
                <div className={styles.preview}>
                  <Image
                    src={pair.on.src}
                    alt={pair.on.label}
                    width={40}
                    height={40}
                    className={styles.previewImg}
                  />
                </div>
                <span className={styles.toggleBadgeOn}>on</span>
                <p className={styles.fileName}>{pair.on.label}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 마이울타리 — 우선 에셋 확인용 */
export default function MyUltaryClient() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.pageTitle}>My Ultary · 에셋 확인</p>
        <p className={styles.pageDesc}>
          목업/docs 기준으로 필요한 아이콘·이미지를 나열했습니다. 깨지면 경로/파일명
          확인해주세요.
        </p>
      </header>

      <main className={styles.main}>
        <AssetGrid title="헤더" items={HEADER_ASSETS} />
        <AssetGrid title="프로필 / 소개 / 생일" items={PROFILE_ASSETS} />
        <AssetGrid title="펫 영역" items={PET_ASSETS} />
        <ToggleGrid title="우측 세로 탭 (on / off)" pairs={SIDE_TAB_PAIRS} />
        <AssetGrid title="피드 그리드" items={FEED_ASSETS} />
        <AssetGrid title="배경 / 목업 이미지" items={MEDIA_ASSETS} />

        <ToggleGrid title="Footer 메뉴 (on / off)" pairs={FOOTER_PAIRS} />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Footer 마이울타리 버튼</h2>
          <p className={styles.note}>
            `Profile.tsx`와 다름. 현재 페이지인지 on/off만 표시하는 별도 Footer 아바타가
            필요함. (스토리 링 X, 활성 테두리 O) — 추후 Footer 컴포넌트에서 분리.
          </p>
          <div className={styles.profileRow}>
            <div className={styles.toggleItem}>
              <Image
                src="/images/mock/profile.jpg"
                alt=""
                width={35}
                height={35}
                className={styles.footerAvatarOff}
              />
              <span className={styles.toggleBadge}>off</span>
            </div>
            <div className={styles.toggleItem}>
              <Image
                src="/images/mock/profile.jpg"
                alt=""
                width={35}
                height={35}
                className={styles.footerAvatarOn}
              />
              <span className={styles.toggleBadgeOn}>on (마이울타리)</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile 컴포넌트 샘플 (피드/스토리용)</h2>
          <div className={styles.profileRow}>
            <Profile imageUrl="/images/mock/profile.jpg" size={36} />
            <Profile imageUrl="/images/mock/profile.jpg" size={80} story="unread" />
            <Profile imageUrl="/images/mock/profile.jpg" size={80} story="read" />
          </div>
        </section>
      </main>

      <FooterMenu />
    </div>
  );
}
