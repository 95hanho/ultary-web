import type { Metadata } from 'next';
export const NO_INDEX = { index: false, follow: false } as const;
export const SITE_DESCRIPTION = '반려동물과 함께하는 일상을 나누는 공간, 울타리.';
export function indexableOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/' ||
      url.hostname === 'localhost' ||
      url.hostname.endsWith('.localhost') ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '[::1]'
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
export function publicPageMetadata(input: {
  origin: string | null;
  path: string;
  title: string;
  description: string;
  image?: string | null;
}): Metadata {
  const description =
    input.description.replace(/\s+/g, ' ').trim().slice(0, 160) || SITE_DESCRIPTION;
  let image = '/images/og-image.png';
  if (input.image?.startsWith('/') && !input.image.startsWith('//')) image = input.image;
  else if (input.image) {
    try {
      const parsed = new URL(input.image);
      if (['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password)
        image = parsed.href;
    } catch {}
  }
  const url = input.origin ? new URL(input.path, input.origin).href : undefined;
  return {
    title: input.title,
    description,
    robots: input.origin
      ? {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
        }
      : NO_INDEX,
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: {
      title: input.title,
      description,
      type: 'website',
      locale: 'ko_KR',
      siteName: 'Ultary',
      ...(url ? { url } : {}),
      images: [{ url: image, alt: input.title }],
    },
    twitter: { card: 'summary_large_image', title: input.title, description, images: [image] },
  };
}
