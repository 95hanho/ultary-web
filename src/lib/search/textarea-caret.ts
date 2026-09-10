/** textarea 캐럿의 viewport 좌표 (미러 측정) */
export function getTextareaCaretRect(
  textarea: HTMLTextAreaElement,
  position: number,
): DOMRect {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement('div');
  const props = [
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'whiteSpace',
    'wordBreak',
    'wordWrap',
  ] as const;

  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';

  for (const prop of props) {
    mirror.style[prop] = style[prop];
  }

  mirror.style.overflow = 'hidden';
  mirror.style.height = `${textarea.offsetHeight}px`;

  const value = textarea.value;
  const before = value.slice(0, position);
  mirror.textContent = before;

  const marker = document.createElement('span');
  marker.textContent = value.slice(position) || '.';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const mirrorRect = mirror.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  const taRect = textarea.getBoundingClientRect();

  const top =
    taRect.top +
    (markerRect.top - mirrorRect.top) -
    textarea.scrollTop;
  const left =
    taRect.left +
    (markerRect.left - mirrorRect.left) -
    textarea.scrollLeft;

  document.body.removeChild(mirror);

  const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.45;
  return new DOMRect(left, top, 0, lineHeight);
}
