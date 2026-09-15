import { bffEndpoints } from '@/lib/api/endpoints';
import Image from 'next/image';
import Link from 'next/link';
import styles from './login.module.scss';

const LOGO_SRC = encodeURI('/images/auth/ultary_logo 1.png');
const GOOGLE_ICON_SRC = '/images/auth/google.social.png';
const KAKAO_BTN_SRC = encodeURI('/images/auth/kakao_login_large_wide 1.png');

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error;

  return (
    <main className={styles.shell}>
      <div className={styles.logoWrap}>
        <Image
          src={LOGO_SRC}
          alt="ULTARY"
          width={334}
          height={100}
          priority
          className={styles.logo}
        />
      </div>

      <div className={styles.content}>
        {error ? (
          <p className={styles.errorBanner}>소셜 로그인에 실패했습니다. 다시 시도해주세요.</p>
        ) : null}

        <form action="#" method="post" className={styles.form}>
          <div className={styles.fields}>
            <input
              type="text"
              name="loginId"
              placeholder="휴대폰번호 또는 이메일을 입력해주세요."
              autoComplete="username"
              className={styles.input}
            />
            <input
              type="password"
              name="password"
              placeholder="비밀번호를 입력해주세요."
              autoComplete="current-password"
              className={styles.input}
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.loginButton}>
              로그인
            </button>

            <Link href="/signup" className={styles.signupLink}>
              계정이 없으신가요?
            </Link>

            <div className={styles.social}>
              <a href={bffEndpoints.auth.google} className={styles.googleBtn}>
                <Image
                  src={GOOGLE_ICON_SRC}
                  alt=""
                  width={19}
                  height={19}
                  className={styles.googleIcon}
                />
                구글로그인
              </a>

              <a
                href={bffEndpoints.auth.kakao}
                className={styles.kakaoBtn}
                aria-label="카카오 로그인"
              >
                <Image
                  src={KAKAO_BTN_SRC}
                  alt="카카오 로그인"
                  width={600}
                  height={90}
                  className={styles.kakaoImage}
                />
              </a>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
