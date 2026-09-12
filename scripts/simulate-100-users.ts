/**
 * Simulates 100 real users going through Shoppi start-to-finish, calling
 * the exact same lib/store.ts functions the app's API routes call — so
 * this exercises real business logic, not a mock.
 *
 * Runs against the isolated `test` Postgres schema (VITEST=1 routes
 * lib/db.ts there — see the comment in that file), never production,
 * given the earlier incident where a bare test run wiped real user data.
 *
 * Run with: VITEST=1 node --experimental-strip-types scripts/simulate-100-users.ts
 */
import { hashPassword } from "../lib/auth.ts";
import {
  addFavorite,
  addLink,
  createUser,
  ensureUserSlug,
  followCreator,
  getCreatorByUserId,
  markUserVerified,
  updateCreator,
  updateUserProfile,
} from "../lib/store.ts";
import type { Category } from "../lib/categories.ts";

type Friction = { step: string; note: string };
const friction: Friction[] = [];
function log(step: string, note: string) {
  friction.push({ step, note });
}

const SHOPPER_FIRST = ["Анна", "Мария", "Дарья", "Елена", "Ольга", "Ирина", "Наталья", "Светлана", "Юлия", "Виктория"];
const CREATOR_FIRST = ["Полина", "Алина", "Ксения", "Марина", "Вера", "Артём", "Максим", "Дмитрий", "Егор", "Иван"];
const BRAND_NAMES = ["Nordwear", "Purelab", "Uraltools", "Mono", "Bereg"];
const LAST = ["Иванова", "Смирнова", "Кузнецова", "Попова", "Соколова", "Волкова", "Морозова", "Новикова"];

