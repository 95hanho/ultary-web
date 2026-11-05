'use client';

import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import styles from './PasswordInput.module.scss';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** 기존 페이지 input 스타일 클래스 */
  inputClassName?: string;
};

/** password ↔ text 토글. 숨김=Eye, 표시=EyeOff */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, inputClassName, disabled, value, defaultValue, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    const hasValue =
      (typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : typeof defaultValue === 'string' || typeof defaultValue === 'number'
          ? String(defaultValue)
          : ''
      ).length > 0;

    return (
      <div className={clsx(styles.wrap, className)}>
        <input
          {...props}
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          type={visible && hasValue ? 'text' : 'password'}
          disabled={disabled}
          className={clsx(hasValue && styles.inputPad, inputClassName)}
        />
        {hasValue ? (
          <button
            type="button"
            tabIndex={-1}
            className={styles.toggle}
            aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
            aria-pressed={visible}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setVisible((open) => !open)}
          >
            {visible ? (
              <EyeOff size={20} strokeWidth={1.75} />
            ) : (
              <Eye size={20} strokeWidth={1.75} />
            )}
          </button>
        ) : null}
      </div>
    );
  },
);
