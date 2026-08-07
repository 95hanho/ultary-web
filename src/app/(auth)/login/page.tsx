import Image from 'next/image';
import Link from 'next/link';
import styles from './login.module.scss';

const LOGO_SRC = encodeURI('/images/auth/ultary_logo 1.png');
const GOOGLE_ICON_SRC = '/images/auth/google.social.png';
const KAKAO_BTN_SRC = encodeURI('/images/auth/kakao_login_large_wide 1.png');

export default function LoginPage() {
  return (
    <main className="relative z-10 flex min-h-full flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center px-6">
        <div className="mb-10 flex justify-center">
          <Image
            src={LOGO_SRC}
            alt="ULTARY"
            width={280}
            height={120}
            priority
            className="h-auto w-[min(100%,280px)]"
            style={{ height: 'auto' }}
          />
        </div>

        <form className="flex flex-col gap-3" action="#" method="post">
          <input
            type="text"
            name="loginId"
            placeholder="휴대폰번호 또는 이메일을 입력해주세요."
            autoComplete="username"
            className="h-14 w-full rounded-lg border border-brand-gray-200 bg-white px-4 text-base text-brand-black-700 outline-none placeholder:text-brand-gray-400 focus:border-brand-grass-500"
          />
          <input
            type="password"
            name="password"
            placeholder="비밀번호를 입력해주세요."
            autoComplete="current-password"
            className="h-14 w-full rounded-lg border border-brand-gray-200 bg-white px-4 text-base text-brand-black-700 outline-none placeholder:text-brand-gray-400 focus:border-brand-grass-500"
          />

          <button
            type="submit"
            className={`${styles.loginButton} mt-2 h-12 w-full rounded-lg text-lg font-semibold text-white transition-opacity hover:opacity-90`}
          >
            로그인
          </button>
        </form>

        <Link
          href="/signup"
          className="mt-3 flex h-10 w-full items-center justify-center rounded-lg text-sm text-brand-gray-500 hover:bg-amber-50 hover:underline"
        >
          계정이 없으신가요?
        </Link>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-brand-gray-100 bg-white text-base text-brand-black-700 transition-opacity hover:opacity-90"
          >
            <Image
              src={GOOGLE_ICON_SRC}
              alt=""
              width={20}
              height={20}
              className="size-5 object-contain"
            />
            구글로그인
          </button>

          <button
            type="button"
            className="flex h-12 w-full items-center justify-center overflow-hidden rounded-lg border border-brand-gray-100 transition-opacity hover:opacity-90"
            aria-label="카카오 로그인"
          >
            <Image
              src={KAKAO_BTN_SRC}
              alt="카카오 로그인"
              width={600}
              height={90}
              className="h-12 w-full object-cover"
            />
          </button>
        </div>
      </div>
    </main>
  );
}
