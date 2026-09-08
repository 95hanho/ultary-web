/** 해시태그 설명 목업 (클릭/호버 팝오버) */

export type TagExplain = {
  /** # 없이 */
  tag: string;
  title: string;
  imageUrl: string;
  description: string;
  linkUrl?: string;
  linkLabel?: string;
};

const LONG_DESC =
  '강아지 사료 로얄캐닌 어덜트는 성견의 영양 균형을 고려한 제품입니다. 단백질과 지방 비율을 맞춰 활력 유지에 도움을 주며, 피부·모질 케어 성분이 포함되어 있습니다. 급여량은 체중과 활동량에 따라 조절하세요. 자세한 성분표와 급여 가이드는 관련 링크에서 확인할 수 있습니다. '.repeat(
    3,
  );

export const MOCK_TAG_EXPLAINS: Record<string, TagExplain> = {
  royalcanin: {
    tag: 'royalcanin',
    title: '로얄캐닌 어덜트',
    imageUrl: '/images/mock/profile.jpg',
    description: LONG_DESC.trim(),
    linkUrl: 'https://www.royalcanin.com',
    linkLabel: '→관련 링크 보기',
  },
  푸들: {
    tag: '푸들',
    title: '푸들',
    imageUrl: '/images/mock/feed.jpg',
    description: '곱슬 털이 매력인 반려견 견종 태그입니다. 미용·산책·일상 게시글에서 자주 사용됩니다.',
    linkUrl: '#',
    linkLabel: '→관련 링크 보기',
  },
};

export function getTagExplain(raw: string): TagExplain | null {
  const key = raw.replace(/^#/, '').trim();
  if (!key) return null;
  const found = MOCK_TAG_EXPLAINS[key] ?? MOCK_TAG_EXPLAINS[key.toLowerCase()];
  if (found) return found;
  return {
    tag: key,
    title: key,
    imageUrl: '/images/mock/post_ex.jpg',
    description: `#${key} 태그에 대한 설명이 아직 없습니다.`,
  };
}

/** 캡션에서 해시태그 토큰 분리 */
export function splitCaptionTags(caption: string): Array<{ type: 'text' | 'tag'; value: string }> {
  const re = /(#[0-9A-Za-z가-힣_]+)/g;
  const parts: Array<{ type: 'text' | 'tag'; value: string }> = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(caption)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: caption.slice(last, match.index) });
    }
    parts.push({ type: 'tag', value: match[0] });
    last = match.index + match[0].length;
  }
  if (last < caption.length) {
    parts.push({ type: 'text', value: caption.slice(last) });
  }
  return parts.length > 0 ? parts : [{ type: 'text', value: caption }];
}
