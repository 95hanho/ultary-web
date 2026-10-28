export const PET_NAME_MESSAGE =
  '펫 이름은 영문 대·소문자와 한글만 사용할 수 있으며, 영문 1자·한글 2자로 계산해 30자 이하여야 합니다.';

export function petNameLength(value: string): number {
  return Array.from(value.trim()).reduce(
    (length, character) => length + (/[가-힣]/.test(character) ? 2 : 1),
    0,
  );
}

export function isValidPetName(value: string): boolean {
  return /^[A-Za-z가-힣]+$/.test(value.trim()) && petNameLength(value) <= 30;
}
