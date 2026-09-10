import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { getSessionUserId } from "@/lib/store";
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
  const signedIn = Boolean(token && (await getSessionUserId(token)));

  return <MegaNav signedIn={signedIn} demoSlug={await getDemoCreatorSlug()} overlay={overlay} />;
}
