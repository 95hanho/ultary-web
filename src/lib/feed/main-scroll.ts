/** Cached lists render synchronously, but image layout may still finish on following frames. */
export function restoreMainScroll(top: number) {
  let frame = 0,
    stable = 0,
    stopped = false;
  const deadline = performance.now() + 3000;
  const stop = () => {
    stopped = true;
    cancelAnimationFrame(frame);
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
  };
  const step = () => {
    if (stopped || window.location.pathname !== '/') return stop();
    window.scrollTo({ top, behavior: 'instant' });
    stable = Math.abs(window.scrollY - top) < 2 ? stable + 1 : 0;
    if (stable >= 6 || performance.now() >= deadline) stop();
    else frame = requestAnimationFrame(step);
  };
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', stop);
  frame = requestAnimationFrame(step);
  return stop;
}
