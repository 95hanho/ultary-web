function absoluteClock(date: Date, now: Date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const clock = `${date.getMonth() + 1}월 ${date.getDate()}일 ${hh}:${mm}`;
  if (date.getFullYear() === now.getFullYear()) return clock;
  return `${date.getFullYear()}년 ${clock}`;
}

/** 피드 작성 시각. 짧은 표기와, hover·클릭 때 보여 줄 전체 날짜. */
export function formatFeedTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { label: '', absolute: '' };
  const now = new Date();
  const absolute = absoluteClock(date, now);
  const diff = now.getTime() - date.getTime();
  if (diff >= 0) {
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 5) return { label: '방금전', absolute };
    if (minutes <= 30) return { label: `${minutes}분전`, absolute };
  }
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startToday - startThat) / 86_400_000);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  if (dayDiff === 0) return { label: `${hh}:${mm}`, absolute };
  if (dayDiff === 1) return { label: '어제', absolute };
  if (dayDiff >= 2 && dayDiff <= 7) return { label: `${dayDiff}일전`, absolute };
  return { label: absolute, absolute };
}
