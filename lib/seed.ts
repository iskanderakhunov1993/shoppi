import { hashPassword } from "@/lib/auth";
import {
  addLink,
  createUser,
  getUserByEmail,
  getCreatorByUserId,
  type Creator,
  type Role,
} from "@/lib/store";

// Dev-only shortcut: seeds a handful of already-verified accounts so the
// login page can offer one-click demo logins, and the landing page has
// real storefronts to link to, without registering anything by hand.
// Idempotent — safe to call on every request.
const DEMO_PASSWORD = "demo1234";
export const DEMO_ACCOUNTS: Record<Role, string> = {
  shopper: "demo-shopper@myshop.dev",
  creator: "demo-creator@myshop.dev",
  brand: "demo-brand@myshop.dev",
};

const LANDING_CREATORS = ["landing-maxim@shoppi.dev", "landing-sonya@shoppi.dev"];

function seedCreator(
  email: string,
  displayName: string,
  bio: string,
  links: { title: string; category: "cosmetics" | "mens" | "clothing"; slug: string; price: number }[]
) {
  if (getUserByEmail(email)) return;
  const { user, creator } = createUser(email, hashPassword(DEMO_PASSWORD), "creator");
  user.verified = true;
  user.verificationToken = null;
  if (!creator) return;
  creator.displayName = displayName;
  creator.bio = bio;
  for (const link of links) {
    addLink({
      creatorId: creator.id,
      title: link.title,
      category: link.category,
      targetUrl: `https://wildberries.ru/catalog/${link.slug}`,
      price: link.price,
    });
  }
}

export function seedDemoAccounts() {
  seedCreator(
    DEMO_ACCOUNTS.creator,
    "Белла",
    "Уход, который правда работает — то, что покупаю не первый раз.",
    [
      { title: "Сыворотка с витамином C", category: "cosmetics", slug: "demo-serum", price: 2490 },
      { title: "Крем для рук, без отдушки", category: "cosmetics", slug: "demo-hand-cream", price: 690 },
    ]
  );

  seedCreator(
    "landing-maxim@shoppi.dev",
    "Максим",
    "Инструменты и снаряжение, которые проверил сам — ничего лишнего.",
    [
      { title: "Складной нож для кемпинга", category: "mens", slug: "demo-knife", price: 4200 },
      { title: "Механический триммер для бороды", category: "mens", slug: "demo-trimmer", price: 3190 },
    ]
  );

  seedCreator(
    "landing-sonya@shoppi.dev",
    "Соня",
    "Базовый гардероб на каждый день — вещи, которые ношу сезон за сезоном.",
    [
      { title: "Пальто из шерсти, серое", category: "clothing", slug: "demo-coat", price: 14900 },
      { title: "Свитер оверсайз, бежевый", category: "clothing", slug: "demo-sweater", price: 5400 },
    ]
  );

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

export function listLandingCreators(): Creator[] {
  const emails = [DEMO_ACCOUNTS.creator, ...LANDING_CREATORS];
  return emails
    .map((email) => getUserByEmail(email))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => getCreatorByUserId(u.id))
    .filter((c): c is Creator => Boolean(c));
}

export { DEMO_PASSWORD };
