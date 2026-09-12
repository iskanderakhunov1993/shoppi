/**
 * Fills the database with a realistic dataset at the scale the product is
 * meant to hold: hundreds of creators, a hundred brands, a couple of
 * thousand shoppers, and clicks spread over the past month.
 *
 * Run with:  npm run seed:scale
 *
 * Password hashing is deliberately expensive (scrypt), so every generated
 * account shares one precomputed hash — hashing 2000 times would take
 * minutes and buys nothing for demo data.
 */
import { hashPassword } from "../lib/auth.ts";
import { placeholderAvatar } from "../lib/avatar.ts";
import {
  addFavorite,
  addLink,
  createUser,
  getUserByEmail,
  markUserVerified,
  recordClicksBulk,
  setBrandArticles,
  updateCreator,
  type Link,
} from "../lib/store.ts";

const CREATORS = 500;
const BRANDS = 100;
const SHOPPERS = 2000;
const CLICK_BATCHES = 20_000;

const FIRST = [
  "Анна", "Мария", "Соня", "Лена", "Катя", "Ирина", "Оля", "Настя", "Вера", "Юля",
  "Максим", "Игорь", "Артём", "Дима", "Паша", "Костя", "Никита", "Рома", "Влад", "Саша",
];
const LAST = [
  "Иванова", "Петрова", "Смирнов", "Кузнецов", "Попова", "Соколов", "Лебедева", "Новиков",
  "Морозова", "Волков", "Зайцева", "Павлов", "Семёнова", "Голубев", "Виноградова",
];

const CATEGORIES: Link["category"][] = ["cosmetics", "mens", "clothing", "tools"];

const TITLES: Record<Link["category"], string[]> = {
  cosmetics: [
    "Сыворотка с витамином C", "Крем для рук без отдушки", "Тонер с ниацинамидом",
    "Масло для губ", "Санскрин SPF 50", "Мицеллярная вода", "Патчи под глаза",
    "Шампунь для объёма", "Ночная маска", "Скраб для тела",
  ],
  mens: [
    "Триммер для бороды", "Термокружка", "Кожаный ремень", "Рюкзак на 30 литров",
    "Механические часы", "Гель для бритья", "Перчатки рабочие", "Складной нож для кемпинга",
    "Фонарь налобный", "Спортивная сумка",
  ],
  clothing: [
    "Пальто из шерсти", "Свитер оверсайз", "Джинсы прямого кроя", "Белая рубашка",
    "Кроссовки на каждый день", "Тренч бежевый", "Платье миди", "Худи без принта",
    "Юбка плиссе", "Куртка-бомбер",
  ],
  tools: [
    "Аккумуляторный шуруповёрт", "Набор отвёрток", "Электролобзик", "Шуруповёрт-дрель",
    "Мультиметр цифровой", "Набор гаечных ключей", "Строительный уровень", "Клеевой пистолет",
    "Паяльная станция", "Набор бит для шуруповёрта",
  ],
};

const BIOS = [
  "Покупаю сама, советую только то, что осталось в ротации.",
  "Без спонсорских восторгов — что не понравилось, о том не пишу.",
  "Проверяю вещи сезоном, а не одной неделей.",
  "Люблю простые вещи, которые не надоедают.",
  "Тут только то, что заказала повторно.",
];

const MARKETPLACES = [
  { host: "www.wildberries.ru", path: (a: string) => `/catalog/${a}/detail.aspx` },
  { host: "www.ozon.ru", path: (a: string) => `/product/tovar-${a}/` },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 3600_000 - randomInt(0, 86_400_000)).toISOString();
}

/** Runs `fn` over `items` with at most `concurrency` in flight at once — a
 * real Postgres connection has round-trip latency a local SQLite file never
 * did, so a plain sequential loop over thousands of rows would be very slow. */
async function pool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const item = items[i++];
      await fn(item);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

