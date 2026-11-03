/** Bounded, browser-only image warmup. Never marks a story as viewed. */
export class StoryImagePrefetcher {
  private images = new Map<string, HTMLImageElement>();

  constructor(private createImage: () => HTMLImageElement = () => new Image()) {}

  update(urls: readonly string[]) {
    const wanted = new Set(urls.filter(Boolean).slice(0, 3));
    for (const [url, image] of this.images) {
      if (wanted.has(url)) continue;
      image.removeAttribute('src');
      this.images.delete(url);
    }
    for (const url of wanted) {
      if (this.images.has(url)) continue;
      const image = this.createImage();
      image.decoding = 'async';
      image.fetchPriority = 'low';
      image.src = url;
      this.images.set(url, image);
      // Decode ahead when supported; failed warmups must not affect actual playback.
      if (typeof image.decode === 'function') void image.decode().catch(() => undefined);
    }
  }

  dispose() {
    this.update([]);
  }
}
