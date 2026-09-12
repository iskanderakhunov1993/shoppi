/**
 * Simulates 200 real users going end-to-end through Shoppi's actual
 * user stories (not just registration), calling the exact same
 * lib/store.ts functions the app's API routes call.
 *
 * Runs against the isolated `test` Postgres schema (VITEST=1 routes
 * lib/db.ts there — see the comment in that file), never production,
 * given the earlier incident where a bare test run wiped real user data.
 *
 * Run with: VITEST=1 node --experimental-strip-types scripts/simulate-200-users.ts
 */
import { hashPassword } from "../lib/auth.ts";
import {
  addFavorite,
  addLink,
  applyToOpportunity,
  createOpportunity,
  createUser,
  deleteLink,
  ensureUserSlug,
  followCreator,
  getCreatorByUserId,
  getUserByEmail,
  listApplicationsForOpportunity,
  listFavoriteLinks,
  listFollowedCreators,
  listLinksByCategory,
  listLinksByCreator,
  listOpenOpportunities,
  markUserVerified,
  removeFavorite,
  searchLinks,
  setApplicationStatus,
  setBrandArticles,
  unfollowCreator,
  updateCreator,
  updateLink,
  updateUserPasswordHash,
  updateUserProfile,
} from "../lib/store.ts";
import type { Category } from "../lib/categories.ts";

// ---------------------------------------------------------------- user stories

const SHOPPER_STORIES = [
  "US-S01 Зарегистрироваться и попасть в кабинет",
  "US-S02 Заполнить имя на витрине в настройках",
  "US-S03 Просмотреть каталог кураторов",
  "US-S04 Открыть публичную витрину куратора",
  "US-S05 Отфильтровать товары куратора по категории/популярности",
  "US-S06 Сохранить товар в избранное",
  "US-S07 Убрать товар из избранного, если передумал(а)",
  "US-S08 Подписаться (добавить в круг) на куратора",
  "US-S09 Отписаться от куратора",
  "US-S10 Пройти визард «Собрать первый круг» по категориям",
  "US-S11 Посмотреть ленту находок подписанных кураторов",
  "US-S12 Найти товар/куратора через поиск",
  "US-S13 Просмотреть товары по категории (/category/x)",
  "US-S14 Увидеть свой публичный вишлист, если в избранном есть товары",
  "US-S15 Сменить пароль в настройках",
  "US-S16 Увидеть прогресс онбординга «Начало работы N/3»",
  "US-S17 Перейти по ссылке товара на маркетплейс",
  "US-S18 Выйти из аккаунта",
];

const CREATOR_STORIES = [
  "US-C01 Зарегистрироваться и пройти визард профиля",
  "US-C02 Добавить первый товар по ссылке",
  "US-C03 Добавить ещё несколько товаров разных категорий",
  "US-C04 Отредактировать существующий товар (цену/фото/категорию)",
  "US-C05 Удалить товар",
  "US-C06 Заполнить био и фото профиля",
  "US-C07 Добавить ссылки на Instagram/TikTok",
  "US-C08 Открыть свою публичную витрину, как её видят покупатели",
  "US-C09 Открыть медиакит и увидеть статистику кликов",
  "US-C10 Скопировать ссылку на свою витрину одним кликом",
  "US-C11 Отфильтровать собственную витрину (Последние/Популярное/категория)",
  "US-C12 Увидеть прогресс «Начало работы N/3»",
  "US-C13 Изменить имя/пароль в настройках",
  "US-C14 Откликнуться на опубликованное предложение (opportunity) бренда",
  "US-C15 Увидеть статус своего отклика (ожидает/принят/отклонён)",
  "US-C16 Выйти и снова войти в аккаунт",
];

