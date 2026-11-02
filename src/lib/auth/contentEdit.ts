/** The reserved service account may edit content; ownership/deletion stays separate. */
export function canEditContent(
  actor: number | null | undefined,
  author: number | null | undefined,
) {
  return actor != null && (actor === 100 || actor === author);
}
