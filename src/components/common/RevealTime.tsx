'use client';

import { useEffect, useRef, useState } from 'react';

function isPcTime() {
  return window.matchMedia('(min-width: 768px)').matches;
}

/** 짧은 시각. PC는 hover 동안, 모바일은 클릭 후 3초간 전체 날짜를 보여 준다. */
export function RevealTime({
  label,
  absolute,
  className,
}: {
  label: string;
  absolute: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  if (!label) return null;

  const text = open && absolute ? absolute : label;

  return (
    <span
      className={className}
      onMouseEnter={() => {
        if (isPcTime() && absolute) setOpen(true);
      }}
      onMouseLeave={() => {
        if (isPcTime()) setOpen(false);
      }}
      onClick={(event) => {
        if (isPcTime() || !absolute || absolute === label) return;
        event.preventDefault();
        event.stopPropagation();
        if (timerRef.current != null) window.clearTimeout(timerRef.current);
        setOpen(true);
        timerRef.current = window.setTimeout(() => {
          setOpen(false);
          timerRef.current = null;
        }, 3000);
      }}
    >
      {text}
    </span>
  );
}
