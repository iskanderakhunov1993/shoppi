import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import {
  getSessionUserId,
  getUserById,
  listFavoriteLinks,
  listFollowedCreators,
  listCirclesByUser,
} from "@/lib/store";
import { getDemoCreatorSlug } from "@/lib/seed";
import { MegaNav } from "./MegaNav";

/**
 * Server wrapper: reads the session and the demo creator's slug, then
 * hands both to the interactive nav.
 *
 * `overlay` is for the landing page, where the nav sits on top of the
 * hero photo and has to be light on a dark scrim.
 */
export async function LandingNav({ overlay = false }: { overlay?: boolean }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = token ? await getSessionUserId(token) : null;
  const signedIn = Boolean(userId);

  // Onboarding progress is only meaningful for shoppers, and only
  // needs a glance at counts — computed server-side here so the nav
  // (visible on every page) doesn't need its own client-side fetches.
  let onboarding: { done: number; total: number } | undefined;
  if (userId) {
    const user = await getUserById(userId);
    if (user?.role === "shopper") {
      const [favorites, follows, circles] = await Promise.all([
        listFavoriteLinks(userId),
        listFollowedCreators(userId),
        listCirclesByUser(userId),
      ]);
      const done = [favorites.length > 0, follows.length > 0, circles.length > 0].filter(Boolean).length;
      if (done < 3) onboarding = { done, total: 3 };
    }
  }

  return (
    <MegaNav
      signedIn={signedIn}
      demoSlug={await getDemoCreatorSlug()}
      overlay={overlay}
      onboarding={onboarding}
    />
  );
}
