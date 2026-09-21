import type { Creator, User } from "./store.ts";

/**
 * Where a signed-in user lands by default. A creator who has finished
 * onboarding lands on their own storefront (the cabinet stays one click
 * away via the avatar); one who hasn't goes to /dashboard, where the
 * first-run wizard lives. Everyone else keeps the dashboard.
 */
export function homePathFor(user: Pick<User, "role">, creator?: Pick<Creator, "slug" | "onboarded">): string {
  if (user.role === "creator" && creator?.onboarded) return `/${creator.slug}`;
  return "/dashboard";
}
