import Image from 'next/image';
import styles from './LogoLoading.module.scss';

const LogoIcon = '/images/img/ultary_logo.png';

type LogoLoadingProps = {
  /** 접근성용. 기본 «불러오는 중» */
  label?: string;
};

/** 페이지 로딩. 중앙에 울타리 로고만 보여 준다. */
export function LogoLoading({ label = '불러오는 중' }: LogoLoadingProps) {
  return (
    <div className={styles.root} role="status" aria-busy="true" aria-label={label}>
      <Image
        src={LogoIcon}
        alt="ULTARY"
        width={120}
        height={36}
        priority
        className={styles.logo}
      />
    </div>
  );
}
