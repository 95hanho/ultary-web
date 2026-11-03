/** Start playback only after the actual displayed image has loaded and decoded. */
export function onStoryImageReady(image: HTMLImageElement, onReady: () => void) {
  let cancelled = false;
  let notified = false;
  const loaded = async () => {
    if (cancelled || notified || !image.complete || image.naturalWidth === 0) return;
    try {
      if (typeof image.decode === 'function') await image.decode();
    } catch {
      return;
    }
    if (cancelled || notified) return;
    notified = true;
    onReady();
  };
  image.addEventListener('load', loaded);
  // Cached images can complete before React effects subscribe to load.
  void loaded();
  return () => {
    cancelled = true;
    image.removeEventListener('load', loaded);
  };
}
