import type { MetadataRoute } from 'next';
import { springGet } from '@/lib/api/springFetch';
import { SEO_ORIGIN } from '@/lib/seo/site';
import { buildSitemap, type SitemapPage } from '@/lib/seo/sitemap';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap(SEO_ORIGIN, (type, cursorId) =>
    springGet<SitemapPage>(
      '/api/v1/public/seo/sitemap',
      { type, cursorId, limit: 1000 },
      undefined,
      { recoverExpiredAccess: false },
    ),
  );
}
