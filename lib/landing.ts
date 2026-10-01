import type { Creator, User } from "./store.ts";

/**
 * Where a signed-in user lands by default. A creator who has finished
 * onboarding lands on their own storefront (the cabinet stays one click
 * away via the avatar); one who hasn't goes to /dashboard, where the
 * first-run wizard lives. A shopper lands on the actual shopping feed
 * (ShopMy-style), not the account-management dashboard — the
 * onboarding nudge floats over that feed instead of gating them on
 * an internal "cabinet" page first. Brands keep the dashboard, which
 * is their only real destination.
 */
export function homePathFor(user: Pick<User, "role">, creator?: Pick<Creator, "slug" | "onboarded">): string {
  if (user.role === "creator" && creator?.onboarded) return `/${creator.slug}`;
  if (user.role === "shopper") return "/finds";
  return "/dashboard";
}
