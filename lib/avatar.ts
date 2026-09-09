/**
 * Placeholder portraits for creators who have not uploaded their own.
 * Deterministic per slug, so a creator's face does not change on reload.
 */
export function placeholderAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f4f4f2`;
}
