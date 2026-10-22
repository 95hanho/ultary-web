import Image from 'next/image';
import styles from './SendStateIcon.module.scss';

/** 누르는 동안과 전송 중에는 채워진 전송 아이콘을 표시한다. */
export function SendStateIcon({ sending = false }: { sending?: boolean }) {
  return (
    <span className={styles.icon} data-sending={sending} aria-hidden="true">
      <Image src="/images/icon/Send.svg" alt="" width={22} height={22} className={styles.outline} />
      <span className={styles.filled} />
    </span>
  );
}
