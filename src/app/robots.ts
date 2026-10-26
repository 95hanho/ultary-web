import type { MetadataRoute } from 'next';
import { SEO_ORIGIN } from '@/lib/seo/site';
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  if (!SEO_ORIGIN) return { rules: { userAgent: '*', disallow: '/' } };
  // Crawlers must read page-level noindex. Public images use the guest-authorized file proxy.
  return {
    rules: { userAgent: '*', allow: ['/', '/api/files/'], disallow: ['/api/'] },
    sitemap: new URL('/sitemap.xml', SEO_ORIGIN).href,
  };
}
