import { hashPassword } from "@/lib/auth";
import {
  addLink,
  createUser,
  getUserByEmail,
  getCreatorByUserId,
  type Role,
} from "@/lib/store";

// Dev-only shortcut: seeds one already-verified account per role so the
// login page can offer one-click demo logins instead of registering each
// time. Idempotent — safe to call on every request.
const DEMO_PASSWORD = "demo1234";
export const DEMO_ACCOUNTS: Record<Role, string> = {
  shopper: "demo-shopper@myshop.dev",
  creator: "demo-creator@myshop.dev",
  brand: "demo-brand@myshop.dev",
};

export function seedDemoAccounts() {
  if (!getUserByEmail(DEMO_ACCOUNTS.creator)) {
    const { user, creator } = createUser(
      DEMO_ACCOUNTS.creator,
      hashPassword(DEMO_PASSWORD),
      "creator"
    );
    user.verified = true;
    user.verificationToken = null;
    if (creator) {
      addLink({
        creatorId: creator.id,
        title: "Сыворотка с витамином C",
        category: "cosmetics",
        targetUrl: "https://wildberries.ru/catalog/demo-serum",
        price: 2490,
      });
      addLink({
        creatorId: creator.id,
        title: "Складной нож для кемпинга",
        category: "mens",
        targetUrl: "https://wildberries.ru/catalog/demo-knife",
        price: 4200,
      });
    }
  }

  if (!getUserByEmail(DEMO_ACCOUNTS.shopper)) {
    const { user } = createUser(DEMO_ACCOUNTS.shopper, hashPassword(DEMO_PASSWORD), "shopper");
    user.verified = true;
    user.verificationToken = null;
  }

  if (!getUserByEmail(DEMO_ACCOUNTS.brand)) {
    const { user } = createUser(
      DEMO_ACCOUNTS.brand,
      hashPassword(DEMO_PASSWORD),
      "brand",
      "wildberries.ru"
    );
    user.verified = true;
    user.verificationToken = null;
  }
}

export function getDemoCreatorSlug(): string | undefined {
  const user = getUserByEmail(DEMO_ACCOUNTS.creator);
  return user ? getCreatorByUserId(user.id)?.slug : undefined;
}

export { DEMO_PASSWORD };
