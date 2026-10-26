import type { MetadataRoute } from 'next';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
export type SitemapPage = {
  items: Array<{ id: number; nickname?: string }>;
  nextCursorId: number | null;
};
export async function buildSitemap(
  origin: string | null,
  load: (type: 'PROFILE' | 'FEED', cursorId: number) => Promise<SitemapPage>,
): Promise<MetadataRoute.Sitemap> {
  if (!origin) return [];
  const entries: MetadataRoute.Sitemap = [{ url: new URL('/login', origin).href }];
  for (const type of ['PROFILE', 'FEED'] as const) {
    let cursor = 0;
    do {
      const page = await load(type, cursor);
      for (const item of page.items) {
        if (
          !Number.isSafeInteger(item.id) ||
          item.id <= cursor ||
          (type === 'PROFILE' && !item.nickname)
        )
          throw new Error('Invalid public sitemap entry');
        if (entries.length >= 50000)
          throw new Error('Sitemap exceeds 50000 URLs; split into shards');
        const path = type === 'PROFILE' ? myUltaryPath(item.nickname) : '/feeds/' + item.id;
        entries.push({ url: new URL(path, origin).href });
      }
      if (page.nextCursorId == null) break;
      if (page.nextCursorId <= cursor || page.items.at(-1)?.id !== page.nextCursorId)
        throw new Error('Invalid public sitemap cursor');
      cursor = page.nextCursorId;
    } while (true);
  }
  return entries;
}
