'use client';

import type { FeedVisibility } from '@/types/enums';
import clsx from 'clsx';
import styles from './VisibilityPicker.module.scss';

const VISIBILITY_OPTIONS: { value: FeedVisibility; label: string }[] = [
  { value: 'PUBLIC', label: '전체' },
  { value: 'NEIGHBORS', label: '팔로우' },
  { value: 'PRIVATE', label: '나만' },
];

export function VisibilityPicker({
  label,
  value,
  onChange,
  disabled,
  busy = false,
  disabledValues,
  labelClassName,
}: {
  label: string;
  value: FeedVisibility | null;
  onChange: (next: FeedVisibility) => void;
  disabled?: boolean;
  /** 저장 중에는 클릭을 막되 선택 색상은 유지한다. */
  busy?: boolean;
  disabledValues?: FeedVisibility[];
  labelClassName?: string;
}) {
  return (
    <div className={styles.visibilityBlock}>
      <p className={clsx(styles.label, labelClassName)}>{label}</p>
      <div className={styles.optionRow} role="radiogroup" aria-label={label} aria-busy={busy}>
        {VISIBILITY_OPTIONS.map((opt) => {
          const optionDisabled = disabled || disabledValues?.includes(opt.value) === true;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={value === opt.value}
              disabled={optionDisabled || busy}
              className={clsx(
                styles.option,
                value === opt.value && styles.optionActive,
                busy && !optionDisabled && styles.optionBusy,
              )}
              onClick={() => {
                if (!busy && !optionDisabled && value !== opt.value) onChange(opt.value);
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