async function main() {
  console.log("Наполняю базу…");
  const started = Date.now();
  const sharedHash = hashPassword("demo1234");

  /* -------------------------------------------------------- creators */

  const allLinks: { id: string; creatorId: string }[] = [];
  const allArticles: string[] = [];

  let createdCreators = 0;
  await pool(Array.from({ length: CREATORS }, (_, i) => i), 20, async (i) => {
    const email = `creator${i}@shoppi.dev`;
    if (await getUserByEmail(email)) return;

    const { user, creator } = await createUser(email, sharedHash, "creator");
    await markUserVerified(user.id);
    if (!creator) return;

    const name = `${pick(FIRST)} ${pick(LAST)}`;
    await updateCreator(creator.id, {
      displayName: name,
      bio: pick(BIOS),
      avatarUrl: placeholderAvatar(creator.slug),
    });

    const linkCount = randomInt(4, 25);
    for (let j = 0; j < linkCount; j++) {
      const category = pick(CATEGORIES);
      const article = String(randomInt(100_000_00, 999_999_99));
      const mp = pick(MARKETPLACES);

      const link = await addLink({
        creatorId: creator.id,
        title: pick(TITLES[category]),
        category,
        targetUrl: `https://${mp.host}${mp.path(article)}`,
        price: randomInt(390, 24_900),
        // Placeholder product shots: nonsense images, but they show the real
        // shape of a populated storefront, which an empty grid does not.
        imageUrl: `https://picsum.photos/seed/p${article}/600/450`,
        marketplace: mp.host.includes("wildberries") ? "wildberries" : "ozon",
        articleId: article,
      });

      allLinks.push({ id: link.id, creatorId: creator.id });
      allArticles.push(article);
    }

    createdCreators++;
    if (createdCreators % 100 === 0) console.log(`  кураторов: ${createdCreators}`);
  });
  console.log(`Кураторы: ${createdCreators}, ссылок: ${allLinks.length}`);

  /* ---------------------------------------------------------- brands */

  let createdBrands = 0;
  await pool(Array.from({ length: BRANDS }, (_, i) => i), 20, async (i) => {
    const email = `brand${i}@shoppi.dev`;
    if (await getUserByEmail(email)) return;

    const { user } = await createUser(email, sharedHash, "brand", "wildberries.ru");
    await markUserVerified(user.id);

    // Each brand claims a slice of real articles, so its dashboard is not
    // empty and every brand sees a different set.
    const claimed: string[] = [];
    for (let k = 0; k < randomInt(3, 15); k++) claimed.push(pick(allArticles));
    await setBrandArticles(user.id, [...new Set(claimed)]);

    createdBrands++;
  });
  console.log(`Бренды: ${createdBrands}`);

  /* -------------------------------------------------------- shoppers */

  const shopperIds: string[] = [];
  let createdShoppers = 0;
  await pool(Array.from({ length: SHOPPERS }, (_, i) => i), 30, async (i) => {
    const email = `shopper${i}@shoppi.dev`;
    const existing = await getUserByEmail(email);
    if (existing) {
      shopperIds.push(existing.id);
      return;
    }

    const { user } = await createUser(email, sharedHash, "shopper");
    await markUserVerified(user.id);
    shopperIds.push(user.id);
    createdShoppers++;

    if (createdShoppers % 500 === 0) console.log(`  шопперов: ${createdShoppers}`);
  });
  console.log(`Шопперы: ${createdShoppers}`);

  /* ---------------------------------------------------- favourites */

  let favorites = 0;
  const favoriteShoppers = shopperIds.slice(0, Math.floor(shopperIds.length * 0.4));
  await pool(favoriteShoppers, 30, async (userId) => {
    for (let k = 0; k < randomInt(1, 8); k++) {
      await addFavorite(userId, pick(allLinks).id);
      favorites++;
    }
  });
  console.log(`Избранное: ${favorites}`);

  /* -------------------------------------------------------- clicks */

  // Roughly a fifth of hits are link previews from messengers — that is
  // the whole reason the product separates live traffic from raw totals.
  // Inserted in bulk chunks rather than one row per round trip — 20,000
  // individual inserts over a real network connection would take far
  // longer than generating them does.
  const CHUNK = 1000;
  let clicks = 0;
  for (let start = 0; start < CLICK_BATCHES; start += CHUNK) {
    const chunkSize = Math.min(CHUNK, CLICK_BATCHES - start);
    const rows = Array.from({ length: chunkSize }, () => {
      const link = pick(allLinks);
      const isBot = Math.random() < 0.2;
      return {
        linkId: link.id,
        userAgent: isBot ? "TelegramBot (like TwitterBot)" : "Mozilla/5.0 (iPhone) Safari/604.1",
        isBot,
        fingerprint: `fp-${randomInt(1, 5000)}`,
        referrer: isBot ? undefined : "https://t.me/",
        // Spread across the last 30 days so the daily chart has a real
        // shape instead of one tall bar on the seeding date.
        clickedAt: isoDaysAgo(randomInt(0, 29)),
      };
    });
    await recordClicksBulk(rows);
    clicks += rows.length;
    console.log(`  кликов: ${clicks}`);
  }
  console.log(`Клики: ${clicks}`);

  console.log(`\nГотово за ${((Date.now() - started) / 1000).toFixed(1)} с`);
  console.log("Логин любого сгенерированного аккаунта: пароль demo1234");
  console.log("  куратор:  creator0@shoppi.dev");
  console.log("  бренд:    brand0@shoppi.dev");
  console.log("  шоппер:   shopper0@shoppi.dev");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
