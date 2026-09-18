'use client';

import { PageHeader } from '@/components/common/PageHeader';
import styles from './support.module.scss';

/** 설정 > 고객센터 / 문의 */
export default function SupportClient() {
  return (
    <div className={styles.shell}>
      <PageHeader title="고객센터 / 문의" backHref="/settings" />
      <main className={styles.main}>
        <section className={styles.card}>
          <h2 className={styles.title}>도움이 필요하신가요?</h2>
          <p className={styles.desc}>
            서비스 이용 중 불편한 점이나 제안이 있으시면 아래로 문의해 주세요.
          </p>
          <a className={styles.mail} href="mailto:support@ultary.app">
            support@ultary.app
          </a>
        </section>
        <ul className={styles.faq}>
          <li>
            <strong>계정·로그인</strong>
            <span>비밀번호 변경은 설정 &gt; 마이페이지에서 할 수 있어요.</span>
          </li>
          <li>
            <strong>신고·차단</strong>
            <span>차단한 사용자는 설정 &gt; 차단한 사용자에서 관리해요.</span>
          </li>
          <li>
            <strong>알림</strong>
            <span>알림 종류별 on/off는 설정 &gt; 알림 설정에서 바꿔요.</span>
          </li>
        </ul>
      </main>
    </div>
  );
}