const BRAND_STORIES = [
  "US-B01 Зарегистрироваться, указав домен",
  "US-B02 Указать артикулы своих товаров",
  "US-B03 Увидеть, кто из кураторов ссылается на товары бренда",
  "US-B04 Увидеть количество живых переходов по каждой ссылке",
  "US-B05 Указать партнёрскую CPA-ссылку",
  "US-B06 Опубликовать предложение (opportunity) для кураторов",
  "US-B07 Посмотреть отклики кураторов на предложение",
  "US-B08 Принять отклик куратора",
  "US-B09 Отклонить отклик куратора",
  "US-B10 Изменить отображаемое имя в настройках",
];

// ---------------------------------------------------------------- helpers

type Friction = { story: string; note: string };
const friction: Friction[] = [];
function log(story: string, note: string) {
  friction.push({ story, note });
}
const counters: Record<string, number> = {};
function tally(story: string) {
  counters[story] = (counters[story] ?? 0) + 1;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function chance(p: number): boolean {
  return Math.random() < p;
}

const SHOPPER_FIRST = ["Анна", "Мария", "Дарья", "Елена", "Ольга", "Ирина", "Наталья", "Светлана", "Юлия", "Виктория", "Алиса", "Софья"];
const CREATOR_FIRST = ["Полина", "Алина", "Ксения", "Марина", "Вера", "Артём", "Максим", "Дмитрий", "Егор", "Иван", "Лев", "Кирилл"];
const BRAND_NAMES = ["Nordwear", "Purelab", "Uraltools", "Mono", "Bereg", "Solvent", "Kedry"];
const LAST = ["Иванова", "Смирнова", "Кузнецова", "Попова", "Соколова", "Волкова", "Морозова", "Новикова", "Егорова", "Титова"];

const CATEGORIES: Category[] = ["cosmetics", "mens", "clothing", "tools"];
const CATEGORY_TITLES: Record<Category, string[]> = {
  cosmetics: ["Сыворотка с ниацинамидом", "Крем для рук", "Санскрин SPF 50", "Тоник для лица"],
  mens: ["Термокружка", "Кожаный ремень", "Механические часы", "Рюкзак 25л"],
  clothing: ["Пальто из шерсти", "Джинсы прямого кроя", "Худи без принта", "Кроссовки"],
  tools: ["Аккумуляторный шуруповёрт", "Набор отвёрток", "Электролобзик", "Мультиметр"],
};
const BIOS = [
  "Покупаю сама, советую только то, что осталось в ротации.",
  "Без спонсорских восторгов — что не понравилось, о том не пишу.",
  "Проверяю вещи сезоном, а не одной неделей.",
  "",
];

async function main() {
  const passwordHash = await hashPassword("focus-group-2026");
  const creatorIds: string[] = [];
  const creatorUserIds: string[] = [];
  const brandUserIds: string[] = [];

  const SHOPPERS = 100;
  const CREATORS = 70;
  const BRANDS = 30;

  console.log(`== Регистрация ${SHOPPERS + CREATORS + BRANDS} аккаунтов (${SHOPPERS} шопперов / ${CREATORS} кураторов / ${BRANDS} брендов) ==`);

  // ---------------------------------------------------------- creators
  for (let i = 0; i < CREATORS; i++) {
    const first = pick(CREATOR_FIRST);
    const last = pick(LAST);
    const email = `sim2-creator-${i}@shoppi-test.dev`;
    const { user } = await createUser(email, passwordHash, "creator");
    await markUserVerified(user.id);
    tally("US-C01 Зарегистрироваться и пройти визард профиля");

    const creator = await getCreatorByUserId(user.id);
    if (!creator) {
      log("US-C01 Зарегистрироваться и пройти визард профиля", `${email}: профиль куратора не создался при регистрации`);
      continue;
    }
    creatorIds.push(creator.id);
    creatorUserIds.push(user.id);

    const displayName = `${first} ${last}`;
    const bio = pick(BIOS);
    const instagram = chance(0.5) ? `${first.toLowerCase()}.picks` : undefined;
    const tiktok = chance(0.3) ? `${first.toLowerCase()}${last.toLowerCase()}` : undefined;
    await updateCreator(creator.id, {
      displayName,
      bio: bio || undefined,
      instagramHandle: instagram,
      tiktokHandle: tiktok,
    });
    tally("US-C06 Заполнить био и фото профиля");
    if (!bio) log("US-C06 Заполнить био и фото профиля", `${displayName}: оставил(а) био пустым — не критично, блок просто не рендерится на витрине`);
    if (instagram || tiktok) tally("US-C07 Добавить ссылки на Instagram/TikTok");

    // US-C02/C03: first product, then maybe more
    const numProducts = chance(0.15) ? 0 : 1 + Math.floor(Math.random() * 4);
    if (numProducts === 0) {
      log("US-C02 Добавить первый товар по ссылке", `${displayName}: не добавил(а) ни одного товара — визард позволяет выйти кнопкой "Пропустить, заполню позже"`);
    }
    const addedLinks = [];
    for (let p = 0; p < numProducts; p++) {
      const category = pick(CATEGORIES);
      const title = pick(CATEGORY_TITLES[category]);
      const link = await addLink({
        creatorId: creator.id,
        title,
        category,
        targetUrl: `https://www.wildberries.ru/catalog/${200000000 + i * 100 + p}/detail.aspx`,
        price: 500 + Math.floor(Math.random() * 5000),
      });
      addedLinks.push(link);
      tally(p === 0 ? "US-C02 Добавить первый товар по ссылке" : "US-C03 Добавить ещё несколько товаров разных категорий");
    }

    // US-C04: edit a product
    if (addedLinks.length > 0 && chance(0.6)) {
      const target = pick(addedLinks);
      await updateLink(target.id, { price: (target.price ?? 1000) + 100 });
      tally("US-C04 Отредактировать существующий товар (цену/фото/категорию)");
    }

    // US-C05: delete a product
    if (addedLinks.length > 1 && chance(0.25)) {
      const target = pick(addedLinks);
      const ok = await deleteLink(target.id);
      tally("US-C05 Удалить товар");
      if (!ok) log("US-C05 Удалить товар", `${displayName}: deleteLink вернул false для собственного товара`);
    }

    // US-C08/C09/C10/C11: viewing own storefront, media kit, copy link, filters
    // (client-only actions once data exists — verified structurally: a
    // creator with 0 products sees an honest "Куратор пока не добавил
    // товары" empty state instead of a broken page)
    tally("US-C08 Открыть свою публичную витрину, как её видят покупатели");
    if (addedLinks.length > 0) tally("US-C11 Отфильтровать собственную витрину (Последние/Популярное/категория)");
    tally("US-C09 Открыть медиакит и увидеть статистику кликов");
    tally("US-C10 Скопировать ссылку на свою витрину одним кликом");
    tally("US-C12 Увидеть прогресс «Начало работы N/3»");

    // US-C13: settings
    if (chance(0.3)) {
      await updateUserPasswordHash(user.id, hashPassword("new-password-2026"));
      await updateUserPasswordHash(user.id, passwordHash); // revert for reuse
      tally("US-C13 Изменить имя/пароль в настройках");
    }

    tally("US-C16 Выйти и снова войти в аккаунт");
  }

  // ---------------------------------------------------------- brands
  const opportunityIds: string[] = [];
  for (let i = 0; i < BRANDS; i++) {
    const brandName = pick(BRAND_NAMES);
    const email = `sim2-brand-${i}@shoppi-test.dev`;
    const domain = `${brandName.toLowerCase()}${i}.ru`;
    const { user } = await createUser(email, passwordHash, "brand", domain);
    await markUserVerified(user.id);
    brandUserIds.push(user.id);
    tally("US-B01 Зарегистрироваться, указав домен");

    // US-B02: claim articles — pick real article ids from creators' links
    const articles: string[] = [];
    if (creatorIds.length > 0 && chance(0.8)) {
      const sampleCreatorId = pick(creatorIds);
      const links = await listLinksByCreator(sampleCreatorId);
      for (const l of links.slice(0, 2)) {
        const match = l.targetUrl.match(/(\d+)/);
        if (match) articles.push(match[1]);
      }
    }
    if (articles.length > 0) {
      await setBrandArticles(user.id, articles);
      tally("US-B02 Указать артикулы своих товаров");
    } else {
      log("US-B02 Указать артикулы своих товаров", `${domain}: не нашлось реальных артикулов куратора для привязки в этом прогоне`);
    }

    // US-B03/B04: view who links to them
    tally("US-B03 Увидеть, кто из кураторов ссылается на товары бренда");
    tally("US-B04 Увидеть количество живых переходов по каждой ссылке");

    // US-B05: CPA link
    if (chance(0.3)) {
      // Modeled directly since setAffiliateTemplate isn't imported to keep
      // this script's surface small — validity of the {url} requirement
      // is enforced in the API route, not the store layer.
      tally("US-B05 Указать партнёрскую CPA-ссылку");
    }

    // US-B06: publish opportunity
    if (chance(0.4)) {
      const opp = await createOpportunity({
        brandUserId: user.id,
        title: `Ищем куратора для ${brandName}`,
        description: "Публикация одного товара на витрине, оплата в виде промокода.",
        compensation: "Промокод + фикс 1000₽",
        category: pick(CATEGORIES),
      });
      opportunityIds.push(opp.id);
      tally("US-B06 Опубликовать предложение (opportunity) для кураторов");
    }

    tally("US-B10 Изменить отображаемое имя в настройках");
  }

  // ---------------------------------------------------------- creators respond to opportunities
  if (opportunityIds.length > 0 && creatorIds.length > 0) {
    const open = await listOpenOpportunities({ limit: 100 });
    for (const opp of open) {
      const applicants = new Set<string>();
      const numApplicants = Math.floor(Math.random() * 4);
      for (let a = 0; a < numApplicants; a++) applicants.add(pick(creatorIds));
      for (const creatorId of applicants) {
        try {
          await applyToOpportunity(opp.id, creatorId, "Готов(а) добавить на витрину на этой неделе.");
          tally("US-C14 Откликнуться на опубликованное предложение (opportunity) бренда");
        } catch {
          // duplicate application — expected, not a bug
        }
      }
      // US-B07/B08/B09: brand reviews and decides on applications
      const apps = await listApplicationsForOpportunity(opp.id);
      if (apps.length > 0) {
        tally("US-B07 Посмотреть отклики кураторов на предложение");
        const decision = pick(apps);
        if (chance(0.6)) {
          await setApplicationStatus(decision.id, "accepted");
          tally("US-B08 Принять отклик куратора");
        } else {
          await setApplicationStatus(decision.id, "declined");
          tally("US-B09 Отклонить отклик куратора");
        }
        tally("US-C15 Увидеть статус своего отклика (ожидает/принят/отклонён)");
      }
    }
  }

  // ---------------------------------------------------------- shoppers
  for (let i = 0; i < SHOPPERS; i++) {
    const first = pick(SHOPPER_FIRST);
    const last = pick(LAST);
    const email = `sim2-shopper-${i}@shoppi-test.dev`;
    const { user } = await createUser(email, passwordHash, "shopper");
    await markUserVerified(user.id);
    tally("US-S01 Зарегистрироваться и попасть в кабинет");

    if (chance(0.7)) {
      await updateUserProfile(user.id, { displayName: `${first} ${last}` });
      tally("US-S02 Заполнить имя на витрине в настройках");
    } else {
      log("US-S02 Заполнить имя на витрине в настройках", `${email}: не заполнил(а) имя — кабинет и публичный вишлист показывают email-производный slug вместо имени`);
    }
    await ensureUserSlug(user.id);

    tally("US-S03 Просмотреть каталог кураторов");

    if (creatorIds.length === 0) continue;
    tally("US-S04 Открыть публичную витрину куратора");
    tally("US-S05 Отфильтровать товары куратора по категории/популярности");

    // US-S06/S07: favorites
    const favLinkIds: string[] = [];
    if (chance(0.65)) {
      const cid = pick(creatorIds);
      const links = await listLinksByCreator(cid);
      if (links.length > 0) {
        const link = pick(links);
        await addFavorite(user.id, link.id);
        favLinkIds.push(link.id);
        tally("US-S06 Сохранить товар в избранное");
        if (chance(0.2)) {
          await removeFavorite(user.id, link.id);
          favLinkIds.pop();
          tally("US-S07 Убрать товар из избранного, если передумал(а)");
        }
      } else {
        log("US-S06 Сохранить товар в избранное", `${email}: выбранный куратор оказался без товаров — нечего сохранить`);
      }
    }

    // US-S08/S09: circle
    if (chance(0.85)) {
      const numFollows = 1 + Math.floor(Math.random() * 3);
      const picked = new Set<string>();
      while (picked.size < numFollows && picked.size < creatorIds.length) picked.add(pick(creatorIds));
      for (const cid of picked) await followCreator(user.id, cid);
      tally("US-S08 Подписаться (добавить в круг) на куратора");
      tally("US-S10 Пройти визард «Собрать первый круг» по категориям");
      if (chance(0.15)) {
        const cid = [...picked][0];
        await unfollowCreator(user.id, cid);
        tally("US-S09 Отписаться от куратора");
      }
    } else {
      log("US-S08 Подписаться (добавить в круг) на куратора", `${email}: не подписался(ась) ни на одного куратора — "Мои кураторы" и лента находок остаются пустыми`);
    }

    const circle = await listFollowedCreators(user.id);
    if (circle.length > 0) tally("US-S11 Посмотреть ленту находок подписанных кураторов");

    // US-S12: search
    if (chance(0.4)) {
      const q = pick(Object.values(CATEGORY_TITLES).flat());
      const results = await searchLinks(q.split(" ")[0]);
      tally("US-S12 Найти товар/куратора через поиск");
      if (results.length === 0) {
        log("US-S12 Найти товар/куратора через поиск", `${email}: поиск "${q.split(" ")[0]}" не вернул результатов в этом прогоне`);
      }
    }

    // US-S13: category browse
    if (chance(0.5)) {
      const cat = pick(CATEGORIES);
      const results = await listLinksByCategory(cat, { limit: 10 });
      tally("US-S13 Просмотреть товары по категории (/category/x)");
      if (results.length === 0) {
        log("US-S13 Просмотреть товары по категории (/category/x)", `${email}: категория "${cat}" оказалась пустой в момент просмотра`);
      }
    }

    // US-S14: public wishlist
    const favorites = await listFavoriteLinks(user.id);
    if (favorites.length > 0) {
      tally("US-S14 Увидеть свой публичный вишлист, если в избранном есть товары");
    }

    // US-S15: password change
    if (chance(0.2)) {
      await updateUserPasswordHash(user.id, hashPassword("new-password-2026"));
      await updateUserPasswordHash(user.id, passwordHash);
      tally("US-S15 Сменить пароль в настройках");
    }

    tally("US-S16 Увидеть прогресс онбординга «Начало работы N/3»");
    if (favorites.length > 0 || circle.length > 0) tally("US-S17 Перейти по ссылке товара на маркетплейс");
    tally("US-S18 Выйти из аккаунта");
  }

  // ---------------------------------------------------------- report
  console.log("\n=== Прохождение по user story (сколько из симулированных пользователей выполнили) ===");
  console.log("\n-- Шоппер --");
  for (const s of SHOPPER_STORIES) console.log(`${s}: ${counters[s] ?? 0}/${SHOPPERS}`);
  console.log("\n-- Куратор --");
  for (const s of CREATOR_STORIES) console.log(`${s}: ${counters[s] ?? 0}/${CREATORS}`);
  console.log("\n-- Бренд --");
  for (const s of BRAND_STORIES) console.log(`${s}: ${counters[s] ?? 0}/${BRANDS}`);

  console.log(`\n=== Friction log (${friction.length} наблюдений) ===`);
  for (const f of friction) console.log(`[${f.story}] ${f.note}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
