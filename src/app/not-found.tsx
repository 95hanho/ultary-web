import Link from 'next/link';
import { getAccessToken, getRefreshToken } from '@/lib/auth/cookies';
import styles from './not-found.module.scss';

/** 브랜드 공통 404 */
export default async function NotFound() {
  const [access, refresh] = await Promise.all([getAccessToken(), getRefreshToken()]);
  const loggedIn = Boolean(access?.trim() || refresh?.trim());
  return (
    <div className={styles.shell}>
      <div className={styles.panel}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>페이지를 찾을 수 없어요</h1>
        <p className={styles.desc}>
          주소가 잘못되었거나 삭제된 페이지일 수 있어요.
        </p>
        <Link href={loggedIn ? '/' : '/login'} className={styles.home}>
          {loggedIn ? '홈으로 가기' : '로그인으로 가기'}
        </Link>
      </div>
    </div>
  );
}
