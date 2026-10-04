/** Whether `viewerId` (null for visitors) may view a deck: shared decks are public to their link. */
export function canView(deck: { userId: string; shared: boolean }, viewerId: string | null): boolean {
  return deck.shared || deck.userId === viewerId;
}