const CATEGORIES: Category[] = ["cosmetics", "mens", "clothing", "tools"];
const CATEGORY_TITLES: Record<Category, string[]> = {
  cosmetics: ["Сыворотка с ниацинамидом", "Крем для рук", "Санскрин SPF 50"],
  mens: ["Термокружка", "Кожаный ремень", "Механические часы"],
  clothing: ["Пальто из шерсти", "Джинсы прямого кроя", "Худи без принта"],
  tools: ["Аккумуляторный шуруповёрт", "Набор отвёрток", "Электролобзик"],
};
const BIOS = [
  "Покупаю сама, советую только то, что осталось в ротации.",
  "Без спонсорских восторгов — что не понравилось, о том не пишу.",
  "Проверяю вещи сезоном, а не одной неделей.",
  "",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const passwordHash = await hashPassword("focus-group-2026");
  let created = 0;
  const creatorIds: string[] = [];

  console.log("== Этап 1: регистрация 100 аккаунтов (60 шопперов / 30 кураторов / 10 брендов) ==");

  for (let i = 0; i < 100; i++) {
    const role = i < 60 ? "shopper" : i < 90 ? "creator" : "brand";
    const first = role === "shopper" ? pick(SHOPPER_FIRST) : pick(CREATOR_FIRST);
    const last = pick(LAST);
    const email = `focus-${role}-${i}@shoppi-test.dev`;

    let user;
    try {
      const brandDomain = role === "brand" ? `${pick(BRAND_NAMES).toLowerCase()}${i}.ru` : undefined;
      const res = await createUser(email, passwordHash, role, brandDomain);
      user = res.user;
    } catch (e) {
      log("registration", `Ошибка регистрации ${email}: ${(e as Error).message}`);
      continue;
    }

    // Real signups sit unverified until they click an email link — this
    // demo has no mail server, so quick-login/seed paths mark verified
    // directly. Worth flagging: a real cold-start user hits a "check
    // your email" wall right after filling the form, with zero visible
    // progress until they do — no resend-timer, no "did it arrive?" state.
    await markUserVerified(user.id);
    created++;

    if (role === "creator") {
      const creator = await getCreatorByUserId(user.id);
      if (!creator) {
        log("onboarding", `У ${email} не создался профиль куратора`);
        continue;
      }
      creatorIds.push(creator.id);

      const displayName = `${first} ${last}`;
      const bio = pick(BIOS);
      await updateCreator(creator.id, { displayName, bio: bio || undefined });
      if (!bio) {
        log(
          "onboarding-creator",
          `${displayName}: пропустил(а) био — на публичной витрине блок "О себе" просто не рендерится, ок`
        );
      }

      const numProducts = 1 + Math.floor(Math.random() * 4); // 1-4
      if (numProducts === 1) {
        log(
          "products",
          `${displayName}: добавил(а) только 1 товар и остановился — визард отпускает после первого товара ("Добавлю позже"), реальные кураторы вполне могут не вернуться`
        );
      }
      for (let p = 0; p < numProducts; p++) {
        const category = pick(CATEGORIES);
        const title = pick(CATEGORY_TITLES[category]);
        try {
          await addLink({
            creatorId: creator.id,
            title,
            category,
            targetUrl: `https://www.wildberries.ru/catalog/${100000000 + i * 100 + p}/detail.aspx`,
            price: 500 + Math.floor(Math.random() * 5000),
          });
        } catch (e) {
          log("products", `Не удалось добавить товар для ${displayName}: ${(e as Error).message}`);
        }
      }
    }

    if (role === "shopper") {
      await updateUserProfile(user.id, { displayName: `${first} ${last}` });
      await ensureUserSlug(user.id);
    }
  }

  console.log(`Создано ${created} аккаунтов.`);
  console.log("== Этап 2: шопперы собирают круг и избранное ==");

  // Shoppers follow creators seeded above — this is the exact same
  // "follow" action /api/follows performs.
  const { getUserByEmail, listFollowedCreators, listFavoriteLinks, listLinksByCreator } = await import(
    "../lib/store.ts"
  );

  let noCircle = 0;
  let noFavorites = 0;
  for (let i = 0; i < 60; i++) {
    const email = `focus-shopper-${i}@shoppi-test.dev`;
    const user = await getUserByEmail(email);
    if (!user) continue;

    // Real behavior isn't uniform — model that instead of everyone doing
    // everything, or the simulation tells us nothing about drop-off.
    const followsCircle = Math.random() > 0.15; // 85% follow at least one creator
    const savesFavorite = Math.random() > 0.35; // 65% save at least one product

    if (followsCircle) {
      const numFollows = 1 + Math.floor(Math.random() * 3);
      const picked = new Set<string>();
      while (picked.size < numFollows && picked.size < creatorIds.length) {
        picked.add(pick(creatorIds));
      }
      for (const cid of picked) await followCreator(user.id, cid);
    } else {
      noCircle++;
    }

    if (savesFavorite && creatorIds.length > 0) {
      const cid = pick(creatorIds);
      const links = await listLinksByCreator(cid);
      if (links.length > 0) await addFavorite(user.id, pick(links).id);
      else noFavorites++;
    } else if (!savesFavorite) {
      noFavorites++;
    }
  }

  log(
    "circle",
    `${noCircle}/60 шопперов (${Math.round((noCircle / 60) * 100)}%) не подписались ни на одного куратора — у них "Мои кураторы" пуст, они видят только CTA "Собрать первый круг"`
  );
  log(
    "wishlist",
    `${noFavorites}/60 шопперов не сохранили ни одного товара — их публичный /wishlist/[slug] существует, но полностью пуст, если кто-то откроет ссылку`
  );

  console.log("== Этап 3: проверка результата ==");
  const sampleShopper = await getUserByEmail("focus-shopper-0@shoppi-test.dev");
  if (sampleShopper) {
    const circle = await listFollowedCreators(sampleShopper.id);
    const favs = await listFavoriteLinks(sampleShopper.id);
    console.log(`Пример (focus-shopper-0): круг из ${circle.length}, избранное из ${favs.length}`);
  }

  console.log("\n=== Отмеченные проблемы (friction log) ===");
  for (const f of friction) console.log(`[${f.step}] ${f.note}`);

  console.log(`\nВсего наблюдений: ${friction.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
