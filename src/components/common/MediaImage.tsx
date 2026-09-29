import Image, { type ImageProps } from 'next/image';

/**
 * 사용자 미디어용 next/image.
 * - CDN `https://…` : 최적화 (next.config remotePatterns)
 * - 업로드 `/api/files/{id}/content` : 브라우저가 쿠키를 실어 직접 요청
 *   (이미지 옵티마이저는 로그인 쿠키를 안 붙여 401이 난다)
 * 아이콘(`/images/icon`, static import)은 이 컴포넌트를 쓰지 않는다.
 */
function loadsInBrowser(src: ImageProps['src']): boolean {
  if (typeof src !== 'string') return false;
  return (
    src.startsWith('/api/files/') ||
    src.startsWith('blob:') ||
    src.startsWith('data:')
  );
}

export function MediaImage({ src, unoptimized, ...rest }: ImageProps) {
  return (
    <Image
      src={src}
      unoptimized={unoptimized ?? loadsInBrowser(src)}
      {...rest}
    />
  );
}
