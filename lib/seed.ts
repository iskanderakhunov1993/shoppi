import { hashPassword } from "./auth.ts";
import {
  addLink,
  createUser,
  getUserByEmail,
  getCreatorByUserId,
  markUserVerified,
  setBrandArticles,
  updateCreator,
  type Creator,
  type Role,
} from "./store.ts";
import { parseMarketplaceItem } from "./marketplace.ts";

// Seeds a handful of already-verified accounts so the login page can offer
// one-click demo logins and the landing page has real storefronts to link
// to. Idempotent — safe to call on every request.
const DEMO_PASSWORD = "demo1234";
export const DEMO_ACCOUNTS: Record<Role, string> = {
  shopper: "demo-shopper@myshop.dev",
  creator: "demo-creator@myshop.dev",
  brand: "demo-brand@myshop.dev",
};

const LANDING_CREATORS = ["landing-maxim@shoppi.dev", "landing-sonya@shoppi.dev"];

type SeedLink = {
  title: string;
  category: "cosmetics" | "mens" | "clothing";
  url: string;
  price: number;
};

export function seedCreatorAccount(
  email: string,
  displayName: string,
  bio: string,
  links: SeedLink[],
  passwordHash?: string
): Creator | undefined {
  const existing = getUserByEmail(email);
  if (existing) return getCreatorByUserId(existing.id);

  const { user, creator } = createUser(email, passwordHash ?? hashPassword(DEMO_PASSWORD), "creator");
  markUserVerified(user.id);
  if (!creator) return undefined;

  updateCreator(creator.id, { displayName, bio });

  for (const link of links) {
    const { marketplace, articleId } = parseMarketplaceItem(link.url);
    addLink({
      creatorId: creator.id,
      title: link.title,
      category: link.category,
      targetUrl: link.url,
      price: link.price,
      marketplace,
      articleId,
    });
  }

  return getCreatorByUserId(user.id);
}

export function seedDemoAccounts() {
  seedCreatorAccount(
    DEMO_ACCOUNTS.creator,
    "Белла",
    "Уход, который правда работает — то, что покупаю не первый раз.",
    [
      {
        title: "Сыворотка с витамином C",
        category: "cosmetics",
        url: "https://www.wildberries.ru/catalog/172247725/detail.aspx",
        price: 2490,
      },
      {
        title: "Крем для рук, без отдушки",
        category: "cosmetics",
        url: "https://www.letu.ru/product/krem-dlya-ruk-101",
        price: 690,
      },
    ]
  );

  seedCreatorAccount(
    LANDING_CREATORS[0],
    "Максим",
    "Инструменты и снаряжение, которые проверил сам — ничего лишнего.",
    [
      {
        title: "Складной нож для кемпинга",
        category: "mens",
        url: "https://www.wildberries.ru/catalog/183920144/detail.aspx",
        price: 4200,
      },
      {
        title: "Механический триммер для бороды",
        category: "mens",
        url: "https://www.ozon.ru/product/trimmer-dlya-borody-1284900733/",
        price: 3190,
      },
    ]
  );

  seedCreatorAccount(
    LANDING_CREATORS[1],
    "Соня",
    "Базовый гардероб на каждый день — вещи, которые ношу сезон за сезоном.",
    [
      {
        title: "Пальто из шерсти, серое",
        category: "clothing",
        url: "https://www.lamoda.ru/p/palto-sherstyanoe-770211/",
        price: 14900,
      },
      {
        title: "Свитер оверсайз, бежевый",
        category: "clothing",
        url: "https://www.ozon.ru/product/sviter-overrazmer-1102938471/",
        price: 5400,
      },
    ]
  );

  if (!getUserByEmail(DEMO_ACCOUNTS.shopper)) {
    const { user } = createUser(DEMO_ACCOUNTS.shopper, hashPassword(DEMO_PASSWORD), "shopper");
    markUserVerified(user.id);
  }

  if (!getUserByEmail(DEMO_ACCOUNTS.brand)) {
    const { user } = createUser(
      DEMO_ACCOUNTS.brand,
      hashPassword(DEMO_PASSWORD),
      "brand",
      "wildberries.ru"
    );
    markUserVerified(user.id);
    // The demo brand claims the two WB articles seeded above, so its
    // dashboard shows its own products rather than every WB link.
    setBrandArticles(user.id, ["172247725", "183920144"]);
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
