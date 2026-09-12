/**
 * One-off: swaps the 5 Instagram-test accounts' cartoon dicebear
 * avatars for realistic face photos, so the storefront header actually
 * looks like a person, not an illustrated placeholder.
 *
 * Run with: node --experimental-strip-types --env-file=.env.local scripts/set-instagram-test-avatars.ts
 */
import { getUserByEmail, getCreatorByUserId, updateCreator } from "../lib/store.ts";

// i.pravatar.cc serves stable, numbered face photos — same URL always
// returns the same image, unlike thispersondoesnotexist.com which has
// no seed. Good enough for test data; swap for real uploads later.
const ACCOUNTS = [
  { email: "test-ig-nika@shoppi-test.dev", avatar: "https://i.pravatar.cc/300?img=47" },
  { email: "test-ig-oleg@shoppi-test.dev", avatar: "https://i.pravatar.cc/300?img=12" },
  { email: "test-ig-dasha@shoppi-test.dev", avatar: "https://i.pravatar.cc/300?img=9" },
  { email: "test-ig-pavel@shoppi-test.dev", avatar: "https://i.pravatar.cc/300?img=13" },
  { email: "test-ig-katya@shoppi-test.dev", avatar: "https://i.pravatar.cc/300?img=32" },
];

async function main() {
  for (const acc of ACCOUNTS) {
    const user = await getUserByEmail(acc.email);
    if (!user) {
      console.error(`Не найден: ${acc.email}`);
      continue;
    }
    const creator = await getCreatorByUserId(user.id);
    if (!creator) {
      console.error(`Нет профиля куратора для ${acc.email}`);
      continue;
    }
    await updateCreator(creator.id, { avatarUrl: acc.avatar });
    console.log(`OK: /${creator.slug} -> ${acc.avatar}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
