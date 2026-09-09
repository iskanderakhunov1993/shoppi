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
  recordClick,
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

const CATEGORIES: Link["category"][] = ["cosmetics", "mens", "clothing"];

const TITLES: Record<Link["category"], string[]> = {
  cosmetics: [
    "Сыворотка с витамином C", "Крем для рук без отдушки", "Тонер с ниацинамидом",
    "Масло для губ", "Санскрин SPF 50", "Мицеллярная вода", "Патчи под глаза",
    "Шампунь для объёма", "Ночная маска", "Скраб для тела",
  ],
  mens: [
    "Складной нож для кемпинга", "Триммер для бороды", "Термокружка", "Набор отвёрток",
    "Кожаный ремень", "Рюкзак на 30 литров", "Механические часы", "Гель для бритья",
    "Фонарь налобный", "Перчатки рабочие",
  ],
  clothing: [
    "Пальто из шерсти", "Свитер оверсайз", "Джинсы прямого кроя", "Белая рубашка",
    "Кроссовки на каждый день", "Тренч бежевый", "Платье миди", "Худи без принта",
    "Юбка плиссе", "Куртка-бомбер",
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

console.log("Наполняю базу…");
const started = Date.now();
const sharedHash = hashPassword("demo1234");

/* ---------------------------------------------------------- creators */

const allLinks: { id: string; creatorId: string }[] = [];
const allArticles: string[] = [];

let createdCreators = 0;
for (let i = 0; i < CREATORS; i++) {
  const email = `creator${i}@shoppi.dev`;
  if (getUserByEmail(email)) continue;

  const { user, creator } = createUser(email, sharedHash, "creator");
  markUserVerified(user.id);
  if (!creator) continue;

  const name = `${pick(FIRST)} ${pick(LAST)}`;
  updateCreator(creator.id, {
    displayName: name,
    bio: pick(BIOS),
    avatarUrl: placeholderAvatar(creator.slug),
  });

  const linkCount = randomInt(4, 25);
  for (let j = 0; j < linkCount; j++) {
    const category = pick(CATEGORIES);
    const article = String(randomInt(100_000_00, 999_999_99));
    const mp = pick(MARKETPLACES);

    const link = addLink({
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
}
console.log(`Кураторы: ${createdCreators}, ссылок: ${allLinks.length}`);

/* ------------------------------------------------------------ brands */

let createdBrands = 0;
for (let i = 0; i < BRANDS; i++) {
  const email = `brand${i}@shoppi.dev`;
  if (getUserByEmail(email)) continue;

  const { user } = createUser(email, sharedHash, "brand", "wildberries.ru");
  markUserVerified(user.id);

  // Each brand claims a slice of real articles, so its dashboard is not
  // empty and every brand sees a different set.
  const claimed: string[] = [];
  for (let k = 0; k < randomInt(3, 15); k++) claimed.push(pick(allArticles));
  setBrandArticles(user.id, [...new Set(claimed)]);

  createdBrands++;
}
console.log(`Бренды: ${createdBrands}`);

/* ---------------------------------------------------------- shoppers */

const shopperIds: string[] = [];
let createdShoppers = 0;
for (let i = 0; i < SHOPPERS; i++) {
  const email = `shopper${i}@shoppi.dev`;
  const existing = getUserByEmail(email);
  if (existing) {
    shopperIds.push(existing.id);
    continue;
  }

  const { user } = createUser(email, sharedHash, "shopper");
  markUserVerified(user.id);
  shopperIds.push(user.id);
  createdShoppers++;

  if (createdShoppers % 500 === 0) console.log(`  шопперов: ${createdShoppers}`);
}
console.log(`Шопперы: ${createdShoppers}`);

/* ------------------------------------------------------ favourites */

let favorites = 0;
for (const userId of shopperIds.slice(0, Math.floor(shopperIds.length * 0.4))) {
  for (let k = 0; k < randomInt(1, 8); k++) {
    addFavorite(userId, pick(allLinks).id);
    favorites++;
  }
}
console.log(`Избранное: ${favorites}`);

/* ---------------------------------------------------------- clicks */

// Roughly a fifth of hits are link previews from messengers — that is the
// whole reason the product separates live traffic from raw totals.
let clicks = 0;
for (let i = 0; i < CLICK_BATCHES; i++) {
  const link = pick(allLinks);
  const isBot = Math.random() < 0.2;
  recordClick(link.id, {
    userAgent: isBot ? "TelegramBot (like TwitterBot)" : "Mozilla/5.0 (iPhone) Safari/604.1",
    isBot,
    fingerprint: `fp-${randomInt(1, 5000)}`,
    referrer: isBot ? undefined : "https://t.me/",
    // Spread across the last 30 days so the daily chart has a real shape
    // instead of one tall bar on the seeding date.
    clickedAt: isoDaysAgo(randomInt(0, 29)),
  });
  clicks++;
  if (clicks % 5000 === 0) console.log(`  кликов: ${clicks}`);
}
console.log(`Клики: ${clicks}`);

console.log(`\nГотово за ${((Date.now() - started) / 1000).toFixed(1)} с`);
console.log("Логин любого сгенерированного аккаунта: пароль demo1234");
console.log("  куратор:  creator0@shoppi.dev");
console.log("  бренд:    brand0@shoppi.dev");
console.log("  шоппер:   shopper0@shoppi.dev");
