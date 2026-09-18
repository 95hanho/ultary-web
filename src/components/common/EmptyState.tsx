import styles from './EmptyState.module.scss';

type EmptyStateProps = {
  title: string;
  description?: string;
};

/** 공통 빈 상태 */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className={styles.root} role="status">
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.desc}>{description}</p> : null}
    </div>
  );
}
