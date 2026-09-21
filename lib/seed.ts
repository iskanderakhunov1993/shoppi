import { randomBytes } from "crypto";
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
import { placeholderAvatar } from "./avatar.ts";
import type { Category } from "./categories.ts";

// Seeds a handful of already-verified accounts so the login page can offer
// one-click demo logins and the landing page has real storefronts to link
// to. Idempotent — safe to call on every request.
const DEMO_PASSWORD = "demo1234";

// In production the seeded showcase accounts get an unguessable password:
// they exist so their storefronts can be linked from the landing page,
// not so anyone can sign in as them.
function seedPasswordHash(): string {
  return hashPassword(process.env.NODE_ENV === "production" ? randomBytes(32).toString("hex") : DEMO_PASSWORD);
}
export const DEMO_ACCOUNTS: Record<Role, string> = {
  shopper: "demo-shopper@myshop.dev",
  creator: "demo-creator@myshop.dev",
  brand: "demo-brand@myshop.dev",
};

const LANDING_CREATORS = ["landing-maxim@shoppi.dev", "landing-sonya@shoppi.dev"];

type SeedLink = {
  title: string;
  category: Category;
  url: string;
  price: number;
  image?: string;
};

export async function seedCreatorAccount(
  email: string,
  displayName: string,
  bio: string,
  links: SeedLink[],
  passwordHash?: string
): Promise<Creator | undefined> {
  const existing = await getUserByEmail(email);
  if (existing) return getCreatorByUserId(existing.id);

  const { user, creator } = await createUser(email, passwordHash ?? seedPasswordHash(), "creator");
  await markUserVerified(user.id);
  if (!creator) return undefined;

  await updateCreator(creator.id, { displayName, bio, avatarUrl: placeholderAvatar(creator.slug) });

  for (const link of links) {
    const { marketplace, articleId } = parseMarketplaceItem(link.url);
    await addLink({
      creatorId: creator.id,
      title: link.title,
      category: link.category,
      targetUrl: link.url,
      price: link.price,
      imageUrl: link.image,
      marketplace,
      articleId,
    });
  }

  return getCreatorByUserId(user.id);
}

async function runSeed(): Promise<void> {
  await seedCreatorAccount(
    DEMO_ACCOUNTS.creator,
    "Белла",
    "Уход, который правда работает — то, что покупаю не первый раз.",
    [
      {
        title: "Сыворотка с витамином C",
        category: "cosmetics",
        url: "https://www.wildberries.ru/catalog/172247725/detail.aspx",
        image: "https://picsum.photos/seed/shoppi-serum/600/450",
        price: 2490,
      },
      {
        title: "Крем для рук, без отдушки",
        category: "cosmetics",
        url: "https://www.letu.ru/product/krem-dlya-ruk-101",
        image: "https://picsum.photos/seed/shoppi-cream/600/450",
        price: 690,
      },
    ]
  );

  await seedCreatorAccount(
    LANDING_CREATORS[0],
    "Максим",
    "Инструменты и снаряжение, которые проверил сам — ничего лишнего.",
    [
      {
        title: "Складной нож для кемпинга",
        category: "mens",
        url: "https://www.wildberries.ru/catalog/183920144/detail.aspx",
        image: "https://picsum.photos/seed/shoppi-knife/600/450",
        price: 4200,
      },
      {
        title: "Механический триммер для бороды",
        category: "mens",
        url: "https://www.ozon.ru/product/trimmer-dlya-borody-1284900733/",
        image: "https://picsum.photos/seed/shoppi-trimmer/600/450",
        price: 3190,
      },
    ]
  );

  await seedCreatorAccount(
    LANDING_CREATORS[1],
    "Соня",
    "Базовый гардероб на каждый день — вещи, которые ношу сезон за сезоном.",
    [
      {
        title: "Пальто из шерсти, серое",
        category: "clothing",
        url: "https://www.lamoda.ru/p/palto-sherstyanoe-770211/",
        image: "https://picsum.photos/seed/shoppi-coat/600/450",
        price: 14900,
      },
      {
        title: "Свитер оверсайз, бежевый",
        category: "clothing",
        url: "https://www.ozon.ru/product/sviter-overrazmer-1102938471/",
        image: "https://picsum.photos/seed/shoppi-sweater/600/450",
        price: 5400,
      },
    ]
  );

  if (!(await getUserByEmail(DEMO_ACCOUNTS.shopper))) {
    const { user } = await createUser(DEMO_ACCOUNTS.shopper, seedPasswordHash(), "shopper");
    await markUserVerified(user.id);
  }

  if (!(await getUserByEmail(DEMO_ACCOUNTS.brand))) {
    const { user } = await createUser(
      DEMO_ACCOUNTS.brand,
      seedPasswordHash(),
      "brand",
      "wildberries.ru"
    );
    await markUserVerified(user.id);
    // The demo brand claims the two WB articles seeded above, so its
    // dashboard shows its own products rather than every WB link.
    await setBrandArticles(user.id, ["172247725", "183920144"]);
  }
}

export async function getDemoCreatorSlug(): Promise<string | undefined> {
  const user = await getUserByEmail(DEMO_ACCOUNTS.creator);
  return user ? (await getCreatorByUserId(user.id))?.slug : undefined;
}

// Public pages call this on every request. The seed is idempotent but
// costs several sequential DB round trips, so run it once per server
// instance and let later requests reuse the result. A failure clears
// the cache so the next request retries.
let seeded: Promise<void> | null = null;
export function seedDemoAccounts(): Promise<void> {
  seeded ??= runSeed().catch((err) => {
    seeded = null;
    throw err;
  });
  return seeded;
}

export async function listLandingCreators(): Promise<Creator[]> {
  const emails = [DEMO_ACCOUNTS.creator, ...LANDING_CREATORS];
  const users = (await Promise.all(emails.map((email) => getUserByEmail(email)))).filter(
    (u): u is NonNullable<typeof u> => Boolean(u)
  );
  const creators = await Promise.all(users.map((u) => getCreatorByUserId(u.id)));
  return creators.filter((c): c is Creator => Boolean(c));
}

export { DEMO_PASSWORD };
