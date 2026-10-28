export type ContentTab = 'feed' | 'tagged' | 'pinned';
export type PetFeedSelection = { tab: ContentTab; petId: string };
/** Pinned posts never keep a pet filter. Clicking a pet there opens its regular feed. */
export function selectGridPet(current: PetFeedSelection, petId: string): PetFeedSelection {
  return {
    tab: current.tab === 'pinned' ? 'feed' : current.tab,
    petId: current.tab !== 'pinned' && current.petId === petId ? '' : petId,
  };
}
export function selectGridTab(current: PetFeedSelection, tab: ContentTab): PetFeedSelection {
  return tab === current.tab ? current : { tab, petId: '' };
}
